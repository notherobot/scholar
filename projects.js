// === Projects ===
// A Scholar Project is an AnythingLLM workspace, one to one. That mapping is
// what makes Claude-style projects possible without inventing any storage of
// our own:
//
//   Project            → workspace  (name, slug)
//   Custom instructions→ workspace.openAiPrompt
//   Project knowledge  → documents embedded in the workspace
//   Chat in a project  → a thread inside that workspace
//
// Because the documents live in the workspace, every chat in the project can
// cite them without re-uploading anything, which is the whole point.
//
// DOM lookups happen in init() rather than at load time: this file is loaded
// before app.js so that app.js can call into it, and the elements it needs
// belong to the shared document either way.

const Projects = {
  // Cached workspace list, refreshed from the server. Never the source of
  // truth — AnythingLLM is.
  list: [],
  loading: false,
  lastError: null,
  // Slug of the project whose detail modal is open.
  openSlug: null,
  // Documents for the open project, keyed by slug so reopening is instant.
  docCache: {},

  el: {},

  init() {
    const $ = (s) => document.querySelector(s);
    this.el = {
      section: $('#projects-section'),
      list: $('#projects-list'),
      newBtn: $('#projects-new'),
      empty: $('#projects-empty'),
      modal: $('#project-modal'),
      modalClose: $('#project-modal-close'),
      title: $('#project-modal-title'),
      instructions: $('#project-instructions'),
      instructionsSave: $('#project-instructions-save'),
      docList: $('#project-doc-list'),
      docEmpty: $('#project-doc-empty'),
      docInput: $('#project-doc-input'),
      docAddBtn: $('#project-doc-add'),
      linkInput: $('#project-link-input'),
      linkAddBtn: $('#project-link-add'),
      dropZone: $('#project-drop-zone'),
      status: $('#project-modal-status'),
      deleteBtn: $('#project-delete'),
    };

    const e = this.el;
    if (e.newBtn) e.newBtn.addEventListener('click', () => this.promptCreate());
    if (e.modalClose) e.modalClose.addEventListener('click', () => this.closeModal());
    if (e.modal) e.modal.addEventListener('click', (ev) => {
      if (ev.target === e.modal) this.closeModal();
    });
    if (e.instructionsSave) e.instructionsSave.addEventListener('click', () => this.saveInstructions());
    if (e.docAddBtn) e.docAddBtn.addEventListener('click', () => e.docInput.click());
    if (e.docInput) e.docInput.addEventListener('change', () => {
      if (e.docInput.files?.length) this.uploadFiles([...e.docInput.files]);
      e.docInput.value = '';
    });
    if (e.linkAddBtn) e.linkAddBtn.addEventListener('click', () => this.addLink());
    if (e.linkInput) e.linkInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); this.addLink(); }
    });
    if (e.deleteBtn) e.deleteBtn.addEventListener('click', () => this.confirmDelete());

    // Drag-and-drop onto the document panel, which is how anyone actually
    // expects to add files to a project.
    if (e.dropZone) {
      ['dragenter', 'dragover'].forEach(t => e.dropZone.addEventListener(t, (ev) => {
        ev.preventDefault();
        e.dropZone.classList.add('drag-over');
      }));
      ['dragleave', 'drop'].forEach(t => e.dropZone.addEventListener(t, (ev) => {
        ev.preventDefault();
        if (t === 'dragleave' && e.dropZone.contains(ev.relatedTarget)) return;
        e.dropZone.classList.remove('drag-over');
      }));
      e.dropZone.addEventListener('drop', (ev) => {
        const files = [...(ev.dataTransfer?.files || [])];
        if (files.length) this.uploadFiles(files);
      });
    }
  },

  // --- Server plumbing ---

  available() {
    return state.conn.backend === BACKEND.ANYTHINGLLM && !!state.conn.allmUrl;
  },

  creds() {
    return { url: state.conn.allmUrl, key: state.conn.allmKey };
  },

  byslug(slug) {
    return this.list.find(p => p.slug === slug) || null;
  },

  // Pulls the workspace list. Failure is not fatal: Scholar still chats, it
  // just can't show projects, so the error is surfaced in the panel rather
  // than thrown at the caller.
  async refresh() {
    if (!this.available()) {
      this.list = [];
      this.lastError = null;
      this.renderList();
      return [];
    }
    this.loading = true;
    this.renderList();
    try {
      const workspaces = await AnythingLLM.listWorkspaces(this.creds());
      this.list = workspaces
        .map(w => ({
          slug: w.slug,
          name: w.name,
          instructions: w.openAiPrompt || '',
          createdAt: w.createdAt,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.lastError = null;
    } catch (err) {
      this.lastError = err.message || 'Could not load projects';
    } finally {
      this.loading = false;
      this.renderList();
      syncProjectPicker();
    }
    return this.list;
  },

  async create(name, instructions) {
    const ws = await AnythingLLM.createWorkspace({ ...this.creds(), name, instructions });
    if (!ws) throw new Error('AnythingLLM did not return the new workspace.');
    const project = {
      slug: ws.slug,
      name: ws.name,
      instructions: ws.openAiPrompt || '',
      createdAt: ws.createdAt,
    };
    this.list = [...this.list, project].sort((a, b) => a.name.localeCompare(b.name));
    this.renderList();
    syncProjectPicker();
    return project;
  },

  async promptCreate() {
    if (!this.available()) {
      alert('Projects need AnythingLLM. Switch the backend in Settings to use them.');
      return;
    }
    const name = prompt('Project name');
    if (!name || !name.trim()) return;
    try {
      const project = await this.create(name.trim());
      this.openModal(project.slug);
    } catch (err) {
      alert('Could not create the project: ' + err.message);
    }
  },

  // --- Detail modal ---

  async openModal(slug) {
    const project = this.byslug(slug);
    if (!project) return;
    this.openSlug = slug;
    const e = this.el;
    e.title.textContent = project.name;
    e.instructions.value = project.instructions || '';
    e.status.textContent = '';
    e.modal.classList.remove('hidden');

    // Show whatever was cached while the fresh list loads, so reopening a
    // project doesn't flash empty.
    this.renderDocs(this.docCache[slug] || null);
    await this.refreshDocs();
  },

  closeModal() {
    this.openSlug = null;
    this.el.modal.classList.add('hidden');
  },

  setStatus(msg, kind) {
    const e = this.el;
    e.status.textContent = msg || '';
    e.status.className = 'project-status' + (kind ? ' ' + kind : '');
  },

  async refreshDocs() {
    const slug = this.openSlug;
    if (!slug) return;
    try {
      const ws = await AnythingLLM.getWorkspace({ ...this.creds(), slug });
      const docs = (ws?.documents || []).map(d => {
        // `metadata` is stored as a JSON string on the document row.
        let meta = {};
        try { meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : (d.metadata || {}); }
        catch (err) { meta = {}; }
        return {
          id: d.id,
          docpath: d.docpath,
          title: meta.title || d.filename || d.docpath,
          wordCount: meta.wordCount,
          tokens: meta.token_count_estimate,
        };
      });
      this.docCache[slug] = docs;
      if (this.openSlug === slug) this.renderDocs(docs);
    } catch (err) {
      this.setStatus('Could not load documents: ' + err.message, 'error');
    }
  },

  renderDocs(docs) {
    const e = this.el;
    if (!e.docList) return;
    e.docList.innerHTML = '';
    if (docs === null) {
      e.docEmpty.textContent = 'Loading documents…';
      e.docEmpty.classList.remove('hidden');
      return;
    }
    if (!docs.length) {
      e.docEmpty.textContent = 'No documents yet. Anything you add here is available to every chat in this project.';
      e.docEmpty.classList.remove('hidden');
      return;
    }
    e.docEmpty.classList.add('hidden');

    docs.forEach(doc => {
      const li = document.createElement('li');
      li.className = 'project-doc';

      const name = document.createElement('span');
      name.className = 'project-doc-name';
      name.textContent = doc.title;
      name.title = doc.docpath;

      const meta = document.createElement('span');
      meta.className = 'project-doc-meta';
      meta.textContent = doc.tokens ? `~${doc.tokens.toLocaleString()} tokens` : '';

      const remove = document.createElement('button');
      remove.className = 'icon-btn project-doc-remove';
      remove.setAttribute('aria-label', `Remove ${doc.title}`);
      remove.title = 'Remove from this project';
      remove.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
      remove.addEventListener('click', () => this.removeDoc(doc));

      li.append(name, meta, remove);
      e.docList.appendChild(li);
    });
  },

  async uploadFiles(files) {
    const slug = this.openSlug;
    if (!slug) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const label = files.length > 1 ? `(${i + 1}/${files.length}) ` : '';
      try {
        this.setStatus(`${label}Uploading ${file.name}…`);
        await AnythingLLM.uploadDocument({
          ...this.creds(), file, slug,
          onProgress: (p) => {
            // Embedding happens after the bytes land, and it is the slow part,
            // so 100% uploaded is reported as "embedding" rather than "done".
            this.setStatus(p >= 1
              ? `${label}Embedding ${file.name}… this can take a while for large files.`
              : `${label}Uploading ${file.name}… ${Math.round(p * 100)}%`);
          },
        });
        this.setStatus(`${label}Added ${file.name}.`, 'ok');
      } catch (err) {
        this.setStatus(`Could not add ${file.name}: ${err.message}`, 'error');
        break;
      }
    }
    await this.refreshDocs();
  },

  async addLink() {
    const slug = this.openSlug;
    const input = this.el.linkInput;
    const link = (input.value || '').trim();
    if (!slug || !link) return;
    try {
      this.setStatus('Fetching and embedding the page…');
      await AnythingLLM.uploadLink({ ...this.creds(), link, slug });
      input.value = '';
      this.setStatus('Page added.', 'ok');
    } catch (err) {
      this.setStatus('Could not add that link: ' + err.message, 'error');
    }
    await this.refreshDocs();
  },

  async removeDoc(doc) {
    const slug = this.openSlug;
    if (!slug) return;
    if (!confirm(`Remove "${doc.title}" from this project?\n\nThe file stays in AnythingLLM's document store — this only unlinks it from this project.`)) return;
    try {
      this.setStatus(`Removing ${doc.title}…`);
      await AnythingLLM.removeDocuments({ ...this.creds(), slug, paths: [doc.docpath] });
      this.setStatus('Removed.', 'ok');
    } catch (err) {
      this.setStatus('Could not remove it: ' + err.message, 'error');
    }
    await this.refreshDocs();
  },

  async saveInstructions() {
    const slug = this.openSlug;
    if (!slug) return;
    const text = this.el.instructions.value;
    try {
      this.setStatus('Saving instructions…');
      await AnythingLLM.updateWorkspace({
        ...this.creds(), slug, updates: { openAiPrompt: text },
      });
      const project = this.byslug(slug);
      if (project) project.instructions = text;
      this.setStatus('Instructions saved. They apply to every chat in this project.', 'ok');
    } catch (err) {
      this.setStatus('Could not save: ' + err.message, 'error');
    }
  },

  async confirmDelete() {
    const slug = this.openSlug;
    const project = this.byslug(slug);
    if (!project) return;
    if (!confirm(`Delete the project "${project.name}"?\n\nThis deletes the workspace in AnythingLLM, along with its threads and document embeddings. Scholar's local copies of those chats are kept.`)) return;
    try {
      await AnythingLLM.deleteWorkspace({ ...this.creds(), slug });
      this.list = this.list.filter(p => p.slug !== slug);
      delete this.docCache[slug];
      // Local chats survive, but they no longer point anywhere real.
      state.sessions.forEach(s => {
        if (s.projectSlug === slug) { s.projectSlug = null; s.threadSlug = null; }
      });
      persistSessions();
      this.closeModal();
      this.renderList();
      renderHistoryList();
      syncProjectPicker();
    } catch (err) {
      alert('Could not delete the project: ' + err.message);
    }
  },

  // --- Chats panel section ---

  renderList() {
    const e = this.el;
    if (!e.section || !e.list) return;

    // The whole section is meaningless without AnythingLLM, so it hides
    // rather than showing a permanently broken control.
    e.section.classList.toggle('hidden', !this.available());
    if (!this.available()) return;

    e.list.innerHTML = '';

    if (this.lastError) {
      e.empty.textContent = this.lastError;
      e.empty.classList.remove('hidden');
      return;
    }
    if (this.loading && !this.list.length) {
      e.empty.textContent = 'Loading projects…';
      e.empty.classList.remove('hidden');
      return;
    }
    if (!this.list.length) {
      e.empty.textContent = 'No projects yet. A project keeps documents and instructions that every chat inside it can use.';
      e.empty.classList.remove('hidden');
      return;
    }
    e.empty.classList.add('hidden');

    this.list.forEach(project => {
      const chats = state.sessions.filter(s => s.projectSlug === project.slug);
      const li = document.createElement('li');
      li.className = 'project-item';
      li.dataset.slug = project.slug;
      if (state.activeProjectSlug === project.slug) li.classList.add('active');

      const row = document.createElement('div');
      row.className = 'project-row';

      const icon = document.createElement('span');
      icon.className = 'project-icon';
      icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M9 13h6"/></svg>';

      const name = document.createElement('span');
      name.className = 'project-name';
      name.textContent = project.name;

      const count = document.createElement('span');
      count.className = 'project-count';
      count.textContent = chats.length ? String(chats.length) : '';

      const settings = document.createElement('button');
      settings.className = 'icon-btn project-settings';
      settings.title = 'Documents & instructions';
      settings.setAttribute('aria-label', `Open ${project.name} settings`);
      settings.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
      settings.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.openModal(project.slug);
      });

      // Clicking the row starts a new chat in the project — the same gesture
      // as Claude's project tile, and the thing you want 90% of the time.
      row.addEventListener('click', () => this.startChatIn(project.slug));

      row.append(icon, name, count, settings);
      li.appendChild(row);
      e.list.appendChild(li);
    });
  },

  // Opens a fresh chat bound to a project.
  startChatIn(slug) {
    state.activeProjectSlug = slug;
    newChat({ keepProject: true });
    syncProjectPicker();
    this.renderList();
    if (window.innerWidth < 768) closeHistory();
  },

  // --- Threads ---
  // A Scholar chat maps to one AnythingLLM thread, created lazily on the first
  // send so that opening a new chat never needs the network. If thread
  // creation fails the caller falls back to workspace chat partitioned by
  // sessionId, which keeps chats isolated from each other even without a
  // thread record.
  async ensureThread(session) {
    if (!session || !session.projectSlug) return null;
    if (session.threadSlug) return session.threadSlug;
    try {
      const thread = await AnythingLLM.createThread({
        ...this.creds(),
        slug: session.projectSlug,
        name: session.title || 'Scholar chat',
      });
      session.threadSlug = thread?.slug || null;
      persistSessions();
      return session.threadSlug;
    } catch (err) {
      return null;
    }
  },
};
