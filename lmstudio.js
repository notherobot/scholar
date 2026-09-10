// === LM Studio client ===
// Everything Scholar knows about talking to a server lives here.
//
// Chat goes through LM Studio's native POST /api/v1/chat rather than the
// OpenAI-compatible /v1/chat/completions, because only the native endpoint
// accepts `integrations` — which is how MCP servers get attached to a turn.
// That is the whole reason this file exists in this shape: the OpenAI-shaped
// endpoint cannot run tools, so a web-search MCP server is invisible to it.
//
// The native endpoint costs two things in exchange:
//
//   1. `input` is ONE message, not a transcript. There is no role field on it.
//      Multi-turn works by threading: every response carries a `response_id`,
//      and passing it back as `previous_response_id` continues that thread
//      server-side. See buildTurn() in app.js for how a broken thread recovers.
//   2. It needs LM Studio 0.4.0+.
//
// MCP also needs an API token: LM Studio gates mcp.json servers behind
// "Require Authentication" because those servers can reach the filesystem, so
// an unauthenticated caller gets 403 "Permission denied to use plugin".

// === URL handling ===

// Turns whatever the user typed into an absolute origin.
//
// The scheme is guessed from the host, because guessing wrong is a dead end
// either way. A Tailscale MagicDNS name (my-pc.tailnet.ts.net) can hold a real
// Let's Encrypt certificate, so it gets https. A raw 100.x.x.x address or
// localhost never can — nobody issues certificates for IPs — so forcing https
// there produces a TLS error that reads like the server being down.
//
// Whatever port is typed, or omitted, is kept: a `tailscale serve` setup maps
// the bare hostname straight through, and forcing :1234 would break it.
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

// True when the page is https but the target is http. Browsers block that
// outright and it surfaces as an unexplained network error, so it is worth
// naming before the request is even attempted.
function isMixedContentBlocked(base) {
  if (location.protocol !== 'https:') return false;
  try { return new URL(base).protocol === 'http:'; } catch (e) { return false; }
}

// === MCP integrations ===

// LM Studio has no endpoint that lists installed MCP servers or plugins, so
// Scholar cannot discover them — they have to be named. Parses the
// comma-separated list from Settings into what `integrations` expects.
//
// Two id namespaces exist and they must not be confused:
//   - a server from mcp.json  -> "mcp/<server_label>"  (e.g. mcp/duckduckgo)
//   - a plugin from the Hub   -> "<owner>/<name>"      (e.g. danielsig/duckduckgo)
//
// Both are already "<something>/<something>", so the string is passed through
// untouched. `integrations` accepts bare strings as shorthand for a plugin
// with no extra configuration, which is all Scholar needs.
function parseIntegrations(raw) {
  return String(raw || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// === SSE ===

// LM Studio frames the stream as `event: <type>` / `data: <json>` pairs. Only
// the data lines carry anything the client needs — every event repeats its own
// type inside the JSON — so the event: lines are skipped rather than tracked.
//
// Buffering the tail matters: a chunk boundary lands mid-line often enough
// that dropping the remainder loses tokens.
async function readSSE(resp, onEvent) {
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
      onEvent(frame);
    }
  }
}

const LMStudio = {
  defaultPort: 1234,

  headers(token, extra) {
    const h = { ...(extra || {}) };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  },

  // /v1/models is the cheapest reachability check and works on every LM Studio
  // version, so a server that is up but too old to have /api/v1/chat still
  // connects — and then says so on the first message rather than at setup,
  // where the difference would be noise.
  async probe({ url, key, timeout = 10000 }) {
    const base = normalizeBase(url);
    if (!base) return { ok: false, reason: 'empty', error: 'Enter an address' };
    if (isMixedContentBlocked(base)) {
      return {
        ok: false,
        reason: 'mixed-content',
        error: `This page is served over https, so the browser will block a plain http call to ${base}. ` +
               `Use your Tailscale https name (e.g. https://my-pc.tailnet.ts.net), or run Scholar locally over http.`,
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
            ? 'LM Studio rejected that token. Check it under Developer → Server Settings → Manage Tokens.'
            : 'This server requires an API token. Create one under Developer → Server Settings → Manage Tokens.',
        };
      }
      if (!resp.ok) return { ok: false, reason: 'http', error: `LM Studio returned HTTP ${resp.status}` };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        reason: 'unreachable',
        error: `Could not reach LM Studio at ${base} — check the server is started, CORS is on, ` +
               `"Serve on Local Network" is on, and Tailscale is up on both devices.`,
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

  // Sends one turn.
  //
  //   input        one message: a string, or an array of {type:'text'|'image'}
  //                parts when images are attached
  //   previousId   the last response_id, to continue that thread server-side
  //   integrations MCP server / plugin ids to make available to the model
  //
  // Callbacks, because the caller paints as events land:
  //   onDelta(text)              answer tokens
  //   onReasoning(text)          reasoning tokens
  //   onToolStart({tool, from})  a tool call began
  //   onToolArgs({tool, args})   its arguments finished streaming
  //   onToolDone({tool, args, output, from})     it returned
  //   onToolFail({tool, reason, kind})           it failed
  //   onResponseId(id)           thread id to continue from next turn
  //   onStats(stats)             token counts
  async chat({
    url, key, model, input, integrations = [], previousId = null,
    systemPrompt = '', stream = true, signal,
    onDelta, onReasoning, onToolStart, onToolArgs, onToolDone, onToolFail,
    onResponseId, onStats,
  }) {
    const body = {
      model: model || undefined,
      input,
      stream,
    };
    if (integrations.length) body.integrations = integrations;
    // Left unset for ordinary chat, so the model's own preset in LM Studio
    // governs — that's where the user's MCP-aware prompt lives. Scholar Code
    // sets it, because it needs a specific reply format back.
    if (systemPrompt) body.system_prompt = systemPrompt;
    // Threading is opt-in per turn. Omitting previous_response_id starts a new
    // thread; LM Studio stores it either way and hands back a fresh id.
    if (previousId) body.previous_response_id = previousId;

    const resp = await fetch(normalizeBase(url) + '/api/v1/chat', {
      method: 'POST',
      headers: this.headers(key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw this.describeError(resp.status, text, integrations.length > 0);
    }

    if (!stream) {
      const data = await resp.json();
      this.drainOutput(data, { onDelta, onReasoning, onToolDone });
      if (data.stats && onStats) onStats(data.stats);
      if (data.response_id && onResponseId) onResponseId(data.response_id);
      return;
    }

    // Arguments stream in as a whole object per event rather than as text, so
    // the last one seen for a call is the complete set.
    await readSSE(resp, (ev) => {
      switch (ev.type) {
        case 'reasoning.delta':
          if (onReasoning && ev.content != null) onReasoning(ev.content);
          break;

        case 'message.delta':
          if (onDelta && ev.content != null) onDelta(ev.content);
          break;

        case 'tool_call.start':
          if (onToolStart) onToolStart({ tool: ev.tool, from: providerLabel(ev.provider_info) });
          break;

        case 'tool_call.arguments':
          if (onToolArgs) onToolArgs({ tool: ev.tool, args: ev.arguments });
          break;

        case 'tool_call.success':
          if (onToolDone) {
            onToolDone({
              tool: ev.tool,
              args: ev.arguments,
              output: ev.output,
              from: providerLabel(ev.provider_info),
            });
          }
          break;

        case 'tool_call.failure':
          if (onToolFail) {
            onToolFail({
              tool: ev.metadata?.tool_name || ev.tool || 'tool',
              reason: ev.reason || 'Tool call failed',
              kind: ev.metadata?.type,
            });
          }
          break;

        case 'error': {
          // The two MCP-shaped error types point at configuration rather than
          // at the request, so they get told apart from a generic failure.
          const kind = ev.error?.type;
          const msg = ev.error?.message || 'LM Studio reported an error';
          if (kind === 'mcp_connection_error' || kind === 'plugin_connection_error') {
            throw new Error(
              `Could not reach an MCP server: ${msg}. Check the server name in Settings matches an entry ` +
              `in LM Studio's mcp.json (or an installed plugin), and that the server itself starts cleanly.`);
          }
          throw new Error(msg);
        }

        case 'chat.end':
          if (ev.result?.stats && onStats) onStats(ev.result.stats);
          if (ev.result?.response_id && onResponseId) onResponseId(ev.result.response_id);
          break;
      }
    });
  },

  // The non-streaming response carries the whole turn as a typed output array.
  drainOutput(data, { onDelta, onReasoning, onToolDone }) {
    (data.output || []).forEach(part => {
      if (part.type === 'reasoning' && onReasoning) onReasoning(part.content || '');
      else if (part.type === 'message' && onDelta) onDelta(part.content || '');
      else if (part.type === 'tool_call' && onToolDone) {
        onToolDone({
          tool: part.tool,
          args: part.arguments,
          output: part.output,
          from: providerLabel(part.provider_info),
        });
      }
    });
  },

  // Turns an HTTP failure into something that names the actual fix. The three
  // that actually happen in practice each point somewhere different, and the
  // raw status alone sends you to the wrong one.
  describeError(status, body, usedIntegrations) {
    if (status === 404) {
      return new Error(
        'This LM Studio has no /api/v1/chat endpoint, which is what MCP tools run through. ' +
        'It needs LM Studio 0.4.0 or newer — update it and reconnect.');
    }
    if (status === 401 || status === 403) {
      return new Error(usedIntegrations
        ? 'LM Studio refused the MCP servers (HTTP ' + status + '). Turn on Developer → Server Settings → ' +
          '"Require Authentication" and "Allow calling servers from mcp.json", then paste a token with ' +
          'Integration Access into Settings. MCP servers can reach your filesystem, so LM Studio gates them ' +
          'behind a token deliberately.'
        : 'LM Studio rejected the API token. Check it under Developer → Server Settings → Manage Tokens.');
    }
    return new Error(`HTTP ${status}${body ? ': ' + body.slice(0, 300) : ''}`);
  },
};

// A tool call names where it came from differently depending on the provider:
// an mcp.json server reports plugin_id, an ephemeral one reports server_label.
// The "mcp/" prefix is dropped because it's noise in a UI label.
function providerLabel(info) {
  if (!info) return '';
  const raw = info.server_label || info.plugin_id || '';
  return String(raw).replace(/^mcp\//, '');
}
