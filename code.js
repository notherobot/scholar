// === Scholar Code ===
// A coding view in the same spirit as Claude Code: you describe what you want,
// the model writes the files, and they land in the project immediately — no
// copy-paste, no scaffolding to delete first. The chat is the primary surface
// and is docked on the left; files and the editor sit to its right.
//
// What it deliberately is not: Scholar is a static page in a browser tab, so
// it cannot run a shell, install packages, or touch the disk on your PC. The
// files here live in this browser, previews run in a sandboxed iframe, and
// "running code" means HTML/CSS/JS in that iframe. Everything else — writing,
// refactoring, explaining, reviewing — goes through the model with the real
// file contents in the prompt.
//
// An MCP server that reaches the filesystem would change that, and LM Studio
// can host one; wiring it up here is a separate job from this editor.

const ScholarCode = {
  FILES_KEY: 'scholar-code-files',
  OPEN_KEY: 'scholar-code-open',

  files: {},        // { path: contents }
  openPath: null,
  dirty: false,
  visible: false,
  streaming: false,
  abortController: null,
  chatOpen: true,
  // The file map as it was before the last batch of model writes, so a bad
  // apply is one click away from being undone.
  undoSnapshot: null,
  // Conversation for the code chat, kept separate from the main chat so a
  // coding session doesn't bury the chat history.
  messages: [],

  el: {},

  init() {
    const $ = (s) => document.querySelector(s);
    this.el = {
      view: $('#code-view'),
      closeBtn: $('#code-close'),
      fileTabs: $('#code-file-tabs'),
      newFileBtn: $('#code-new-file'),
      emptyNewBtn: $('#code-empty-new'),
      empty: $('#code-empty'),
      editorWrap: $('#code-editor-wrap'),
      editor: $('#code-editor'),
      highlight: $('#code-highlight'),
      filename: $('#code-filename'),
      saveState: $('#code-save-state'),
      runBtn: $('#code-run'),
      deleteBtn: $('#code-delete'),
      preview: $('#code-preview'),
      previewWrap: $('#code-preview-wrap'),
      previewTitle: $('#code-preview-title'),
      previewClose: $('#code-preview-close'),
      previewReload: $('#code-preview-reload'),
      chat: $('#code-chat'),
      chatOverlay: $('#code-chat-overlay'),
      chatToggle: $('#code-chat-toggle'),
      chatHide: $('#code-chat-hide'),
      chatNew: $('#code-chat-new'),
      chatResize: $('#code-chat-resize-handle'),
      chatLog: $('#code-chat-log'),
      chatInput: $('#code-chat-input'),
      chatSend: $('#code-chat-send'),
      chatStop: $('#code-chat-stop'),
      chatContext: $('#code-chat-context'),
      status: $('#code-status'),
    };

    this.load();

    const e = this.el;
    if (e.closeBtn) e.closeBtn.addEventListener('click', () => this.hide());
    if (e.newFileBtn) e.newFileBtn.addEventListener('click', () => this.promptNewFile());
    if (e.emptyNewBtn) e.emptyNewBtn.addEventListener('click', () => this.promptNewFile());
    if (e.deleteBtn) e.deleteBtn.addEventListener('click', () => this.deleteOpen());
    if (e.runBtn) e.runBtn.addEventListener('click', () => this.run());
    if (e.previewClose) e.previewClose.addEventListener('click', () => this.closePreview());
    if (e.previewReload) e.previewReload.addEventListener('click', () => this.run());
    if (e.chatSend) e.chatSend.addEventListener('click', () => this.send());
    if (e.chatStop) e.chatStop.addEventListener('click', () => this.stop());
    if (e.chatToggle) e.chatToggle.addEventListener('click', () => this.toggleChat());
    if (e.chatHide) e.chatHide.addEventListener('click', () => this.setChatOpen(false));
    if (e.chatOverlay) e.chatOverlay.addEventListener('click', () => this.setChatOpen(false));
    if (e.chatNew) e.chatNew.addEventListener('click', () => this.newSession());

    setupPanelResize(e.chat, e.chatResize, '--code-chat-width', 'scholar-code-chat-width', 'left');

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

    // Escape backs out one layer at a time: preview first, then the view.
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape' || !this.visible) return;
      if (!this.el.previewWrap.classList.contains('hidden')) this.closePreview();
      else this.hide();
    });
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
    // No starter project on purpose: the first thing you ask for is the first
    // thing that exists, whether that's an index.html, an App.jsx or a script.
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
      this.setStatus('Could not save — this browser\'s storage is full. Delete some files to make room.', 'error');
      return false;
    }
  },

  // --- View ---

  toggle() { this.visible ? this.hide() : this.show(); },

  show() {
    this.visible = true;
    this.el.view.classList.remove('hidden');
    document.body.classList.add('code-open');
    // Chat is where the work starts, so it opens with the view — on a phone
    // that means the drawer is already up rather than hidden behind a button.
    this.setChatOpen(true);
    this.renderTabs();
    this.openFile(this.openPath);
    this.renderChatEmptyState();
    this.updateContextLabel();
  },

  hide() {
    this.visible = false;
    this.el.view.classList.add('hidden');
    document.body.classList.remove('code-open');
    this.closePreview();
  },

  setChatOpen(open) {
    this.chatOpen = open;
    this.el.view.classList.toggle('chat-closed', !open);
    // The scrim only belongs to the phone layout, where the chat floats over
    // the editor; docked on desktop there is nothing to dim.
    this.el.chatOverlay.classList.toggle('hidden', !open || !this.onNarrow());
    if (open) this.el.chatLog.scrollTop = this.el.chatLog.scrollHeight;
  },

  toggleChat() { this.setChatOpen(!this.chatOpen); },

  // On a phone, acting on a file means you want to see it — get the drawer
  // out of the way. On desktop both are visible at once, so nothing moves.
  revealEditor() {
    if (this.onNarrow()) this.setChatOpen(false);
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
    this.renderTabs();
    this.openFile(clean);
    this.revealEditor();
  },

  deleteOpen() {
    if (!this.openPath) return;
    if (!confirm(`Delete ${this.openPath}?`)) return;
    delete this.files[this.openPath];
    this.persist();
    this.openPath = Object.keys(this.files)[0] || null;
    this.renderTabs();
    this.openFile(this.openPath);
  },

  openFile(path) {
    const e = this.el;
    this.openPath = path && this.files[path] != null ? path : null;
    const hasFiles = Object.keys(this.files).length > 0;

    // With nothing in the project an empty editor reads as broken, so the
    // main pane explains itself instead — and the tab strip and toolbar go
    // with it, since Run and Delete have nothing to act on yet.
    e.empty.classList.toggle('hidden', hasFiles);
    e.editorWrap.classList.toggle('hidden', !hasFiles);
    e.view.classList.toggle('empty-project', !hasFiles);

    if (!this.openPath) {
      e.filename.textContent = hasFiles ? 'No file' : '';
      e.saveState.textContent = '';
      e.editor.value = '';
      e.editor.disabled = true;
      this.paintHighlight();
      this.renderTabs();
      this.updateContextLabel();
      return;
    }
    e.editor.disabled = false;
    e.filename.textContent = this.openPath;
    e.editor.value = this.files[this.openPath];
    this.dirty = false;
    e.saveState.textContent = 'Saved';
    this.paintHighlight();
    this.persist();
    this.renderTabs();
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

  // Every file is a tab. Projects here are small by nature, so a strip reads
  // faster than a tree and costs none of the left edge, which chat now owns.
  renderTabs() {
    const strip = this.el.fileTabs;
    if (!strip) return;
    strip.innerHTML = '';
    Object.keys(this.files).sort().forEach(path => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'code-file-tab' + (path === this.openPath ? ' active' : '');
      // The basename is what identifies a tab; the full path is the tooltip
      // so src/components/Card.jsx doesn't blow the strip out sideways.
      tab.textContent = path.split('/').pop();
      tab.title = path;
      tab.addEventListener('click', () => {
        this.openFile(path);
        this.revealEditor();
      });
      strip.appendChild(tab);
    });
  },

  // --- Preview ---

  // What Run should show. An HTML file previews itself; anything else falls
  // back to the project's index.html when there is one, since editing main.js
  // and pressing Run means "show me the app", not "show me this file".
  pickEntry() {
    if (this.openPath && /\.html?$/i.test(this.openPath)) return this.openPath;
    const index = Object.keys(this.files).find(p => /(^|\/)index\.html?$/i.test(p));
    return index || this.openPath;
  },

  // Builds a self-contained page for the iframe. A relative <link> or <script>
  // is swapped for the matching file's contents, so a three-file project
  // previews the same way it would on disk — the iframe has no server to fetch
  // siblings from.
  buildPreviewDoc(path) {
    if (!path) return '<p>Nothing open.</p>';
    const source = this.files[path] || '';
    const ext = path.split('.').pop().toLowerCase();

    if (ext === 'html' || ext === 'htm') {
      return source
        .replace(/<link[^>]+href=["']([^"':]+\.css)["'][^>]*>/gi, (m, href) => {
          const file = this.resolve(href, path);
          return file ? `<style>\n${this.files[file]}\n</style>` : m;
        })
        .replace(/<script[^>]+src=["']([^"':]+\.js)["'][^>]*>\s*<\/script>/gi, (m, src) => {
          const file = this.resolve(src, path);
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

  // Resolves a relative reference from the entry file against the file list.
  resolve(ref, from) {
    const clean = ref.replace(/^\.\//, '');
    if (this.files[clean] != null) return clean;
    const dir = from.includes('/') ? from.replace(/\/[^/]*$/, '/') : '';
    if (this.files[dir + clean] != null) return dir + clean;
    const tail = Object.keys(this.files).find(p => p.endsWith('/' + clean));
    return tail || null;
  },

  run() {
    const entry = this.pickEntry();
    if (!entry) { this.setStatus('Nothing to run yet — create a file first.', 'error'); return; }
    this.el.previewTitle.textContent = entry;
    this.el.previewWrap.classList.remove('hidden');
    // srcdoc plus a sandbox with scripts but no same-origin: the preview can
    // run, but it cannot reach this page's storage or its API token.
    this.el.preview.srcdoc = this.buildPreviewDoc(entry);
  },

  closePreview() {
    this.el.previewWrap.classList.add('hidden');
    this.el.preview.srcdoc = '';
  },

  // --- Chat ---

  newSession() {
    if (this.streaming) this.stop();
    this.messages = [];
    this.el.chatLog.innerHTML = '';
    this.undoSnapshot = null;
    this.renderChatEmptyState();
    this.setStatus('');
  },

  // The log is the only place that explains how this works, so it says so
  // rather than opening on a blank rectangle.
  renderChatEmptyState() {
    if (this.messages.length || this.el.chatLog.children.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-chat-empty';
    wrap.innerHTML =
      '<p class="code-chat-empty-title">What do you want to build?</p>' +
      '<p>Describe it and the files get written for you — an <code>index.html</code>, ' +
      'an <code>App.jsx</code>, a script, whatever the job needs.</p>' +
      '<p class="code-chat-empty-note">Files are saved in this browser. Run previews them in a sandbox.</p>';
    this.el.chatLog.appendChild(wrap);
  },

  updateContextLabel() {
    if (!this.el.chatContext) return;
    const count = Object.keys(this.files).length;
    if (!count) { this.el.chatContext.textContent = 'Empty project — the reply creates the first files'; return; }
    this.el.chatContext.textContent = this.openPath
      ? `Sending ${this.openPath} plus a listing of ${count} file${count === 1 ? '' : 's'}`
      : `Sending a listing of ${count} file${count === 1 ? '' : 's'}`;
  },

  systemPrompt() {
    const empty = !Object.keys(this.files).length;
    return [
      'You are Scholar Code, a careful software engineer working inside a browser-based editor.',
      '',
      empty
        ? 'The project is EMPTY. Create whatever files the request needs and choose the paths yourself — index.html, App.jsx, main.py, whatever fits. Do not scaffold files nobody asked for.'
        : 'Change only what the request needs, in the style of the surrounding code.',
      '',
      'Every fenced block you tag with a path is written into the project automatically, so:',
      '- Output the COMPLETE new contents of a file — the block replaces it wholesale.',
      '- Put the path on the fence line, like: ```js path=src/app.js',
      '- One block per file. Never abbreviate with "..." or "rest unchanged".',
      '- If you are only explaining, use a plain fence with no path= so nothing is written.',
      '',
      'Previews run as a static page in a sandboxed iframe: plain HTML, CSS and JS work,',
      'and a relative <link>/<script> to another project file is inlined. There is no',
      'bundler, no npm and no server, so prefer dependency-free code, or a CDN <script>',
      'tag when a library is genuinely needed.',
      '',
      'Keep prose short — a sentence or two about what you did. The code is the answer.',
    ].join('\n');
  },

  buildPrompt(question) {
    const paths = Object.keys(this.files);
    const listing = paths.length ? paths.map(p => `- ${p}`).join('\n') : '(empty — no files yet)';
    const open = this.openPath
      ? `\n\nOpen file — ${this.openPath}:\n\`\`\`\n${this.files[this.openPath]}\n\`\`\``
      : '';
    // Earlier turns are replayed here rather than threaded, because the file
    // contents change between turns and a stale server-side copy of them is
    // worse than useless.
    const history = this.messages.length
      ? this.messages
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n') + '\n\n---\n\n'
      : '';
    return `Files in this project:\n${listing}${open}\n\n---\n\n${history}${question}`;
  },

  async send() {
    const question = (this.el.chatInput.value || '').trim();
    if (!question || this.streaming) return;
    if (!state.connected) { this.setStatus('Not connected.', 'error'); return; }

    const empty = this.el.chatLog.querySelector('.code-chat-empty');
    if (empty) empty.remove();

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
      // The code chat runs on its own response thread, so it never mixes into
      // whatever conversation is open in the main chat view.
      await LMStudio.chat({
        url: state.conn.lmsUrl,
        key: state.conn.lmsToken,
        model: activeModelId(),
        input: this.buildPrompt(question),
        systemPrompt: this.systemPrompt(),
        // MCP tools stay available here too — looking something up mid-edit is
        // exactly when they earn their keep.
        integrations: parseIntegrations(state.mcpServers),
        stream: true,
        signal: this.abortController.signal,
        onDelta: push,
        onReasoning: () => {},
        onToolStart: ({ tool }) => this.setStatus(`Calling ${tool}…`),
        onToolDone: ({ tool }) => this.setStatus(`${tool} returned.`),
        onToolFail: ({ tool, reason }) => this.setStatus(`${tool} failed: ${reason}`, 'error'),
      });

      if (!answer) { body.innerHTML = '<em>(empty response)</em>'; }
      else {
        this.messages.push({ role: 'user', content: question });
        this.messages.push({ role: 'assistant', content: answer });
        // Keep the replayed history short — the file contents dominate the
        // prompt already, and stale copies of them are worse than useless.
        if (this.messages.length > 8) this.messages = this.messages.slice(-8);
        this.applyBlocks(body, answer);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!answer) body.innerHTML = '<em>Stopped.</em>';
        else this.applyBlocks(body, answer);
      } else {
        body.innerHTML = `<div class="message-content error">${escapeHtml(err.message)}</div>`;
      }
    } finally {
      this.streaming = false;
      this.abortController = null;
      this.el.chatSend.classList.remove('hidden');
      this.el.chatStop.classList.add('hidden');
      this.el.chatLog.scrollTop = this.el.chatLog.scrollHeight;
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

  // Writes every file block straight into the project, the way Claude Code
  // edits files rather than handing back a patch to paste. The raw block is
  // folded into a one-line summary — the file itself is the copy that matters
  // now — and the whole batch can be undone in one click.
  applyBlocks(body, raw) {
    const blocks = this.parseFileBlocks(raw);
    if (!blocks.length) { addCopyButtons(body); return; }

    this.undoSnapshot = { ...this.files };

    const pres = [...body.querySelectorAll('pre')];
    let created = 0;
    let updated = 0;
    let last = null;

    blocks.forEach((block, i) => {
      const existed = this.files[block.path] != null;
      const unchanged = existed && this.files[block.path] === block.code;
      this.files[block.path] = block.code;
      last = block.path;
      if (!existed) created++;
      else if (!unchanged) updated++;

      const pre = pres[block.index] || pres[i];
      if (pre) this.insertFileAction(block, existed, unchanged, pre);
    });

    this.persist();
    this.renderTabs();
    if (last) { this.openFile(last); this.revealEditor(); }
    this.updateContextLabel();

    if (created || updated) {
      body.appendChild(this.buildUndoBar(created, updated));
      const parts = [];
      if (created) parts.push(`${created} file${created === 1 ? '' : 's'} created`);
      if (updated) parts.push(`${updated} updated`);
      this.setStatus(parts.join(', ') + '.', 'ok');
    }
    addCopyButtons(body);
  },

  // One compact row per written file, with the code folded away behind it.
  // Takes the rendered <pre> over: the summary stands in its place and the
  // full text moves inside the fold.
  insertFileAction(block, existed, unchanged, pre) {
    const wrap = document.createElement('div');
    wrap.className = 'code-file-action';

    const row = document.createElement('div');
    row.className = 'code-file-action-row';
    row.title = 'Open ' + block.path;

    const verb = document.createElement('span');
    verb.className = 'code-file-action-verb' + (existed ? '' : ' is-new');
    verb.textContent = unchanged ? 'No change' : existed ? 'Updated' : 'Created';

    const path = document.createElement('code');
    path.className = 'code-file-action-path';
    path.textContent = block.path;

    const meta = document.createElement('span');
    meta.className = 'code-file-action-meta';
    const lines = block.code.split('\n').length;
    meta.textContent = `${lines} line${lines === 1 ? '' : 's'}`;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'code-file-action-toggle';
    toggle.textContent = 'Code';

    row.append(verb, path, meta, toggle);
    wrap.appendChild(row);

    const fold = document.createElement('div');
    fold.className = 'code-file-action-code hidden';
    wrap.appendChild(fold);

    // Stand the summary where the <pre> was, then pull the <pre> inside it.
    pre.parentNode.insertBefore(wrap, pre);
    fold.appendChild(pre);

    toggle.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const hidden = fold.classList.toggle('hidden');
      toggle.classList.toggle('open', !hidden);
    });
    row.addEventListener('click', () => {
      this.openFile(block.path);
      this.revealEditor();
    });
  },

  buildUndoBar(created, updated) {
    const bar = document.createElement('div');
    bar.className = 'code-undo-bar';

    const label = document.createElement('span');
    const parts = [];
    if (created) parts.push(`${created} created`);
    if (updated) parts.push(`${updated} updated`);
    label.textContent = parts.join(' · ');

    const undo = document.createElement('button');
    undo.type = 'button';
    undo.className = 'btn-sm';
    undo.textContent = 'Undo';
    undo.addEventListener('click', () => {
      if (!this.undoSnapshot) return;
      this.files = { ...this.undoSnapshot };
      this.undoSnapshot = null;
      this.persist();
      this.renderTabs();
      this.openFile(this.files[this.openPath] != null ? this.openPath : Object.keys(this.files)[0] || null);
      this.updateContextLabel();
      undo.textContent = 'Undone';
      undo.disabled = true;
      this.setStatus('Reverted.', 'ok');
    });

    bar.append(label, undo);
    return bar;
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
