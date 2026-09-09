// === Scholar Code ===
// A coding view in the same spirit as Claude Code: a file tree, an editor, a
// live preview, and a chat that writes straight into the files.
//
// What it deliberately is not: Scholar is a static page in a browser tab, so
// it cannot run a shell, install packages, or touch the disk on your PC. There
// is no sandbox on the other end to run them in — AnythingLLM's own filesystem
// skill is gated to its Docker runtime and its `cli` plugin is development
// only. So the files here live in this browser, previews run in a sandboxed
// iframe, and "running code" means HTML/CSS/JS in that iframe. Everything
// else — writing, refactoring, explaining, reviewing — goes through the model
// with the real file contents in the prompt.
//
// The one bridge to the rest of Scholar: files can be pushed into a project,
// where they become documents that every chat in that project can retrieve.

const ScholarCode = {
  FILES_KEY: 'scholar-code-files',
  OPEN_KEY: 'scholar-code-open',

  files: {},        // { path: contents }
  openPath: null,
  dirty: false,
  visible: false,
  streaming: false,
  abortController: null,
  // Conversation for the code chat, kept separate from the main chat so a
  // coding session doesn't bury the chat history.
  messages: [],

  el: {},

  init() {
    const $ = (s) => document.querySelector(s);
    this.el = {
      view: $('#code-view'),
      closeBtn: $('#code-close'),
      tree: $('#code-tree'),
      newFileBtn: $('#code-new-file'),
      pushBtn: $('#code-push-project'),
      editorWrap: $('#code-editor-wrap'),
      editor: $('#code-editor'),
      highlight: $('#code-highlight'),
      filename: $('#code-filename'),
      saveState: $('#code-save-state'),
      runBtn: $('#code-run'),
      deleteBtn: $('#code-delete'),
      preview: $('#code-preview'),
      previewWrap: $('#code-preview-wrap'),
      previewClose: $('#code-preview-close'),
      chatLog: $('#code-chat-log'),
      chatInput: $('#code-chat-input'),
      chatSend: $('#code-chat-send'),
      chatStop: $('#code-chat-stop'),
      chatContext: $('#code-chat-context'),
      status: $('#code-status'),
      tabs: $('#code-tabs'),
    };

    this.load();

    const e = this.el;
    if (e.closeBtn) e.closeBtn.addEventListener('click', () => this.hide());
    if (e.newFileBtn) e.newFileBtn.addEventListener('click', () => this.promptNewFile());
    if (e.deleteBtn) e.deleteBtn.addEventListener('click', () => this.deleteOpen());
    if (e.runBtn) e.runBtn.addEventListener('click', () => this.run());
    if (e.previewClose) e.previewClose.addEventListener('click', () => this.closePreview());
    if (e.pushBtn) e.pushBtn.addEventListener('click', () => this.pushToProject());
    if (e.chatSend) e.chatSend.addEventListener('click', () => this.send());
    if (e.chatStop) e.chatStop.addEventListener('click', () => this.stop());

    if (e.editor) {
      e.editor.addEventListener('input', () => this.onEdit());
      e.editor.addEventListener('scroll', () => this.syncScroll());
      // Tab indents instead of leaving the editor, which is the single most
      // irritating default in a plain textarea.
      e.editor.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Tab') return;
        ev.preventDefault();
        const el = ev.target;
        const { selectionStart: s, selectionEnd: en, value } = el;
        el.value = value.slice(0, s) + '  ' + value.slice(en);
        el.selectionStart = el.selectionEnd = s + 2;
        this.onEdit();
      });
    }

    if (e.chatInput) {
      e.chatInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
          ev.preventDefault();
          this.send();
        }
      });
    }

    if (e.tabs) {
      e.tabs.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.code-tab');
        if (btn) this.setPane(btn.dataset.pane);
      });
    }
    this.setPane('editor');
  },

  // Which pane the phone layout is showing. Ignored above 900px, where all
  // three are visible side by side and the tab bar is hidden.
  setPane(pane) {
    this.pane = pane;
    this.el.view.dataset.pane = pane;
    this.el.tabs?.querySelectorAll('.code-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.pane === pane));
    // The highlight layer is painted while hidden on a tab switch, and a
    // display:none element has no scroll position, so re-sync on the way in.
    if (pane === 'editor') requestAnimationFrame(() => this.syncScroll());
  },

  onNarrow() {
    return window.matchMedia('(max-width: 900px)').matches;
  },

  // --- Storage ---

  load() {
    try {
      this.files = JSON.parse(localStorage.getItem(this.FILES_KEY)) || {};
    } catch (err) {
      this.files = {};
    }
    if (!Object.keys(this.files).length) this.files = { ...ScholarCode.STARTER };
    this.openPath = localStorage.getItem(this.OPEN_KEY);
    if (!this.files[this.openPath]) this.openPath = Object.keys(this.files)[0] || null;
  },

  persist() {
    try {
      localStorage.setItem(this.FILES_KEY, JSON.stringify(this.files));
      if (this.openPath) localStorage.setItem(this.OPEN_KEY, this.openPath);
      return true;
    } catch (err) {
      // Quota is the only realistic failure, and silently losing an edit
      // would be far worse than saying so.
      this.setStatus('Could not save — this browser\'s storage is full. Push files to a project or delete some.', 'error');
      return false;
    }
  },

  // --- View ---

  toggle() { this.visible ? this.hide() : this.show(); },

  show() {
    this.visible = true;
    this.el.view.classList.remove('hidden');
    document.body.classList.add('code-open');
    this.renderTree();
    this.openFile(this.openPath);
    this.updateContextLabel();
  },

  hide() {
    this.visible = false;
    this.el.view.classList.add('hidden');
    document.body.classList.remove('code-open');
  },

  setStatus(msg, kind) {
    if (!this.el.status) return;
    this.el.status.textContent = msg || '';
    this.el.status.className = 'code-status' + (kind ? ' ' + kind : '');
  },

  // --- Files ---

  promptNewFile() {
    const path = prompt('New file path (e.g. src/app.js)');
    if (!path) return;
    const clean = path.trim().replace(/^\/+/, '');
    if (!clean) return;
    if (this.files[clean] != null) { this.openFile(clean); return; }
    this.files[clean] = '';
    this.persist();
    this.renderTree();
    this.openFile(clean);
    if (this.onNarrow()) this.setPane('editor');
  },

  deleteOpen() {
    if (!this.openPath) return;
    if (!confirm(`Delete ${this.openPath}?`)) return;
    delete this.files[this.openPath];
    this.persist();
    this.openPath = Object.keys(this.files)[0] || null;
    this.renderTree();
    this.openFile(this.openPath);
  },

  openFile(path) {
    const e = this.el;
    this.openPath = path && this.files[path] != null ? path : null;
    if (!this.openPath) {
      e.filename.textContent = 'No file';
      e.editor.value = '';
      e.editor.disabled = true;
      this.paintHighlight();
      this.renderTree();
      return;
    }
    e.editor.disabled = false;
    e.filename.textContent = this.openPath;
    e.editor.value = this.files[this.openPath];
    this.dirty = false;
    e.saveState.textContent = 'Saved';
    this.paintHighlight();
    this.persist();
    this.renderTree();
    this.updateContextLabel();
  },

  onEdit() {
    if (!this.openPath) return;
    this.files[this.openPath] = this.el.editor.value;
    this.dirty = true;
    this.el.saveState.textContent = 'Saving…';
    this.paintHighlight();
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      if (this.persist()) {
        this.dirty = false;
        this.el.saveState.textContent = 'Saved';
      }
    }, 400);
  },

  // The highlight layer sits behind a transparent textarea, so the caret and
  // selection stay native while the text underneath is coloured.
  paintHighlight() {
    const code = this.el.editor.value;
    const lang = this.langFor(this.openPath);
    // A trailing newline needs a trailing space in the highlight layer or the
    // last line has nothing to give it height, and the two layers drift.
    this.el.highlight.innerHTML = microHighlight(code + '\n', lang);
    this.syncScroll();
  },

  syncScroll() {
    this.el.highlight.parentElement.scrollTop = this.el.editor.scrollTop;
    this.el.highlight.parentElement.scrollLeft = this.el.editor.scrollLeft;
  },

  langFor(path) {
    const ext = (path || '').split('.').pop().toLowerCase();
    return ({
      js: 'javascript', mjs: 'javascript', jsx: 'javascript',
      ts: 'javascript', tsx: 'javascript',
      json: 'json', html: 'html', htm: 'html', css: 'css',
      py: 'python', sh: 'bash', bash: 'bash', md: 'markdown',
    })[ext] || '';
  },

  renderTree() {
    const tree = this.el.tree;
    if (!tree) return;
    tree.innerHTML = '';
    const paths = Object.keys(this.files).sort();
    if (!paths.length) {
      const li = document.createElement('li');
      li.className = 'code-tree-empty';
      li.textContent = 'No files yet.';
      tree.appendChild(li);
      return;
    }
    paths.forEach(path => {
      const li = document.createElement('li');
      li.className = 'code-tree-item' + (path === this.openPath ? ' active' : '');
      li.textContent = path;
      li.title = path;
      li.addEventListener('click', () => {
        this.openFile(path);
        if (this.onNarrow()) this.setPane('editor');
      });
      tree.appendChild(li);
    });
  },

  // --- Preview ---

  // Builds a self-contained page for the iframe. A relative <link> or <script>
  // is swapped for the matching file's contents, so a three-file project
  // previews the same way it would on disk — the iframe has no server to fetch
  // siblings from.
  buildPreviewDoc() {
    const path = this.openPath;
    if (!path) return '<p>Nothing open.</p>';
    const source = this.files[path] || '';
    const ext = path.split('.').pop().toLowerCase();

    if (ext === 'html' || ext === 'htm') {
      return source
        .replace(/<link[^>]+href=["']([^"':]+\.css)["'][^>]*>/gi, (m, href) => {
          const file = this.resolve(href);
          return file ? `<style>\n${this.files[file]}\n</style>` : m;
        })
        .replace(/<script[^>]+src=["']([^"':]+\.js)["'][^>]*>\s*<\/script>/gi, (m, src) => {
          const file = this.resolve(src);
          return file ? `<script>\n${this.files[file]}\n<\/script>` : m;
        });
    }

    if (ext === 'css') {
      return `<style>${source}</style><p style="font:14px system-ui;padding:12px">` +
             `Stylesheet preview — open an HTML file to see it applied.</p>`;
    }

    // Everything else is treated as a script, with console output mirrored into
    // the page so a preview of plain logic still shows something.
    return `<body style="font:13px ui-monospace,monospace;padding:10px;margin:0">` +
      `<div id="__out"></div><script>` +
      `const __o=document.getElementById('__out');` +
      `const __p=(c,a)=>{const d=document.createElement('div');d.style.color=c;` +
      `d.textContent=[...a].map(v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch(e){return String(v)}}).join(' ');__o.appendChild(d)};` +
      `console.log=(...a)=>__p('#cfe',a);console.error=(...a)=>__p('#f88',a);console.warn=(...a)=>__p('#fc8',a);` +
      `window.onerror=(m)=>__p('#f88',[m]);` +
      `try{\n${source}\n}catch(e){__p('#f88',[e.message])}` +
      `<\/script></body>`;
  },

  // Resolves a relative reference from the open file against the file list.
  resolve(ref) {
    const clean = ref.replace(/^\.\//, '');
    if (this.files[clean] != null) return clean;
    const dir = this.openPath.includes('/') ? this.openPath.replace(/\/[^/]*$/, '/') : '';
    if (this.files[dir + clean] != null) return dir + clean;
    const tail = Object.keys(this.files).find(p => p.endsWith('/' + clean));
    return tail || null;
  },

  run() {
    if (this.onNarrow()) this.setPane('editor');
    const doc = this.buildPreviewDoc();
    this.el.previewWrap.classList.remove('hidden');
    // srcdoc plus a sandbox with scripts but no same-origin: the preview can
    // run, but it cannot reach this page's storage or its AnythingLLM key.
    this.el.preview.srcdoc = doc;
  },

  closePreview() {
    this.el.previewWrap.classList.add('hidden');
    this.el.preview.srcdoc = '';
  },

  // --- Project knowledge ---

  // Uploads the current files into the active project as documents, so later
  // chats — in the main chat view too — can retrieve them.
  async pushToProject() {
    if (!isAnythingLLM()) {
      alert('Pushing files into a project needs AnythingLLM. Switch the backend in Settings.');
      return;
    }
    const slug = state.activeProjectSlug;
    if (!slug) { alert('Pick a project first.'); return; }
    const paths = Object.keys(this.files);
    if (!paths.length) return;
    const project = Projects.byslug(slug);
    if (!confirm(`Add ${paths.length} file${paths.length === 1 ? '' : 's'} to "${project?.name || slug}" as project knowledge?`)) return;

    for (const path of paths) {
      try {
        this.setStatus(`Adding ${path}…`);
        await AnythingLLM.uploadRawText({
          url: state.conn.allmUrl, key: state.conn.allmKey,
          text: `File: ${path}\n\n${this.files[path]}`,
          title: path,
          slug,
        });
      } catch (err) {
        this.setStatus(`Could not add ${path}: ${err.message}`, 'error');
        return;
      }
    }
    this.setStatus(`Added ${paths.length} file${paths.length === 1 ? '' : 's'} to ${project?.name || slug}.`, 'ok');
    if (Projects.openSlug === slug) Projects.refreshDocs();
  },

  // --- Chat ---

  updateContextLabel() {
    if (!this.el.chatContext) return;
    const count = Object.keys(this.files).length;
    this.el.chatContext.textContent = this.openPath
      ? `Sending ${this.openPath} plus a listing of ${count} file${count === 1 ? '' : 's'}`
      : `Sending a listing of ${count} file${count === 1 ? '' : 's'}`;
  },

  systemPrompt() {
    return [
      'You are Scholar Code, a careful software engineer working inside a browser-based editor.',
      '',
      'Rules for your replies:',
      '- When you write or change a file, output the COMPLETE new contents of that file in a fenced code block.',
      '- Put the file path on the fence line, like: ```js path=src/app.js',
      '- One block per file. Never abbreviate with "..." or "rest unchanged" — the block replaces the file wholesale.',
      '- If you are only explaining, do not use a path= fence, so nothing is offered as a file write.',
      '- Keep changes minimal and in the style of the surrounding code.',
    ].join('\n');
  },

  buildPrompt(question) {
    const listing = Object.keys(this.files).map(p => `- ${p}`).join('\n');
    const open = this.openPath
      ? `\n\nOpen file — ${this.openPath}:\n\`\`\`\n${this.files[this.openPath]}\n\`\`\``
      : '';
    return `Files in this project:\n${listing}${open}\n\n---\n\n${question}`;
  },

  async send() {
    const question = (this.el.chatInput.value || '').trim();
    if (!question || this.streaming) return;
    if (!state.connected) { this.setStatus('Not connected.', 'error'); return; }

    this.el.chatInput.value = '';
    this.appendChat('user', question);

    const body = this.appendChat('assistant', '');
    body.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

    this.streaming = true;
    this.abortController = new AbortController();
    this.el.chatSend.classList.add('hidden');
    this.el.chatStop.classList.remove('hidden');

    let answer = '';
    let started = false;
    const push = (t) => {
      if (!t) return;
      if (!started) { started = true; body.innerHTML = ''; }
      answer += t;
      body.innerHTML = renderMarkdown(answer);
      body.scrollIntoView({ block: 'nearest' });
    };

    try {
      if (isAnythingLLM()) {
        const slug = state.activeProjectSlug;
        if (!slug) throw new Error('Pick a project first — AnythingLLM chats through a workspace.');
        // The code chat runs on its own thread so it never mixes into the
        // conversation open in the main chat view.
        if (!this.threadSlug) {
          const thread = await AnythingLLM.createThread({
            url: state.conn.allmUrl, key: state.conn.allmKey, slug, name: 'Scholar Code',
          }).catch(() => null);
          this.threadSlug = thread?.slug || null;
        }
        await AnythingLLM.stream({
          url: state.conn.allmUrl, key: state.conn.allmKey, slug,
          threadSlug: this.threadSlug,
          message: `${this.systemPrompt()}\n\n${this.buildPrompt(question)}`,
          mode: 'chat',
          signal: this.abortController.signal,
          onDelta: push,
          onReasoning: () => {},
        });
      } else {
        await LMStudio.stream({
          url: state.conn.lmsUrl, key: state.conn.lmsToken,
          model: activeModelId(),
          messages: [
            { role: 'system', content: this.systemPrompt() },
            ...this.messages,
            { role: 'user', content: this.buildPrompt(question) },
          ],
          temperature: 0.2,
          maxTokens: parseInt(tokensSlider.value),
          useStream: true,
          signal: this.abortController.signal,
          onDelta: push,
          onReasoning: () => {},
        });
      }

      if (!answer) { body.innerHTML = '<em>(empty response)</em>'; }
      else {
        this.messages.push({ role: 'user', content: question });
        this.messages.push({ role: 'assistant', content: answer });
        // Keep the replayed history short — the file contents dominate the
        // prompt already, and stale copies of them are worse than useless.
        if (this.messages.length > 8) this.messages = this.messages.slice(-8);
        this.decorateBlocks(body, answer);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!answer) body.innerHTML = '<em>Stopped.</em>';
        else this.decorateBlocks(body, answer);
      } else {
        body.innerHTML = `<div class="message-content error">${escapeHtml(err.message)}</div>`;
      }
    } finally {
      this.streaming = false;
      this.abortController = null;
      this.el.chatSend.classList.remove('hidden');
      this.el.chatStop.classList.add('hidden');
    }
  },

  stop() {
    if (this.abortController) this.abortController.abort();
  },

  appendChat(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'code-msg code-msg-' + role;
    const body = document.createElement('div');
    body.className = 'code-msg-body';
    if (text) body.innerHTML = role === 'user' ? escapeHtml(text) : renderMarkdown(text);
    wrap.appendChild(body);
    this.el.chatLog.appendChild(wrap);
    this.el.chatLog.scrollTop = this.el.chatLog.scrollHeight;
    return body;
  },

  // Finds fenced blocks that name a file and puts an Apply button on each, so
  // a suggested change lands in the tree with one click instead of a
  // copy-paste round trip.
  decorateBlocks(body, raw) {
    const blocks = this.parseFileBlocks(raw);
    if (!blocks.length) { addCopyButtons(body); return; }

    const pres = [...body.querySelectorAll('pre')];
    blocks.forEach((block, i) => {
      const pre = pres[block.index] || pres[i];
      if (!pre) return;
      const bar = document.createElement('div');
      bar.className = 'code-apply-bar';

      const label = document.createElement('span');
      label.className = 'code-apply-path';
      label.textContent = block.path;

      const apply = document.createElement('button');
      apply.className = 'btn-sm';
      const exists = this.files[block.path] != null;
      apply.textContent = exists ? 'Apply to file' : 'Create file';
      apply.addEventListener('click', () => {
        this.files[block.path] = block.code;
        this.persist();
        this.renderTree();
        this.openFile(block.path);
        if (this.onNarrow()) this.setPane('editor');
        apply.textContent = 'Applied ✓';
        apply.disabled = true;
        this.setStatus(`${exists ? 'Updated' : 'Created'} ${block.path}.`, 'ok');
      });

      bar.append(label, apply);
      pre.parentNode.insertBefore(bar, pre);
    });
    addCopyButtons(body);
  },

  // Pulls out fenced blocks whose fence line names a path. Both
  // ```js path=src/app.js and a bare ```src/app.js are accepted, since models
  // drift between the two however the prompt is worded.
  parseFileBlocks(raw) {
    const out = [];
    const fence = /^```([^\n]*)\n([\s\S]*?)^```/gm;
    let match;
    let index = 0;
    while ((match = fence.exec(raw)) !== null) {
      const info = match[1].trim();
      const code = match[2].replace(/\n$/, '');
      let path = null;

      const tagged = info.match(/path\s*=\s*["']?([^\s"']+)/i);
      if (tagged) path = tagged[1];
      else {
        // A bare fence info string counts as a path only if it looks like one
        // — a dot and no spaces — so ```javascript is not read as a filename.
        const bare = info.split(/\s+/).find(t => /\.[a-z0-9]+$/i.test(t) && !/^\./.test(t));
        if (bare) path = bare;
      }

      if (path) out.push({ path: path.replace(/^\/+/, ''), code, index });
      index++;
    }
    return out;
  },
};

// A file to open into rather than an empty tree, which also documents the
// fence convention the chat expects back.
ScholarCode.STARTER = {
  'index.html': [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <title>Scratch</title>',
    '    <link rel="stylesheet" href="style.css">',
    '  </head>',
    '  <body>',
    '    <h1>Hello from Scholar Code</h1>',
    '    <p>Edit these files, press Run to preview, or ask the chat on the right to change them.</p>',
    '    <script src="main.js"></script>',
    '  </body>',
    '</html>',
    '',
  ].join('\n'),
  'style.css': [
    'body {',
    '  font: 16px/1.5 system-ui, sans-serif;',
    '  margin: 2rem;',
    '  color: #123;',
    '}',
    '',
  ].join('\n'),
  'main.js': [
    'console.log("Scholar Code is running.");',
    '',
  ].join('\n'),
};
