// === Backends ===
// Scholar talks to two very different servers, so everything that differs
// between them lives here and nothing above this file has to care which one is
// active.
//
//   AnythingLLM (default, port 3001) — the powerhouse. Native Developer API at
//     /api/v1. Workspaces give us Projects (documents + custom instructions +
//     threads) and `@agent` gives us tool use, including web browsing.
//   LM Studio (backup, port 1234) — the plain OpenAI-compatible /v1 surface the
//     app shipped with. No documents, no agents, but it needs nothing but a
//     loaded model.
//
// A previous attempt at this integration drove AnythingLLM through its
// OpenAI-compatible shim (/api/v1/openai/chat/completions) and `@agent` never
// fired, because that shim bypasses the agent handler entirely. This one uses
// the native endpoints, where agent invocation is a first-class branch.

const BACKEND = {
  ANYTHINGLLM: 'anythingllm',
  LMSTUDIO: 'lmstudio',
};

const BACKEND_DEFAULT_PORT = {
  [BACKEND.ANYTHINGLLM]: 3001,
  [BACKEND.LMSTUDIO]: 1234,
};

// AnythingLLM chat modes, straight from its API.
//   chat      — LLM general knowledge + document context, keeps rolling history
//   query     — refuses to answer unless the workspace documents are relevant
//   automatic — lets the model call tools itself, when the provider supports
//               native tool calling; otherwise AnythingLLM falls back to chat
const CHAT_MODES = [
  { id: 'chat', label: 'Chat', hint: 'Normal conversation, documents used when relevant' },
  { id: 'query', label: 'Query', hint: 'Answer only from this project\'s documents' },
  { id: 'automatic', label: 'Automatic', hint: 'Let the model call tools on its own' },
];

// === URL handling ===

// Turns whatever the user typed into an absolute origin.
//
// The scheme is guessed from the host, because guessing wrong is a dead end
// either way. A Tailscale MagicDNS name (my-pc.tailnet.ts.net) can hold a real
// Let's Encrypt certificate, so it gets https. A raw 100.x.x.x address or
// localhost never can — nobody issues certificates for IPs — so forcing https
// there produces a TLS error that reads like the server being down. Those get
// http, which works when Scholar itself is served over http and otherwise
// surfaces the honest mixed-content explanation below.
//
// Whatever port is typed — or omitted — is kept, so a `tailscale serve` setup
// that maps the bare hostname straight through still works.
function normalizeBase(raw) {
  let url = (raw || '').trim();
  if (!url) return '';
  url = url.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    const host = url.split('/')[0].split(':')[0];
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    url = (isIp || isLocal ? 'http://' : 'https://') + url;
  }
  return url;
}

// Derives one backend's address from the other's, since both usually live on
// the same PC and differ only by port. Used to prefill the AnythingLLM field
// from a known LM Studio address and vice versa.
//
// Only safe when the source URL carries an explicit port: if it doesn't, the
// address is almost certainly a `tailscale serve` mapping, where swapping in a
// port would point at nothing.
function swapPort(rawUrl, port) {
  const base = normalizeBase(rawUrl);
  if (!base) return '';
  let u;
  try { u = new URL(base); } catch (e) { return ''; }
  if (!u.port) return '';
  u.port = String(port);
  return u.origin;
}

// True when the page is https but the target is http. Browsers block that
// outright and the failure surfaces as an unexplained network error, so it is
// worth naming before the request is even attempted.
function isMixedContentBlocked(base) {
  if (location.protocol !== 'https:') return false;
  try { return new URL(base).protocol === 'http:'; } catch (e) { return false; }
}

// === Shared SSE reader ===

// Both backends stream `data: {json}\n\n` frames. Reads the body, splits on
// newlines, and hands each parsed frame to `onFrame`. Buffering the tail
// matters: a chunk boundary lands mid-line often enough that dropping the
// remainder loses tokens.
async function readSSE(resp, onFrame) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      let frame;
      try {
        frame = JSON.parse(data);
      } catch (e) {
        continue; // partial frame or keepalive
      }
      onFrame(frame);
    }
  }
}

// AnythingLLM emits model reasoning inline, wrapped in <think></think>, rather
// than on a separate field. Splitting it back out lets the UI show reasoning
// the same way it does for LM Studio's `reasoning_content`.
function splitThinkTags(text) {
  if (!text || text.indexOf('<think>') === -1) return { reasoning: '', answer: text || '' };
  let reasoning = '';
  const answer = text.replace(/<think>([\s\S]*?)(?:<\/think>|$)/g, (_, inner) => {
    reasoning += inner;
    return '';
  });
  return { reasoning, answer };
}

// === AnythingLLM client ===

const AnythingLLM = {
  id: BACKEND.ANYTHINGLLM,
  label: 'AnythingLLM',
  defaultPort: 3001,

  api(base, path) {
    return normalizeBase(base) + '/api/v1' + path;
  },

  headers(key, extra) {
    const h = { ...(extra || {}) };
    if (key) h['Authorization'] = 'Bearer ' + key;
    return h;
  },

  // GET /api/v1/auth is the cheapest way to tell "wrong key" apart from
  // "nothing listening", which are the two failures worth different advice.
  async probe({ url, key, timeout = 10000 }) {
    const base = normalizeBase(url);
    if (!base) return { ok: false, reason: 'empty', error: 'Enter an address' };
    if (isMixedContentBlocked(base)) {
      return {
        ok: false,
        reason: 'mixed-content',
        error: `This page is served over https, so the browser will block a plain http call to ${base}. ` +
               `Use your Tailscale https name (e.g. https://my-pc.tailnet.ts.net) or run Scholar locally over http.`,
      };
    }
    try {
      const resp = await fetch(this.api(base, '/auth'), {
        headers: this.headers(key),
        signal: AbortSignal.timeout(timeout),
      });
      if (resp.status === 401 || resp.status === 403) {
        return {
          ok: false,
          reason: 'auth',
          error: key
            ? 'AnythingLLM rejected that API key. Generate a new one under Settings → Tools → Developer API.'
            : 'AnythingLLM needs an API key. Create one under Settings → Tools → Developer API and paste it above.',
        };
      }
      if (!resp.ok) return { ok: false, reason: 'http', error: `AnythingLLM returned HTTP ${resp.status}` };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        reason: 'unreachable',
        error: `Could not reach AnythingLLM at ${base}. Check it is running, that Tailscale is up on both devices, ` +
               `and that the port matches (default 3001).`,
      };
    }
  },

  async listWorkspaces({ url, key }) {
    const resp = await fetch(this.api(url, '/workspaces'), {
      headers: this.headers(key),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.workspaces || [];
  },

  async getWorkspace({ url, key, slug }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}`), {
      headers: this.headers(key),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // This endpoint returns the workspace inside an array.
    const ws = Array.isArray(data.workspace) ? data.workspace[0] : data.workspace;
    return ws || null;
  },

  async createWorkspace({ url, key, name, instructions }) {
    const body = { name };
    if (instructions) body.openAiPrompt = instructions;
    const resp = await fetch(this.api(url, '/workspace/new'), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text().catch(() => '')}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.workspace;
  },

  async updateWorkspace({ url, key, slug, updates }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}/update`), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.message) throw new Error(data.message);
    return data.workspace;
  },

  async deleteWorkspace({ url, key, slug }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}`), {
      method: 'DELETE',
      headers: this.headers(key),
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
  },

  // --- Threads: one AnythingLLM thread per Scholar chat, so history and RAG
  // --- context live on the server alongside the workspace's documents.

  async createThread({ url, key, slug, name }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}/thread/new`), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(name ? { name } : {}),
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.thread;
  },

  async renameThread({ url, key, slug, threadSlug, name }) {
    const resp = await fetch(
      this.api(url, `/workspace/${encodeURIComponent(slug)}/thread/${encodeURIComponent(threadSlug)}/update`), {
        method: 'POST',
        headers: this.headers(key, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(20000),
      });
    return resp.ok;
  },

  async deleteThread({ url, key, slug, threadSlug }) {
    const resp = await fetch(
      this.api(url, `/workspace/${encodeURIComponent(slug)}/thread/${encodeURIComponent(threadSlug)}`), {
        method: 'DELETE',
        headers: this.headers(key),
        signal: AbortSignal.timeout(20000),
      });
    return resp.ok;
  },

  // --- Documents: what makes a Project more than a folder.

  // POST /api/v1/document/upload takes multipart form-data and, given
  // `addToWorkspaces`, embeds the document into those workspaces in the same
  // call — so there is no separate update-embeddings step on the happy path.
  async uploadDocument({ url, key, file, slug, onProgress }) {
    const form = new FormData();
    form.append('file', file, file.name);
    if (slug) form.append('addToWorkspaces', slug);

    // XHR rather than fetch: upload progress is the whole point of a document
    // panel, and fetch still can't report it.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.api(url, '/document/upload'));
      if (key) xhr.setRequestHeader('Authorization', 'Bearer ' + key);
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || ''}`));
          return;
        }
        let data;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = {}; }
        if (data.error) { reject(new Error(data.error)); return; }
        resolve(data.documents || []);
      };
      xhr.onerror = () => reject(new Error('Upload failed — could not reach AnythingLLM.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out.'));
      xhr.timeout = 600000; // parsing + embedding a large PDF is genuinely slow
      xhr.send(form);
    });
  },

  // Saves a string as a document — used by Scholar Code to push a source file
  // into the project's knowledge without writing it to disk first.
  async uploadRawText({ url, key, text, title, slug }) {
    const resp = await fetch(this.api(url, '/document/raw-text'), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        textContent: text,
        addToWorkspaces: slug || undefined,
        metadata: { title: title || 'Untitled', docSource: 'Scholar' },
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.documents || [];
  },

  // Scrapes a URL and stores the result as a document.
  async uploadLink({ url, key, link, slug }) {
    const resp = await fetch(this.api(url, '/document/upload-link'), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ link, addToWorkspaces: slug || undefined }),
      signal: AbortSignal.timeout(180000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.documents || [];
  },

  // Detaching a document from a workspace is an embedding update, not a
  // delete — the file stays in AnythingLLM's document store and can be
  // re-attached to this or any other workspace later.
  async removeDocuments({ url, key, slug, paths }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}/update-embeddings`), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ adds: [], deletes: paths }),
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
  },

  async addDocuments({ url, key, slug, paths }) {
    const resp = await fetch(this.api(url, `/workspace/${encodeURIComponent(slug)}/update-embeddings`), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ adds: paths, deletes: [] }),
      signal: AbortSignal.timeout(300000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
  },

  // --- Chat ---

  // Streams a reply. Callbacks rather than a return value because the caller
  // paints as tokens land:
  //   onDelta(text)        answer tokens
  //   onReasoning(text)    <think> content, split back out
  //   onThought(text)      agent step ("searching the web for ...")
  //   onSources(list)      document citations
  //   onMetrics(obj)       token counts, when the provider reports them
  //
  // `reset` wipes the thread's server-side history first. Scholar sends it
  // whenever its own transcript no longer matches the server's — after an edit
  // or a regenerate — and replays the surviving turns, so the two never drift.
  async stream({
    url, key, slug, threadSlug, message, mode = 'chat', attachments = [],
    reset = false, signal, onDelta, onReasoning, onThought, onSources, onMetrics,
  }) {
    const path = threadSlug
      ? `/workspace/${encodeURIComponent(slug)}/thread/${encodeURIComponent(threadSlug)}/stream-chat`
      : `/workspace/${encodeURIComponent(slug)}/stream-chat`;

    const resp = await fetch(this.api(url, path), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }),
      body: JSON.stringify({ message, mode, attachments, reset }),
      signal,
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${body || resp.statusText}`);
    }

    // Reasoning arrives inline as <think>…</think> inside the token stream, so
    // the split has to be stateful across chunks rather than per-chunk.
    let inThink = false;
    let carry = '';
    let sawAnyText = false;

    // `flush` is the end-of-stream call: it releases any held-back partial tag
    // as literal text instead of holding it forever. Without it, a reply that
    // simply ends on a "<" loses that character.
    const emitText = (raw, flush = false) => {
      if (!raw && !flush) return;
      if (raw) sawAnyText = true;
      let text = carry + (raw || '');
      carry = '';
      if (!text) return;

      // A <think> tag can straddle a chunk boundary, so a trailing fragment
      // that could still grow into one is held back until the next chunk.
      if (!flush) {
        const partial = text.match(/<\/?t?h?i?n?k?>?$/);
        if (partial && partial[0].length < 8 && !/<\/?think>$/.test(partial[0])) {
          carry = partial[0];
          text = text.slice(0, text.length - partial[0].length);
        }
      }

      while (text) {
        if (inThink) {
          const end = text.indexOf('</think>');
          if (end === -1) { if (onReasoning) onReasoning(text); return; }
          if (end > 0 && onReasoning) onReasoning(text.slice(0, end));
          inThink = false;
          text = text.slice(end + 8);
        } else {
          const start = text.indexOf('<think>');
          if (start === -1) { if (onDelta) onDelta(text); return; }
          if (start > 0 && onDelta) onDelta(text.slice(0, start));
          inThink = true;
          text = text.slice(start + 7);
        }
      }
    };

    let aborted = null;

    await readSSE(resp, (frame) => {
      if (frame.error && frame.type === 'abort') { aborted = frame.error; return; }

      switch (frame.type) {
        case 'textResponseChunk':
          emitText(frame.textResponse);
          break;

        // Agent runs are not token-streamed: the whole answer lands at once.
        case 'textResponse':
          if (frame.textResponse) emitText(frame.textResponse);
          break;

        case 'agentThought':
          if (onThought && frame.thought) onThought(frame.thought);
          break;

        case 'fileDownload':
          if (onThought && frame.fileDownload?.name) {
            onThought(`Produced file: ${frame.fileDownload.name}`);
          }
          break;

        case 'finalizeResponseStream':
          // The agent path carries its whole answer here rather than in
          // chunks, so take it when nothing streamed earlier.
          if (!sawAnyText && frame.textResponse) emitText(frame.textResponse);
          if (Array.isArray(frame.thoughts) && onThought) {
            frame.thoughts.forEach(t => { if (t) onThought(t); });
          }
          if (frame.sources?.length && onSources) onSources(frame.sources);
          if (frame.metrics && onMetrics) onMetrics(frame.metrics);
          break;
      }

      if (frame.sources?.length && frame.type !== 'finalizeResponseStream' && onSources) {
        onSources(frame.sources);
      }
    });

    if (carry) emitText('', true);
    if (aborted) throw new Error(aborted);
  },

  // Wipes a thread's server-side history without sending a new message.
  async resetThread({ url, key, slug, threadSlug }) {
    const path = threadSlug
      ? `/workspace/${encodeURIComponent(slug)}/thread/${encodeURIComponent(threadSlug)}/chat`
      : `/workspace/${encodeURIComponent(slug)}/chat`;
    await fetch(this.api(url, path), {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: '', mode: 'chat', reset: true }),
      signal: AbortSignal.timeout(30000),
    }).catch(() => {});
  },
};

// === LM Studio client ===

// The original backend, kept as the fallback. Plain OpenAI-compatible /v1, so
// it carries the whole conversation on every request and has no server-side
// notion of a thread, a document, or an agent.
const LMStudio = {
  id: BACKEND.LMSTUDIO,
  label: 'LM Studio',
  defaultPort: 1234,

  headers(token, extra) {
    const h = { ...(extra || {}) };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  },

  async probe({ url, key, timeout = 10000 }) {
    const base = normalizeBase(url);
    if (!base) return { ok: false, reason: 'empty', error: 'Enter an address' };
    if (isMixedContentBlocked(base)) {
      return {
        ok: false,
        reason: 'mixed-content',
        error: `This page is served over https, so the browser will block a plain http call to ${base}. ` +
               `Use your Tailscale https name, or run Scholar locally over http.`,
      };
    }
    try {
      const resp = await fetch(base + '/v1/models', {
        headers: this.headers(key),
        signal: AbortSignal.timeout(timeout),
      });
      if (resp.status === 401 || resp.status === 403) {
        return {
          ok: false,
          reason: 'auth',
          error: key
            ? 'LM Studio rejected that token. Check Developer → Server Settings → Manage Tokens.'
            : 'This LM Studio requires a token. Create one under Developer → Server Settings → Manage Tokens.',
        };
      }
      if (!resp.ok) return { ok: false, reason: 'http', error: `LM Studio returned HTTP ${resp.status}` };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        reason: 'unreachable',
        error: `Could not reach LM Studio at ${base} — check the server is started, CORS is on, ` +
               `"Serve on Local Network" is on, and Tailscale is up.`,
      };
    }
  },

  async listModels({ url, key }) {
    const resp = await fetch(normalizeBase(url) + '/v1/models', {
      headers: this.headers(key),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.data || [];
  },

  // Same callback shape as AnythingLLM's stream, minus the concepts LM Studio
  // doesn't have, so the caller's rendering path doesn't branch on backend.
  async stream({
    url, key, model, messages, temperature, maxTokens, useStream = true,
    signal, onDelta, onReasoning, onMetrics, onFinishReason,
  }) {
    const resp = await fetch(normalizeBase(url) + '/v1/chat/completions', {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        model: model || undefined,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: useStream,
      }),
      signal,
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${body || resp.statusText}`);
    }

    if (!useStream) {
      const data = await resp.json();
      const msg = data.choices?.[0]?.message || {};
      if (msg.reasoning_content && onReasoning) onReasoning(msg.reasoning_content);
      if (msg.content && onDelta) onDelta(msg.content);
      if (data.usage && onMetrics) onMetrics(data.usage);
      if (onFinishReason) onFinishReason(data.choices?.[0]?.finish_reason || null);
      return;
    }

    await readSSE(resp, (chunk) => {
      if (chunk.error) throw new Error(chunk.error.message || 'Stream error');
      if (chunk.usage && onMetrics) onMetrics(chunk.usage);
      if (chunk.choices?.[0]?.finish_reason && onFinishReason) {
        onFinishReason(chunk.choices[0].finish_reason);
      }
      const delta = chunk.choices?.[0]?.delta || {};
      if (delta.reasoning_content && onReasoning) onReasoning(delta.reasoning_content);
      if (delta.content && onDelta) onDelta(delta.content);
    });
  },
};

const PROVIDERS = {
  [BACKEND.ANYTHINGLLM]: AnythingLLM,
  [BACKEND.LMSTUDIO]: LMStudio,
};
