// === Version ===
// Bump both together on every release (keep in sync with sw.js's CACHE_NAME
// and the ?v= query strings in index.html).
const APP_VERSION = 'v0.9.0';
const APP_VERSION_DATE = '2026-09-09T12:00:00Z';

// Changelog, newest first. Each entry is one shipped version: its release
// timestamp and the user-facing notes for that bump. The header dropdown
// shows the newest 3; the "View last 10 updates" modal shows the newest 10.
const CHANGELOG = [
  { version: 'v0.9.0', date: '2026-09-09T12:00:00Z', notes: [
    'AnythingLLM is now the primary backend, on its default port 3001. Connect with your Tailscale address and an AnythingLLM API key (Settings → Tools → Developer API). LM Studio is still there as a backup — switch between them in Settings at any time',
    'Projects, backed by AnythingLLM workspaces. A project holds documents and custom instructions that every chat inside it can draw on, the same way Claude Projects work. Create one from the Chats panel, then drag files onto it or paste a URL to add it to the project\'s knowledge',
    'Each chat in a project is a real AnythingLLM thread, so history and retrieval live next to the documents instead of only in this browser',
    'Agent mode: turn it on and Scholar runs the question through AnythingLLM\'s agent, which can search and read the web before answering. Its steps stream live above the reply, and the sources it used are listed underneath. This works over the native chat endpoint — the previous attempt went through the OpenAI-compatible shim, which silently never ran the agent at all',
    'Answers now show the project documents they drew on, with the matching snippet on hover',
    'Chat mode picker: Chat (normal), Query (answer only from project documents), or Automatic (let the model call tools when it can)',
    'Scholar Code — a separate coding view with a file tree, an editor, a sandboxed live preview, and a chat that writes straight into your files. Files can be pushed into a project so later chats can read them',
    'The composer row really does stay on one line now, at every width from 320px up. v0.8.7 claimed this but the row was a three-column grid holding four items, so Send had been wrapping onto its own line the whole time',
    'A bare Tailscale IP now connects over http instead of https. Nothing issues certificates for an IP, so the old behaviour failed with a TLS error that read like the server being down; a .ts.net name still gets https',
  ] },
  { version: 'v0.8.7', date: '2026-08-31T02:30:00Z', notes: [
    'Controls below the input field now stay on a single row at all viewport widths — status dot, model picker, Send/Stop, attach, and folder buttons no longer wrap',
  ] },
  { version: 'v0.8.6', date: '2026-08-31T01:00:00Z', notes: [
    'Delete confirmation: clicking the trash icon enters confirmation mode — a red Delete button overlays the chat\'s action icons. Click Delete to confirm or click elsewhere to cancel.',
  ] },
  { version: 'v0.8.5', date: '2026-08-28T01:00:00Z', notes: [
    'Folder pre-assignment for new chats: click the folder icon next to the attachment button to pick a folder before your first message. The icon highlights when a folder is assigned. The chat joins that folder automatically when created.',
  ] },
  { version: 'v0.8.4', date: '2026-08-28T00:00:00Z', notes: [
    'Send/Stop\'s "→"/"■" text characters replaced with proper SVG icons — the arrow was reading as too thin',
    'Fixed the Ko-Metru background mark not shifting over with the composer/welcome text when the Chats panel pushes the layout open',
    'Smoothed the Chats and Settings panel slide animations — they were snapping open/closed in 50ms instead of sliding',
  ] },
  { version: 'v0.8.3', date: '2026-08-26T20:00:00Z', notes: [
    '"Scholar" title moved to true center of the header bar',
    'Status dot and model picker moved out of the header and into the composer, centered between the attach icon and Send/Stop',
    'Send and Stop are now labeled text buttons ("Send→" / "Stop■") instead of icon-only circles',
  ] },
  { version: 'v0.8.2', date: '2026-08-26T19:00:00Z', notes: [
    '"Scholar" title added to the header',
    'The Chats panel now reopens automatically on reload if you left it open — like Claude\'s sidebar — on wide screens; unchanged on mobile, where it\'s a drawer rather than a docked panel',
  ] },
  { version: 'v0.8.1', date: '2026-08-26T18:00:00Z', notes: [
    'Settings and Chats panels are wider by default, and can be dragged wider (or narrower) from their inner edge — the size sticks across reloads',
    'Chats can be organized into folders: create one from the Chats panel, drag a chat onto it or use its new folder icon to move it, rename or delete folders anytime. Deleting a folder keeps its chats — they just become ungrouped again',
  ] },
  { version: 'v0.8.0', date: '2026-08-26T12:00:00Z', notes: [
    'Found and fixed the real cause of the freezing tab: the markdown renderer could enter an infinite loop. A line that matched none of its block rules but was also excluded from paragraphs — a bare "# ", "--- x", "***text" — left its cursor parked and spun forever. Streaming produces half-finished lines constantly, so this fired mid-reply and hung the page for good. It was never a speed problem, which is why throttling never fixed it',
    'Markdown rendering rewritten from scratch with guaranteed forward progress and no backtracking-prone patterns, so no model output can stall it',
    'Streaming rebuilt to render incrementally: finished blocks are parsed once and left alone, and only the last unfinished block is re-rendered as text arrives. Cost is now proportional to reply length instead of its square',
    'Links in replies are sanitized, and code spans no longer mangle URLs containing underscores',
    'Removed MCP tools, the Think and Low effort toggles, and the leaked-tool-call rewriting that came with them',
    'Regenerate added to your own messages, alongside Copy and Edit',
  ] },
  { version: 'v0.7.38', date: '2026-08-26T00:00:00Z', notes: [
    'Fixed the API token sometimes not being sent on connect — it\'s now synced from the field right before the request instead of only on keystrokes',
  ] },
  { version: 'v0.7.37', date: '2026-08-12T10:00:00Z', notes: [
    'Welcome message fades out over 100ms as soon as you start typing, instead of waiting for the message to send',
    'iOS: the Chats panel now drags open/closed 1:1 with your finger instead of popping in once a threshold is crossed — matches native side-menu behavior, including a fast-flick shortcut',
  ] },
  { version: 'v0.7.36', date: '2026-08-12T09:00:00Z', notes: [
    'Fixed a real crash cause during long streaming replies: code blocks were being fully re-syntax-highlighted from scratch on every single token update, since the DOM gets rebuilt each tick — for a long/growing code block that cost compounded for the whole generation. Code now renders plain while streaming and highlights once at the end',
    'The streaming re-render interval now scales up as a reply grows, capping the worst-case cost instead of grinding the tab down on unusually long generations',
  ] },
  { version: 'v0.7.35', date: '2026-08-12T08:00:00Z', notes: [
    'New "Data & Storage" section in Settings: shows this chat\'s message/image count and size, plus total storage across all saved chats',
    'Long chats now load windowed to the most recent 50 messages by default (adjustable 10-300) instead of rendering the entire history at once — a banner offers "Load full chat" on demand',
    'Added "Remove images from this chat" and "Clear all chat history" for reclaiming space',
    'Fixed the composer turning into a stretched oval on multi-line input — its border-radius no longer scales with box height',
  ] },
  { version: 'v0.7.34', date: '2026-08-12T07:00:00Z', notes: [
    'Raw LaTeX symbols some models emit (e.g. "$\\rightarrow$", "\\leq", "\\alpha") now render as their actual character (→, ≤, α) instead of literal source text',
  ] },
  { version: 'v0.7.33', date: '2026-08-12T06:00:00Z', notes: [
    'Removed the built-in default system prompt — new devices now start with an empty one instead of the web-search instructions',
  ] },
  { version: 'v0.7.32', date: '2026-08-12T05:00:00Z', notes: [
    'Fixed the Chats and Settings panels popping open instead of sliding — a generic display:none rule was overriding their slide transition',
    'Both panels are wider on mobile (90vw, up from ~82vw)',
    'Swipe from the left edge to open Chats, on iOS home-screen installs only (regular Safari keeps that gesture for back-navigation)',
  ] },
  { version: 'v0.7.31', date: '2026-08-12T04:00:00Z', notes: [
    'Removed the thinking-hiding machinery entirely — messages always render exactly as the model sent them. Turn the Think toggle off in the composer if you don\'t want a model generating reasoning in the first place',
    'Removed the now-unused "Collapse model thinking" setting',
  ] },
  { version: 'v0.7.30', date: '2026-08-12T03:00:00Z', notes: [
    'Fixed a real performance bug: streaming re-rendered the entire message on every single token, which could bog down the tab on long replies — now throttled to ~15 updates/sec',
    'Invented tool-call syntax that some models (like Gemma) leak as raw text is now swapped for a plain notice instead of showing the garbage pseudo-JSON',
  ] },
  { version: 'v0.7.29', date: '2026-08-12T02:00:00Z', notes: [
    'Reasoning-hiding heuristics were mis-hiding real answer content — disabled for now, every message shows raw and unfiltered',
  ] },
  { version: 'v0.7.28', date: '2026-08-12T01:00:00Z', notes: [
    'Catches another shape of untagged thinking: models (like Gemma) that narrate the request ("The user is asking...") before answering now have that narration hidden too',
  ] },
  { version: 'v0.7.27', date: '2026-08-12T00:00:00Z', notes: [
    'Gemma is now the default model on startup if available',
    'Thinking/reasoning blocks are now hidden from display — only the answer is shown',
  ] },
  { version: 'v0.7.26', date: '2026-08-08T02:00:00Z', notes: [
    'Fixed Low effort toggle — LM Studio expects reasoning: {effort}, not a flat reasoning_effort field, so it was being silently ignored',
  ] },
  { version: 'v0.7.25', date: '2026-08-08T01:00:00Z', notes: [
    'Composer gained Think and Low effort toggles — control reasoning per chat',
  ] },
  { version: 'v0.7.24', date: '2026-08-08T00:00:00Z', notes: [
    'Prompts can be edited and resent — replaces that turn and everything after it',
    'Copy button added to sent prompts (answers already had one)',
  ] },
  { version: 'v0.7.23', date: '2026-08-06T02:00:00Z', notes: [
    'Model picker sorted smallest to largest by parameter count',
  ] },
  { version: 'v0.7.22', date: '2026-08-06T01:00:00Z', notes: [
    'Model picker descriptions now recognize reasoning, agentic, and code-tuned models by name (e.g. Nemotron, R1, coder variants) instead of guessing from size alone',
    'Composer reverted to a rounded pill text field, with the tool row kept underneath as a separate strip',
  ] },
  { version: 'v0.7.21', date: '2026-08-06T00:00:00Z', notes: [
    'Model picker rebuilt as a proper list: shows what each model is best at, its context length, quantization, and vision support',
    'Composer restyled Claude-style — attach and send buttons now sit in a row below the message box',
  ] },
  { version: 'v0.7.20', date: '2026-08-02T00:00:00Z', notes: [
    'Default max-tokens raised from 2048 to 20000',
  ] },
  { version: 'v0.7.19', date: '2026-08-01T19:15:00Z', notes: [
    'PDF uploads: text is extracted client-side (via pdf.js) and attached like a text file',
    'Drag-and-drop and the attach button both route .pdf files through extraction',
  ] },
  { version: 'v0.7.18', date: '2026-07-31T23:30:00Z', notes: [
    'Peak-2002 Aqua/Web-2.0 redesign: jelly pill buttons, brushed-metal header, glossy scrollbar',
    'Buttons, inputs, and search boxes turned fully pill-shaped with candy-glass shine',
    'Deeper bevels, glow rings, and glass sheens on cards, avatars, and panels',
  ] },
  { version: 'v0.7.17', date: '2026-07-31T23:05:00Z', notes: [
    'Removed the triangle-mesh lattice background — kept just the Ko-Metru disc',
  ] },
  { version: 'v0.7.16', date: '2026-07-31T22:47:57Z', notes: [
    'Triangle-mesh lattice redrawn as an SVG tile so vertices actually meet',
    'Lattice and disc merged onto one background stack so the lattice is unambiguously behind it',
    'Lattice re-oriented to horizontal lines with 60deg/120deg diagonals',
  ] },
  { version: 'v0.7.15', date: '2026-07-31T22:36:50Z', notes: [
    'Faint triangle-mesh lattice added behind the Ko-Metru disc, echoing its facets',
  ] },
  { version: 'v0.7.14', date: '2026-07-31T22:29:03Z', notes: [
    'Scholar-favicon avatar scaled down 20% and given a brighter navy backdrop',
    'You avatar recolored to a saturated blue matching the site palette',
  ] },
  { version: 'v0.7.13', date: '2026-07-31T22:22:41Z', notes: [
    'Changelog entries show release time, not just date',
  ] },
  { version: 'v0.7.12', date: '2026-07-31T22:21:46Z', notes: [
    'Changelog now grouped by version with dates, plus a scrollable last-10 view',
  ] },
  { version: 'v0.7.11', date: '2026-07-31T18:44:08Z', notes: [
    'AI avatar replaced with the Scholar favicon',
    'Successful-but-failed tool calls show their result text',
  ] },
  { version: 'v0.7.10', date: '2026-07-31T18:18:53Z', notes: [
    'Search + Visit Website wired in as the default on new devices',
  ] },
  { version: 'v0.7.9', date: '2026-07-31T18:08:26Z', notes: [
    'LM Studio Hub plugins work as tool providers',
  ] },
  { version: 'v0.7.8', date: '2026-07-31T17:10:03Z', notes: [
    'Tool calls show their name and arguments',
    'Failed tool calls show the reason',
    'Repeated tool calls flagged as a loop',
  ] },
  { version: 'v0.7.7', date: '2026-07-28T17:36:19Z', notes: [
    'Favicon opacity fixed to 100%',
  ] },
  { version: 'v0.7.6', date: '2026-07-27T22:41:53Z', notes: [
    'Connect errors show the exact URL tried',
  ] },
  { version: 'v0.7.5', date: '2026-07-27T22:34:59Z', notes: [
    'Show/Hide toggle on token fields',
  ] },
  { version: 'v0.7.4', date: '2026-07-27T22:32:53Z', notes: [
    'Setup screen token field styled to match the address field',
  ] },
  { version: 'v0.7.3', date: '2026-07-27T22:31:33Z', notes: [
    'Port no longer forced to 1234',
  ] },
];

// Built-in default for a device that has never saved settings. Empty by
// design — Scholar sends no system prompt unless one is typed in Settings.
const DEFAULT_SYSTEM_PROMPT = '';

// === State ===
const state = {
  // Connection to both backends. AnythingLLM is the default; LM Studio stays
  // configured alongside it so switching back is one click, not a re-setup.
  conn: {
    backend: BACKEND.ANYTHINGLLM,
    allmUrl: '',
    allmKey: '',
    lmsUrl: '',
    lmsToken: '',
  },
  // Projects (AnythingLLM workspaces). The active one scopes new chats; a
  // chat that already exists keeps whatever project it was created in.
  activeProjectSlug: null,
  // AnythingLLM chat mode: 'chat' | 'query' | 'automatic'.
  chatMode: 'chat',
  // When on, messages are sent as `@agent ...`, which is what actually starts
  // AnythingLLM's agent (with web search and scraping) over the REST API.
  agentMode: false,
  apiBase: '',
  connected: false,
  messages: [],
  streaming: false,
  abortController: null,
  currentModel: null,
  modelCaps: { vision: false },
  modelMeta: {},          // { [modelId]: { type, publisher, quantization, maxContextLength, state } } from /api/v0/models
  availableModels: [],    // raw /v1/models list, used to render the model picker
  lastLoadedModel: null,  // model that last actually produced output — drives the loading bar
  attachments: [],       // pending uploads: { kind:'image'|'file', name, size, url?, text? }
  sessions: [],          // saved chat sessions
  folders: [],           // chat folders: { id, name, collapsed }; a session
                          // opts into one via session.folderId
  nextChatFolderId: null, // folder assignment for the next new chat (cleared after send)
  deleteConfirmSessionId: null, // session in delete confirmation mode
  currentSessionId: null,
  stickToBottom: true,   // auto-scroll only while the user is at the bottom
  // LM Studio API token, sent as `Authorization: Bearer` on every request.
  // Only needed when "Require Authentication" is on, but once it is, every
  // endpoint needs it. Stored in this browser's localStorage only.
  apiToken: '',
  // How many of the most recent messages get rendered into the DOM when a
  // chat is opened. Nothing is deleted — this only limits the expensive
  // part (markdown parse + syntax highlight + DOM build) that makes long
  // chats feel heavy to load. See renderCurrentMessages/loadFullChat.
  messageLoadLimit: 50,
  // True once the user has clicked "Load full chat" for the session that's
  // currently open — resets on every new chat load (loadSession/newChat).
  chatFullyLoaded: false,
};

// === DOM ===
const $ = (sel) => document.querySelector(sel);
const appEl          = $('#app');
const setup          = $('#setup');
const setupUrl       = $('#setup-url');
const setupConnect   = $('#setup-connect');
const setupError     = $('#setup-error');
const setupToken     = $('#setup-token');
const useLocalhost   = $('#use-localhost');
const setupAllmUrl   = $('#setup-allm-url');
const setupAllmKey   = $('#setup-allm-key');
const useAllmLocal   = $('#use-allm-localhost');

const sidebarAllmUrl = $('#sidebar-allm-url');
const sidebarAllmKey = $('#sidebar-allm-key');
const sidebarAllmReconnect = $('#sidebar-allm-reconnect');

const modelPickerWrap  = $('.model-picker-wrap');
const projectPickerBtn = $('#project-picker-btn');
const projectPickerLabel = $('#project-picker-label');
const projectModal     = $('#project-picker-modal');
const projectModalClose = $('#project-picker-close');
const projectPickerList = $('#project-picker-list');
const agentToggle    = $('#agent-toggle');
const chatModeWrap   = $('#chat-mode-wrap');
const chatModeBtn    = $('#chat-mode-btn');
const chatModeLabel  = $('#chat-mode-label');
const chatModeMenu   = $('#chat-mode-menu');
const codeViewBtn    = $('#code-view-btn');

const headerEl       = $('#header');
const chatContainer  = $('#chat-container');
const inputArea      = $('#input-area');
const statusDot      = $('#status-indicator');
const modelSelect    = $('#model-select');
const modelPickerBtn   = $('#model-picker-btn');
const modelPickerLabel = $('#model-picker-label');
const modelModal       = $('#model-modal');
const modelModalClose  = $('#model-modal-close');
const modelPickerList  = $('#model-picker-list');
const newChatBtn     = $('#new-chat-btn');

const sidebarToggle  = $('#sidebar-toggle');
const sidebar        = $('#sidebar');
const sidebarOverlay = $('#sidebar-overlay');
const sidebarClose   = $('#sidebar-close');
const sidebarUrl     = $('#sidebar-url');
const sidebarReconn  = $('#sidebar-reconnect');
const apiTokenInput  = $('#api-token');
const disconnectBtn  = $('#disconnect-btn');
const systemPrompt   = $('#system-prompt');
const tempSlider     = $('#temperature');
const tempValue      = $('#temp-value');
const tokensSlider   = $('#max-tokens');
const tokensValue    = $('#tokens-value');
const streamToggle   = $('#stream-toggle');
const dataStatsText  = $('#data-stats-text');
const messageLoadLimitSlider = $('#message-load-limit');
const messageLoadLimitValue  = $('#message-load-limit-value');
const stripImagesBtn = $('#strip-images-btn');
const clearAllChatsBtn = $('#clear-all-chats-btn');

const messagesEl     = $('#messages');
const welcome        = $('#welcome');
const userInput      = $('#user-input');
const sendBtn        = $('#send-btn');
const stopBtn        = $('#stop-btn');

const attachFileBtn  = $('#attach-file-btn');
const fileInput      = $('#file-input');
const attachmentsEl  = $('#attachments');

const folderAssignBtn = $('#folder-assign-btn');
const folderPickerPopover = $('#folder-picker-popover');
const folderPickerList = $('#folder-picker-list');

const historyBtn     = $('#history-btn');
const historyPanel   = $('#history-panel');
const historyOverlay = $('#history-overlay');
const historyClose   = $('#history-close');
const historyNew     = $('#history-new');
const historyNewFolder = $('#history-new-folder');
const historyList    = $('#history-list');
const historyEmpty   = $('#history-empty');
const historySearch  = $('#history-search');
const sidebarResizeHandle  = $('#sidebar-resize-handle');
const historyResizeHandle  = $('#history-resize-handle');
const scrollPill     = $('#scroll-pill');

const versionBtn     = $('#version-btn');
const versionDropdown = $('#version-dropdown');
const versionListRecent = $('#version-list-recent');
const changelogViewAll = $('#changelog-view-all');
const changelogModal   = $('#changelog-modal');
const changelogClose   = $('#changelog-close');
const changelogModalList = $('#changelog-modal-list');
const composerEl     = $('.composer');

// === Init ===
function init() {
  const versionFull = `${APP_VERSION} · ${formatVersionDate(APP_VERSION_DATE)}`;
  document.querySelectorAll('.app-version').forEach(el => {
    if (el.classList.contains('header-version')) {
      el.textContent = APP_VERSION;
      el.title = versionFull;
    } else {
      el.innerHTML = `${escapeHtml(APP_VERSION)} <span class="version-date">· ${escapeHtml(formatVersionDate(APP_VERSION_DATE))}</span>`;
    }
  });
  renderChangelog();
  Projects.init();
  ScholarCode.init();
  loadSettings();
  loadSessions();
  loadFolders();
  setupListeners();
  setupPanelResize(sidebar, sidebarResizeHandle, '--sidebar-width', 'lmstudio-sidebar-width', 'right');
  setupPanelResize(historyPanel, historyResizeHandle, '--history-width', 'lmstudio-history-width', 'left');
  updateDataStats();

  // If the active backend already has an address, skip setup and connect.
  if (activeUrl()) {
    showChat();
    connect();
    // Restore the Chats panel's open/closed state from last time — but only
    // on desktop widths, where it pushes the layout over rather than
    // covering it as a full-screen drawer. Auto-opening that drawer over the
    // chat the moment the page loads on a phone would be jarring in a way
    // reopening a docked sidebar on a wide screen isn't.
    if (window.innerWidth >= 768 && localStorage.getItem(HISTORY_OPEN_KEY) === '1') {
      openHistory();
    }
  }
}

// === Settings ===
// Applies the built-in default to a fresh device, then layers this device's
// saved settings on top — `??` so an explicitly-cleared field (saved as '')
// stays cleared, while a field that was never saved falls through.
function loadSettings() {
  let s = {};
  const saved = localStorage.getItem('lmstudio-chat-settings');
  if (saved) {
    try { s = JSON.parse(saved); } catch(e) { /* ignore */ }
  }
  systemPrompt.value = s.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  tempSlider.value = s.temperature ?? 0.7;
  tokensSlider.value = s.maxTokens ?? 2048;
  streamToggle.checked = s.stream ?? true;
  tempValue.textContent = tempSlider.value;
  tokensValue.textContent = tokensSlider.value;
  state.messageLoadLimit = s.messageLoadLimit ?? 50;
  state.chatMode = s.chatMode ?? 'chat';
  state.agentMode = s.agentMode ?? false;
  if (messageLoadLimitSlider) messageLoadLimitSlider.value = state.messageLoadLimit;
  if (messageLoadLimitValue) messageLoadLimitValue.textContent = state.messageLoadLimit;

  loadConnection(s);
}

function saveSettings() {
  localStorage.setItem('lmstudio-chat-settings', JSON.stringify({
    systemPrompt: systemPrompt.value,
    temperature: parseFloat(tempSlider.value),
    maxTokens: parseInt(tokensSlider.value),
    stream: streamToggle.checked,
    messageLoadLimit: state.messageLoadLimit,
    chatMode: state.chatMode,
    agentMode: state.agentMode,
  }));
}

// === Connection ===
const CONNECTION_KEY = 'scholar-connection';

// Reads the saved connection, migrating a pre-0.9 install on the way: those
// only knew about LM Studio, so its address moves into the LM Studio slot and
// AnythingLLM is guessed at on port 3001 of the same machine. The guess is
// only made when the old address carried an explicit port — without one the
// address is a `tailscale serve` mapping, where a port would point at nothing.
function loadConnection(legacySettings) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(CONNECTION_KEY)); } catch (e) { /* ignore */ }

  if (saved) {
    state.conn = { ...state.conn, ...saved };
  } else {
    const legacyUrl = localStorage.getItem('lmstudio-server-url') || '';
    const legacyToken = legacySettings?.apiToken || '';
    if (legacyUrl) {
      state.conn.lmsUrl = legacyUrl;
      state.conn.lmsToken = legacyToken;
      state.conn.allmUrl = swapPort(legacyUrl, BACKEND_DEFAULT_PORT[BACKEND.ANYTHINGLLM]);
      // Nothing is known about an AnythingLLM key yet, so an install that was
      // working on LM Studio keeps working on LM Studio rather than landing on
      // a backend it has no credentials for.
      state.conn.backend = BACKEND.LMSTUDIO;
      saveConnection();
    }
  }

  syncLegacyAliases();
  syncConnectionInputs();
}

function saveConnection() {
  localStorage.setItem(CONNECTION_KEY, JSON.stringify(state.conn));
  syncLegacyAliases();
}

// The OpenAI-compatible request paths below (model listing, model metadata,
// chat completions, auto-naming) all read these two, so they track the
// LM Studio half of the connection.
function syncLegacyAliases() {
  state.apiBase = state.conn.lmsUrl;
  state.apiToken = state.conn.lmsToken;
}

function currentBackend() {
  return state.conn.backend;
}

function isAnythingLLM() {
  return currentBackend() === BACKEND.ANYTHINGLLM;
}

// The address of whichever backend is active — what the status line and error
// messages should name.
function activeUrl() {
  return isAnythingLLM() ? state.conn.allmUrl : state.conn.lmsUrl;
}

function activeKey() {
  return isAnythingLLM() ? state.conn.allmKey : state.conn.lmsToken;
}

// Kept for the LM Studio request paths, which were written against it.
function normalizeUrl(raw) {
  return normalizeBase(raw);
}

function authHeaders(extra) {
  const h = { ...(extra || {}) };
  if (state.apiToken) h['Authorization'] = 'Bearer ' + state.apiToken;
  return h;
}

// Brings the connection fields on both the setup screen and the Settings
// sidebar in line with state.conn.
function syncConnectionInputs() {
  const c = state.conn;
  if (setupAllmUrl) setupAllmUrl.value = c.allmUrl;
  if (setupAllmKey) setupAllmKey.value = c.allmKey;
  if (setupUrl) setupUrl.value = c.lmsUrl;
  if (setupToken) setupToken.value = c.lmsToken;
  if (sidebarAllmUrl) sidebarAllmUrl.value = c.allmUrl;
  if (sidebarAllmKey) sidebarAllmKey.value = c.allmKey;
  if (sidebarUrl) sidebarUrl.value = c.lmsUrl;
  if (apiTokenInput) apiTokenInput.value = c.lmsToken;
  syncBackendUI();
}

// Reflects the active backend across the setup screen, the sidebar, and the
// composer, which each show a different slice of the same choice.
function syncBackendUI() {
  const allm = isAnythingLLM();
  document.querySelectorAll('[data-backend-choice]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.backendChoice === currentBackend());
  });
  document.querySelectorAll('[data-backend-pane]').forEach(pane => {
    pane.classList.toggle('hidden', pane.dataset.backendPane !== currentBackend());
  });
  // Agent mode and chat modes are AnythingLLM concepts; LM Studio has neither.
  if (agentToggle) agentToggle.classList.toggle('hidden', !allm);
  if (chatModeWrap) chatModeWrap.classList.toggle('hidden', !allm);
  if (projectPickerBtn) projectPickerBtn.classList.toggle('hidden', !allm);
  if (modelPickerWrap) modelPickerWrap.classList.toggle('hidden', allm);
  syncAgentToggle();
}

async function connect() {
  setStatus('connecting');

  if (isAnythingLLM()) {
    const probe = await AnythingLLM.probe({ url: state.conn.allmUrl, key: state.conn.allmKey });
    if (!probe.ok) {
      state.connected = false;
      setStatus('disconnected');
      Projects.lastError = probe.error;
      Projects.renderList();
      // Retry silently — a laptop that woke up or a Tailscale link that came
      // back should reconnect without the user doing anything.
      setTimeout(connect, 5000);
      return;
    }
    state.connected = true;
    setStatus('connected');
    await Projects.refresh();
    await ensureActiveProject();
    syncProjectPicker();
    updateSendBtn();
    return;
  }

  try {
    const resp = await fetch(state.apiBase + '/v1/models', {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    state.connected = true;

    const models = (data.data || []).slice().sort((a, b) => {
      const wa = modelSortWeight(a.id), wb = modelSortWeight(b.id);
      if (wa !== wb) return wa - wb;
      return prettyModelName(a.id).localeCompare(prettyModelName(b.id));
    });
    state.availableModels = models;
    populateModelDropdown(models);
    await refreshModelMeta();
    refreshModelCaps();
    renderModelPicker();
    syncModelPickerLabel();

    setStatus('connected');
    updateSendBtn();
  } catch (err) {
    setStatus('disconnected');
    state.connected = false;
    state.availableModels = [];
    modelSelect.innerHTML = '<option value="">Offline</option>';
    modelSelect.disabled = true;
    modelPickerBtn.disabled = true;
    modelPickerLabel.textContent = 'Offline';
    state.modelCaps.vision = false;
    // Retry silently
    setTimeout(connect, 5000);
  }
}

// AnythingLLM always chats through *some* workspace, so a chat that isn't in a
// project still needs one. Rather than invent a hidden workspace, the first
// existing workspace is adopted as the default and a "Scholar" one is created
// only when the server has none at all.
async function ensureActiveProject() {
  if (!isAnythingLLM()) return null;
  if (state.activeProjectSlug && Projects.byslug(state.activeProjectSlug)) {
    return state.activeProjectSlug;
  }
  const remembered = localStorage.getItem('scholar-active-project');
  if (remembered && Projects.byslug(remembered)) {
    state.activeProjectSlug = remembered;
    return remembered;
  }
  if (Projects.list.length) {
    state.activeProjectSlug = Projects.list[0].slug;
    return state.activeProjectSlug;
  }
  try {
    const project = await Projects.create('Scholar');
    state.activeProjectSlug = project.slug;
    return project.slug;
  } catch (err) {
    state.activeProjectSlug = null;
    return null;
  }
}

// Connect from the setup screen. Probes the chosen backend and only saves the
// address once it answers, so a typo never becomes the stored setting.
async function tryConnect() {
  const backend = currentBackend();
  const allm = backend === BACKEND.ANYTHINGLLM;

  // A field can hold a value with no 'input' event having fired (autofill, or
  // showSetup() repopulating it), so read the inputs rather than trusting
  // state to already have them.
  if (allm) {
    state.conn.allmUrl = normalizeBase(setupAllmUrl.value);
    state.conn.allmKey = setupAllmKey.value.trim();
  } else {
    state.conn.lmsUrl = normalizeBase(setupUrl.value);
    state.conn.lmsToken = setupToken.value.trim();
  }
  syncLegacyAliases();

  const url = activeUrl();
  if (!url) {
    showSetupError('Enter your Tailscale address');
    return false;
  }

  setupConnect.disabled = true;
  setupConnect.textContent = 'Connecting...';
  setupError.classList.add('hidden');

  try {
    const provider = PROVIDERS[backend];
    const probe = await provider.probe({ url, key: activeKey() });
    if (!probe.ok) {
      showSetupError(probe.error);
      return false;
    }
    saveConnection();
    syncConnectionInputs();
    showChat();
    connect();
    return true;
  } finally {
    setupConnect.disabled = false;
    setupConnect.textContent = 'Connect';
  }
}

function showSetupError(msg) {
  setupError.textContent = msg;
  setupError.classList.remove('hidden');
}

function setStatus(s) {
  statusDot.className = 'status ' + s;
}

// === Views ===
function showChat() {
  setup.classList.add('hidden');
  headerEl.classList.remove('hidden');
  chatContainer.classList.remove('hidden');
  inputArea.classList.remove('hidden');
  chatContainer.classList.toggle('chat-empty', !!welcome && welcome.style.display !== 'none');
  autoGrow(); // size the textarea now that it's visible (avoids a collapsed/cropped field)
  userInput.focus();
}

function showSetup() {
  state.connected = false;
  state.messages = [];
  state.currentSessionId = null;
  state.modelCaps.vision = false;
  clearAttachments();
  closeHistory();
  // Clear only the active backend's address — the other one's settings are
  // still good, and re-entering them to switch back would be busywork.
  if (isAnythingLLM()) state.conn.allmUrl = '';
  else state.conn.lmsUrl = '';
  state.activeProjectSlug = null;
  Projects.list = [];
  Projects.renderList();
  localStorage.removeItem('lmstudio-server-url');
  saveConnection();
  setStatus('disconnected');
  modelSelect.innerHTML = '<option value="">Offline</option>';
  modelSelect.disabled = true;
  modelPickerBtn.disabled = true;
  modelPickerLabel.textContent = 'Offline';
  state.availableModels = [];
  modelPickerList.innerHTML = '';
  messagesEl.innerHTML = '';
  if (welcome) messagesEl.appendChild(welcome);
  showWelcome(true);

  setup.classList.remove('hidden');
  headerEl.classList.add('hidden');
  chatContainer.classList.add('hidden');
  inputArea.classList.add('hidden');
  syncConnectionInputs();
  setupError.classList.add('hidden');
  (isAnythingLLM() ? setupAllmUrl : setupUrl).focus();
}

// === Chat ===
// Nothing to scroll on the welcome screen, so lock #chat-container's
// overflow while it's showing — otherwise a stray touch there triggers an
// elastic rubber-band bounce with no content backing it.
function showWelcome(visible) {
  if (welcome) {
    welcome.style.display = visible ? '' : 'none';
    if (visible) welcome.classList.remove('fade-out');
  }
  chatContainer.classList.toggle('chat-empty', visible);
}

function hideWelcome() {
  showWelcome(false);
}

// Fades the welcome message out the moment the user starts typing, ahead of
// it actually being hidden (display:none) once the message sends. Reverses
// if they clear the draft back to empty.
function updateWelcomeFade() {
  if (!welcome) return;
  welcome.classList.toggle('fade-out', userInput.value.trim().length > 0);
}

function addMessage(role, content, isError) {
  hideWelcome();
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  if (role === 'user') {
    avatar.textContent = 'You';
  } else {
    const faviconImg = document.createElement('img');
    faviconImg.src = 'Scholar_favicon_32.png';
    faviconImg.alt = 'Scholar';
    avatar.appendChild(faviconImg);
  }

  const body = document.createElement('div');
  body.className = 'message-body';

  const bubble = document.createElement('div');
  bubble.className = 'message-content' + (isError ? ' error' : '');

  if (role === 'assistant' && !isError) {
    bubble.innerHTML = renderMessage(content);
  } else {
    bubble.textContent = content;
  }

  body.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  addCopyButtons(bubble);
  if (role === 'assistant' && !isError) {
    addMessageActions(body, () => (typeof content === 'string' ? content : extractText(content)));
  }
  scrollToBottom();
  return bubble;
}

// `index` is this message's position in state.messages — needed so Edit can
// truncate the conversation from the right point and resend. Callers that
// don't have one to give (none currently) can omit it and Edit is skipped.
function addUserMessage(text, attachments, index) {
  hideWelcome();
  const wrap = document.createElement('div');
  wrap.className = 'message user';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = 'You';

  const body = document.createElement('div');
  body.className = 'message-body';

  const bubble = document.createElement('div');
  bubble.className = 'message-content';

  if (attachments && attachments.length) {
    const strip = document.createElement('div');
    strip.className = 'message-attachments';
    attachments.forEach(att => {
      if (att.kind === 'image') {
        const img = document.createElement('img');
        img.src = att.url;
        img.alt = att.name || 'image';
        strip.appendChild(img);
      } else {
        const chip = document.createElement('span');
        chip.className = 'message-file-chip';
        chip.innerHTML = FILE_SVG;
        const name = document.createElement('span');
        name.textContent = att.name || 'file';
        chip.appendChild(name);
        strip.appendChild(chip);
      }
    });
    bubble.appendChild(strip);
  }

  if (text) {
    const t = document.createElement('div');
    t.className = 'message-text';
    t.textContent = text;
    bubble.appendChild(t);
  }

  body.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  addUserMessageActions(body, wrap, bubble, text, attachments || [], index);
  scrollToBottom();
}

// Render a stored message (from a loaded session) back into the chat.
// `index` comes from state.messages.forEach, which passes it automatically.
function renderStoredMessage(msg, index) {
  if (msg.role === 'assistant') {
    addMessage('assistant', typeof msg.content === 'string' ? msg.content : extractText(msg.content));
    return;
  }
  let text = '';
  const attachments = [];
  if (typeof msg.content === 'string') {
    text = msg.content;
  } else if (Array.isArray(msg.content)) {
    msg.content.forEach(part => {
      if (part.type === 'text') text += (text ? '\n' : '') + part.text;
      else if (part.type === 'image_url') attachments.push({ kind: 'image', name: 'image', url: part.image_url?.url });
    });
  }
  addUserMessage(text, attachments, index);
}

// Rebuilds #messages from state.messages, windowed to the most recent
// messageLoadLimit unless the user has already asked to see everything for
// this chat (state.chatFullyLoaded). Rendering every message in a long chat
// — each one a markdown parse + syntax highlight + DOM build — is what makes
// opening it feel heavy; this keeps that cost bounded by default.
function renderCurrentMessages() {
  messagesEl.innerHTML = '';
  if (welcome) messagesEl.appendChild(welcome);
  showWelcome(state.messages.length === 0);

  const total = state.messages.length;
  const limit = state.messageLoadLimit;
  const truncated = !state.chatFullyLoaded && limit > 0 && total > limit;
  const startIdx = truncated ? total - limit : 0;

  if (truncated) messagesEl.appendChild(buildTruncatedBanner(total, limit));
  for (let i = startIdx; i < total; i++) renderStoredMessage(state.messages[i], i);

  updateDataStats();
}

function buildTruncatedBanner(total, limit) {
  const banner = document.createElement('div');
  banner.className = 'truncated-banner';
  const span = document.createElement('span');
  span.textContent = `Showing last ${limit} of ${total} messages`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-sm';
  btn.textContent = 'Load full chat';
  btn.addEventListener('click', loadFullChat);
  banner.appendChild(span);
  banner.appendChild(btn);
  return banner;
}

function loadFullChat() {
  state.chatFullyLoaded = true;
  renderCurrentMessages();
  scrollToBottom(true);
}

// Drops every image attachment from the currently open chat's stored
// messages (text and files are untouched) and re-renders. This is the big
// lever for chats that got heavy from image uploads — those data URLs live
// entirely in localStorage/memory, not on a server.
function stripImagesFromCurrentChat() {
  if (!state.messages.length) return 0;
  let removed = 0;
  state.messages.forEach(m => {
    if (!Array.isArray(m.content)) return;
    const before = m.content.length;
    m.content = m.content.filter(p => p.type !== 'image_url');
    removed += before - m.content.length;
    // Collapse back to a plain string once there's nothing left to justify
    // the array form — matches how a text-only message is normally stored.
    if (m.content.length === 1 && m.content[0].type === 'text') m.content = m.content[0].text;
    else if (m.content.length === 0) m.content = '';
  });
  if (removed > 0) {
    saveCurrentSession();
    renderCurrentMessages();
  }
  return removed;
}

function clearAllChats() {
  if (!state.sessions.length) return;
  if (!confirm(`Delete all ${state.sessions.length} saved chat${state.sessions.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
  state.sessions = [];
  persistSessions();
  newChat();
}

function estimateBytes(obj) {
  const json = JSON.stringify(obj) || '';
  try { return new Blob([json]).size; } catch (e) { return json.length; }
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

// Populates the "Data & Storage" readout in Settings: this chat's message/
// image count and size, plus the total across every saved chat in this
// browser. Called whenever messages or sessions change.
function updateDataStats() {
  if (!dataStatsText) return;
  const msgCount = state.messages.length;
  let imgCount = 0;
  state.messages.forEach(m => {
    if (Array.isArray(m.content)) imgCount += m.content.filter(p => p.type === 'image_url').length;
  });
  const chatBytes = estimateBytes(state.messages);
  const totalBytes = estimateBytes(state.sessions);

  if (msgCount === 0) {
    dataStatsText.textContent = `${state.sessions.length} saved chat${state.sessions.length === 1 ? '' : 's'} · ~${formatBytes(totalBytes)} in this browser`;
    return;
  }
  const imgPart = imgCount ? `, ${imgCount} image${imgCount === 1 ? '' : 's'}` : '';
  dataStatsText.innerHTML =
    `This chat: ${msgCount} message${msgCount === 1 ? '' : 's'}${imgPart} · ~${formatBytes(chatBytes)}<br>` +
    `All chats: ${state.sessions.length} saved · ~${formatBytes(totalBytes)} in this browser`;
}

function addModelDivider(text) {
  hideWelcome();
  const divider = document.createElement('div');
  divider.className = 'model-divider';
  const label = document.createElement('span');
  label.textContent = text;
  divider.appendChild(label);
  messagesEl.appendChild(divider);
  scrollToBottom();
}

function onModelChange() {
  const selected = modelSelect.value;
  syncModelPickerLabel();
  if (!selected || selected === state.currentModel) return;
  state.currentModel = selected;
  addModelDivider(`${prettyModelName(selected)} loaded`);
  refreshModelCaps();
  saveCurrentSession();
}

// Best-effort "pretty" display name for a model dropdown entry, e.g.
// "mistralai/mistral-small-3.2" -> "Mistral Small 3.2 24B". Parsed from the
// slug alone — there's no API that returns a canonical display name, so this
// is a heuristic and won't be right for every model. The raw id is always
// what's actually sent to LM Studio; this only changes what's displayed.

// Parameter-count overrides for well-known families whose slug doesn't
// include a size token at all (e.g. "mistral-small-3.2" has no "24b" in it).
// Checked in order — more specific patterns first.
const MODEL_SIZE_OVERRIDES = [
  [/mistral-small-3(\.\d+)?\b/i, '24B'],
  [/mistral-small(?!-3)\b/i, '22B'],
  [/^codestral(?!.*\d+b)/i, '22B'],
  [/command-r-plus/i, '104B'],
  [/command-r(?!-plus)/i, '35B'],
  [/deepseek-v3(?!.*\d+b)/i, '671B'],
  [/deepseek-r1(?!-distill)(?!.*\d+b)/i, '671B'],
];

// Individual slug tokens that should render as a specific display form
// instead of naive Title Case.
const MODEL_WORD_OVERRIDES = {
  deepseek: 'DeepSeek', glm: 'GLM', gpt: 'GPT', qwq: 'QwQ', minicpm: 'MiniCPM',
  internlm: 'InternLM', smollm: 'SmolLM', wizardlm: 'WizardLM', llm: 'LLM',
  it: 'Instruct', vl: 'VL', moe: 'MoE',
};

// Slug tokens that carry no useful display information (quantization/format tags).
const MODEL_NOISE_RE = /^(gguf|mlx|ggml|awq|gptq|exl2?|hf|safetensors|fp16|fp32|bf16|int4|int8|w4a16|w8a16|q\d(_[a-z0-9]+)*)$/i;

function prettyModelName(id) {
  if (!id) return id;
  const slug = id.includes('/') ? id.slice(id.indexOf('/') + 1) : id;
  const tokens = slug.split(/[-_]/).filter(Boolean);

  // Keep the size token in its natural position (e.g. "32B" before "Instruct")
  // when the slug has one; only append at the end for override-derived sizes,
  // which have no natural position since the slug never mentions a size at all.
  const words = [];
  let foundSizeInSlug = false;
  for (const t of tokens) {
    if (MODEL_NOISE_RE.test(t) || /^\d{4,}$/.test(t)) continue;
    if (/^(\d+x)?\d+(\.\d+)?b$/i.test(t)) {
      foundSizeInSlug = true;
      words.push(t.replace(/b$/i, 'B')); // uppercase only the trailing B, e.g. keep "8x7B" not "8X7B"
      continue;
    }
    const lower = t.toLowerCase();
    words.push(MODEL_WORD_OVERRIDES[lower] || (t.charAt(0).toUpperCase() + t.slice(1)));
  }

  if (!foundSizeInSlug) {
    const override = MODEL_SIZE_OVERRIDES.find(([re]) => re.test(slug));
    if (override) words.push(override[1]);
  }

  const pretty = words.join(' ').replace(/\s+/g, ' ').trim();
  return pretty || id;
}

// Guess vision support from the model name — used as a fallback when LM Studio's
// richer /api/v0 endpoint isn't available.
function nameSuggestsVision(modelId) {
  const id = (modelId || '').toLowerCase();
  const patterns = [
    'vl', 'vlm', 'vision', 'llava', 'bakllava', 'pixtral', 'moondream',
    'minicpm-v', 'internvl', 'smolvlm', 'cogvlm', 'glm-4v', 'yi-vl',
    'deepseek-vl', 'janus', 'molmo', 'aria', 'ovis', 'idefics', 'fuyu',
    'gemma-3', 'gemma3', 'llama-3.2-11b', 'llama-3.2-90b', 'llama4', 'llama-4',
    'phi-3-vision', 'phi-3.5-vision', 'phi-4-multimodal', 'mistral-small-3.1',
    'kimi-vl', 'qwen2-vl', 'qwen2.5-vl', 'qwen3-vl'
  ];
  return patterns.some(p => id.includes(p));
}

function activeModelId() {
  return modelSelect.value || '';
}

function titleCaseSlug(slug) {
  return String(slug).split(/[-_]/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// (Re)build the model dropdown from the models LM Studio reports, preserving
// the current selection where possible so a reconnect doesn't silently switch
// the active model. If no previous selection exists, try to default to Gemma.
function populateModelDropdown(lmModels) {
  const prevValue = modelSelect.value;

  modelSelect.innerHTML = '';
  modelSelect.disabled = false;
  modelPickerBtn.disabled = false;

  if (lmModels.length === 0) {
    modelSelect.innerHTML = '<option value="">No models loaded</option>';
    modelPickerBtn.disabled = true;
    modelPickerLabel.textContent = 'No models loaded';
    return;
  }

  lmModels.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = prettyModelName(m.id);
    opt.title = m.id;
    modelSelect.appendChild(opt);
  });

  if ([...modelSelect.options].some(o => o.value === prevValue)) {
    modelSelect.value = prevValue;
  } else {
    // No previous selection; try to default to Gemma if available
    const gemmaModel = lmModels.find(m => m.id.toLowerCase().includes('gemma'));
    if (gemmaModel) {
      modelSelect.value = gemmaModel.id;
    }
  }
  state.currentModel = modelSelect.value || null;
}

// Fetch type/publisher/quantization/context info for every downloaded model
// in one shot, via LM Studio's native API. Powers capability detection,
// routing, and the informative model picker.
async function refreshModelMeta() {
  try {
    const resp = await fetch(state.apiBase + '/api/v0/models', { headers: authHeaders(), signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      const data = await resp.json();
      const meta = {};
      (data.data || []).forEach(m => {
        meta[m.id] = {
          type: (m.type || '').toLowerCase(),
          publisher: m.publisher || '',
          quantization: m.quantization || '',
          maxContextLength: m.max_context_length || null,
          state: m.state || '',
        };
      });
      state.modelMeta = meta;
    }
  } catch (e) { /* endpoint unavailable — routing/caps fall back to name heuristics */ }
}

function modelType(id) {
  return state.modelMeta[id]?.type || (nameSuggestsVision(id) ? 'vlm' : '');
}

// Pull a parameter count (in billions) out of a model id/slug, e.g.
// "qwen2.5-7b-instruct" -> 7, "mixtral-8x7b" -> 56. Falls back to the same
// family overrides prettyModelName uses for slugs with no size token at all.
function modelSizeBillions(id) {
  if (!id) return null;
  const slug = id.includes('/') ? id.slice(id.indexOf('/') + 1) : id;
  for (const t of slug.split(/[-_]/).filter(Boolean)) {
    const m = /^(?:(\d+)x)?(\d+(?:\.\d+)?)b$/i.exec(t);
    if (m) return (m[1] ? parseInt(m[1], 10) : 1) * parseFloat(m[2]);
  }
  const override = MODEL_SIZE_OVERRIDES.find(([re]) => re.test(slug));
  const m = override && /(\d+(?:\.\d+)?)B/i.exec(override[1]);
  return m ? parseFloat(m[1]) : null;
}

// Sort key for the model list/picker (smallest to largest). Falls back to
// qualitative size branding (e.g. "nano"/"super"/"ultra") when no parameter
// count can be parsed, and to the very end for names with no size signal at
// all — those sort alphabetically among themselves.
function modelSortWeight(id) {
  const b = modelSizeBillions(id);
  if (b != null) return b;
  const slug = (id || '').toLowerCase();
  if (/\b(nano|mini|tiny)\b/.test(slug)) return 3;
  if (/\bsmall\b/.test(slug)) return 8;
  if (/\b(medium|mid)\b/.test(slug)) return 20;
  if (/\b(super|large|xl)\b/.test(slug)) return 60;
  if (/\b(ultra|xxl)\b/.test(slug)) return 200;
  return Infinity;
}

// A model's actual purpose (reasoning-tuned, code-tuned, etc.) is a far
// better signal than its raw parameter count — checked first, before falling
// back to a size-based guess. Order matters: most specific families first.
const MODEL_SPECIALTY_HINTS = [
  [/nemotron/i, 'Reasoning & agentic — built for tool use and long multi-step tasks'],
  [/deepseek-r1|magistral|\bqwq\b|reasoner|-think(?:ing)?\b/i, 'Deep reasoning — thinks step-by-step, slower but more thorough'],
  [/coder?|codestral|starcoder|codegemma/i, 'Code-focused — best for programming tasks'],
  [/\bembed(?:ding)?\b/i, 'Embedding model — for search/retrieval, not chat'],
];

// Qualitative size branding (e.g. NVIDIA's Nemotron Nano/Super/Ultra tiers)
// used only when no numeric parameter count can be parsed from the name.
const MODEL_TIER_HINTS = [
  [/\b(ultra|xxl)\b/i, 'Most capable — for your toughest challenges'],
  [/\b(super|large|\bxl\b)\b/i, 'Strong reasoning — for complex tasks'],
  [/\b(medium|mid)\b/i, 'Balanced — good for everyday tasks'],
  [/\b(nano|mini|tiny|small)\b/i, 'Fastest — great for quick answers'],
];

// A short, honest "what's this for" line, in the spirit of Claude's model
// picker — derived from the model's stated purpose or parameter count, since
// local models don't come with an official tier of their own.
function modelTaskBlurb(id) {
  const slug = (id || '').toLowerCase();

  const specialty = MODEL_SPECIALTY_HINTS.find(([re]) => re.test(slug));
  if (specialty) return specialty[1];

  const b = modelSizeBillions(id);
  if (b != null) {
    if (b < 4) return 'Fastest — great for quick answers';
    if (b < 15) return 'Balanced — good for everyday tasks';
    if (b < 35) return 'Strong reasoning — for complex tasks';
    return 'Most capable — for your toughest challenges';
  }

  const tier = MODEL_TIER_HINTS.find(([re]) => re.test(slug));
  if (tier) return tier[1];

  return 'General purpose';
}

function formatContextLength(n) {
  if (!n) return null;
  if (n >= 1000000) return (n % 1000000 === 0 ? n / 1000000 : (n / 1000000).toFixed(1)) + 'M context';
  if (n >= 1000) return Math.round(n / 1000) + 'K context';
  return n + ' context';
}

function syncModelPickerLabel() {
  if (!modelPickerLabel) return;
  const id = modelSelect.value;
  modelPickerLabel.textContent = id ? prettyModelName(id) : (modelSelect.options[0]?.textContent || 'No models');
}

function selectModelFromPicker(id) {
  if (modelSelect.value === id) { closeModelPicker(); return; }
  modelSelect.value = id;
  modelSelect.dispatchEvent(new Event('change'));
  syncModelPickerLabel();
  closeModelPicker();
}

function openModelPicker() {
  if (modelPickerBtn.disabled) return;
  renderModelPicker();
  modelModal.classList.remove('hidden');
}

function closeModelPicker() {
  modelModal.classList.add('hidden');
}

// Builds the informative model-picker list from state.availableModels +
// whatever richer metadata refreshModelMeta was able to fetch.
function renderModelPicker() {
  if (!modelPickerList) return;
  const models = state.availableModels;

  if (!models.length) {
    modelPickerList.innerHTML = '<p class="model-picker-empty">No models loaded in LM Studio.</p>';
    return;
  }

  const selected = modelSelect.value;
  modelPickerList.innerHTML = models.map(m => {
    const meta = state.modelMeta[m.id] || {};
    const vision = modelType(m.id) === 'vlm';
    const tags = [];
    if (vision) tags.push('Vision');
    const ctx = formatContextLength(meta.maxContextLength);
    if (ctx) tags.push(ctx);
    if (meta.quantization) tags.push(meta.quantization);
    if (meta.state === 'loaded') tags.push('Loaded');

    const isSelected = m.id === selected;
    return `<button type="button" class="model-picker-item${isSelected ? ' selected' : ''}" data-model-id="${escapeHtml(m.id)}" title="${escapeHtml(m.id)}">
      <div class="model-picker-item-main">
        <div class="model-picker-name">${escapeHtml(prettyModelName(m.id))}</div>
        <div class="model-picker-blurb">${escapeHtml(modelTaskBlurb(m.id))}</div>
        ${tags.length ? `<div class="model-picker-meta">${tags.map(t => `<span class="model-picker-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
      ${isSelected ? '<span class="model-picker-check"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>' : ''}
    </button>`;
  }).join('');

  modelPickerList.querySelectorAll('.model-picker-item').forEach(btn => {
    btn.addEventListener('click', () => selectModelFromPicker(btn.dataset.modelId));
  });
}

// Detect capabilities of the active model.
function refreshModelCaps() {
  const vision = modelType(activeModelId()) === 'vlm';

  state.modelCaps.vision = vision;

  // Drop any pending image attachments if the new model can't see them
  if (!vision && state.attachments.some(a => a.kind === 'image')) {
    state.attachments = state.attachments.filter(a => a.kind !== 'image');
    renderAttachments();
    updateSendBtn();
  }
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatVersionDate(iso) {
  // Accepts either a bare date ('2026-07-31') or a full timestamp
  // ('2026-07-31T22:22:41Z'); only the latter gets a time appended.
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  const d = new Date(hasTime ? iso : iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (!hasTime) return dateStr;
  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
}

function changelogEntryHTML(entry) {
  const notes = entry.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('');
  return `<div class="version-block">
    <div class="version-header">${escapeHtml(entry.version)} <span class="version-date">· ${escapeHtml(formatVersionDate(entry.date))}</span></div>
    <ul class="version-list">${notes}</ul>
  </div>`;
}

function renderChangelog() {
  if (versionListRecent) {
    versionListRecent.innerHTML = CHANGELOG.slice(0, 3)
      .map((entry, i) => (i > 0 ? '<hr class="version-sep">' : '') + changelogEntryHTML(entry))
      .join('');
  }
  if (changelogModalList) {
    changelogModalList.innerHTML = CHANGELOG.slice(0, 10)
      .map((entry, i) => (i > 0 ? '<hr class="version-sep">' : '') + changelogEntryHTML(entry))
      .join('');
  }
}

function openChangelogModal() {
  versionDropdown.classList.add('hidden');
  changelogModal.classList.remove('hidden');
}

function closeChangelogModal() {
  changelogModal.classList.add('hidden');
}

function modelLoadingHTML(modelId) {
  return `<div class="model-loading">
    <div class="model-loading-label">Loading <strong>${escapeHtml(prettyModelName(modelId))}</strong>…</div>
    <div class="model-loading-bar"><div class="model-loading-fill"></div></div>
  </div>`;
}

// Scholar has no real math renderer (no KaTeX/MathJax), so raw LaTeX that
// models emit — Gemma especially likes wrapping arrows/operators in $…$ —
// shows up completely literally, e.g. "$\rightarrow$" instead of "→". Swap
// the common no-argument symbol commands for their Unicode characters and
// drop the math delimiters, so at least simple inline math reads cleanly.
// This is a text substitution, not a real parser — full expressions
// (fractions, matrices, integrals with bounds, etc.) are out of scope.
const LATEX_SYMBOLS = {
  rightarrow: '→', to: '→', longrightarrow: '⟶', implies: '⟹', Rightarrow: '⇒',
  leftarrow: '←', gets: '←', longleftarrow: '⟵', Leftarrow: '⇐',
  leftrightarrow: '↔', longleftrightarrow: '⟷', Leftrightarrow: '⇔', iff: '⟺',
  uparrow: '↑', downarrow: '↓', mapsto: '↦',
  times: '×', div: '÷', pm: '±', mp: '∓', cdot: '⋅', ast: '∗', star: '★',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈',
  equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', ll: '≪', gg: '≫',
  infty: '∞', partial: '∂', nabla: '∇', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ',
  forall: '∀', exists: '∃', nexists: '∄', emptyset: '∅', varnothing: '∅',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃',
  supseteq: '⊇', cup: '∪', cap: '∩', setminus: '∖', wedge: '∧', vee: '∨',
  neg: '¬', oplus: '⊕', otimes: '⊗', perp: '⊥', parallel: '∥', angle: '∠',
  triangle: '△', square: '□', circ: '∘', bullet: '•', degree: '°',
  therefore: '∴', because: '∵', sum: '∑', prod: '∏', int: '∫', oint: '∮',
  ldots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱', dagger: '†', ddagger: '‡',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'φ',
  varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ',
  Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν',
  Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ',
  Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
};
// Every quantifier below is bounded. The unbounded `[\s\S]*?` these rules
// used to use is fine on well-formed input and quadratic on the input this
// actually sees: an unclosed "$$" or "\(" mid-stream makes the engine scan to
// the end of the reply, fail, and retry from the next position, for every
// position. Capping the span keeps the work linear in the reply length, and
// costs only the ability to span a math expression longer than the cap —
// which this substitution can't render meaningfully anyway.
const LATEX_SPAN = 400;
const LATEX_SYMBOL_RE = /\\([A-Za-z]+)/g;
const substituteLatexSymbols = (s) => s
  .replace(/\\text\{([^{}]*)\}/g, '$1')
  .replace(/\\(?:mathbf|mathrm|mathit|mathcal|operatorname)\{([^{}]*)\}/g, '$1')
  .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
  .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
  .replace(LATEX_SYMBOL_RE, (m, cmd) => LATEX_SYMBOLS[cmd] || m)
  .replace(/\\,|\\;|\\ /g, ' ');

const RE_LATEX_PAREN  = new RegExp(String.raw`\\\(([\s\S]{0,${LATEX_SPAN}}?)\\\)`, 'g');
const RE_LATEX_SQUARE = new RegExp(String.raw`\\\[([\s\S]{0,${LATEX_SPAN}}?)\\\]`, 'g');
const RE_LATEX_DOLLAR = new RegExp(String.raw`\$\$([\s\S]{0,${LATEX_SPAN}}?)\$\$`, 'g');
const RE_LATEX_INLINE = new RegExp(String.raw`\$([^\n$]{0,${LATEX_SPAN}}?\\[A-Za-z]+[^\n$]{0,${LATEX_SPAN}}?)\$`, 'g');

// Runs the substitution above, plus drops now-redundant math delimiters
// (\(...\), \[...\], $$...$$, and $...$ when it contains a LaTeX command —
// bare "$" for currency is left alone). Skips fenced code blocks entirely so
// shell/JS/etc. snippets with literal "$" or backslash escapes are untouched.
function convertLatexSymbols(text) {
  // Splitting on the fence marker itself (rather than on a lazy ```…```
  // pair) means an unterminated fence can't blow up the split either: the
  // odd/even alternation still identifies which halves are code.
  const parts = text.split('```');
  return parts.map((part, i) => {
    if (i % 2 === 1) return part; // inside a fence — leave verbatim
    part = part
      .replace(RE_LATEX_PAREN,  (_, inner) => substituteLatexSymbols(inner))
      .replace(RE_LATEX_SQUARE, (_, inner) => substituteLatexSymbols(inner))
      .replace(RE_LATEX_DOLLAR, (_, inner) => substituteLatexSymbols(inner))
      .replace(RE_LATEX_INLINE, (_, inner) => substituteLatexSymbols(inner));
    // Catch-all: LaTeX commands emitted bare, with no $ / \( \) wrapping at
    // all (Gemma does this too). Backslash-prefixed commands are unambiguous
    // — never mistaken for currency — so this is safe outside delimiters too.
    return substituteLatexSymbols(part);
  }).join('```');
}

function renderMarkdown(text) {
  return ScholarMD.render(convertLatexSymbols(text));
}

// Strips special chat-template tokens (e.g. gpt-oss/Harmony-style
// "<|channel|>", "<|message|>") that some models leak into plain text. Used
// for cleaning up auto-generated chat titles, where a stray token would
// otherwise show up in the sidebar.
const SPECIAL_TOKEN_RE = /<\|?(?:channel|message|start|end|return|im_start|im_end|endoftext|eot_id|assistant|system|developer)\|?>/gi;
const stripSpecialTokens = (s) => s.replace(SPECIAL_TOKEN_RE, '');

// Messages render exactly as the model sent them.
function renderMessage(text) {
  return renderMarkdown(text);
}

// === Project picker / agent mode / chat mode ===
// On AnythingLLM the thing you pick before typing is a project, not a model —
// the workspace decides which model runs and which documents are in scope. So
// the composer swaps the model picker for a project picker, keeping the same
// control in the same place.

function activeProjectName() {
  const project = Projects.byslug(state.activeProjectSlug);
  return project ? project.name : 'No project';
}

function syncProjectPicker() {
  if (!projectPickerBtn || !projectPickerLabel) return;
  projectPickerBtn.disabled = !state.connected;
  projectPickerLabel.textContent = state.connected ? activeProjectName() : 'Offline';
  Projects.renderList();
}

function openProjectPicker() {
  if (!state.connected) return;
  renderProjectPicker();
  projectModal.classList.remove('hidden');
}

function closeProjectPicker() {
  projectModal.classList.add('hidden');
}

function renderProjectPicker() {
  projectPickerList.innerHTML = '';

  Projects.list.forEach(project => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'model-picker-item' + (project.slug === state.activeProjectSlug ? ' selected' : '');

    const name = document.createElement('div');
    name.className = 'model-picker-name';
    name.textContent = project.name;

    const meta = document.createElement('div');
    meta.className = 'model-picker-meta';
    const chats = state.sessions.filter(s => s.projectSlug === project.slug).length;
    const docs = Projects.docCache[project.slug]?.length;
    const bits = [];
    if (docs != null) bits.push(`${docs} document${docs === 1 ? '' : 's'}`);
    bits.push(`${chats} chat${chats === 1 ? '' : 's'}`);
    if (project.instructions) bits.push('custom instructions');
    meta.textContent = bits.join(' · ');

    row.append(name, meta);
    row.addEventListener('click', () => {
      selectProject(project.slug);
      closeProjectPicker();
    });
    projectPickerList.appendChild(row);
  });

  const create = document.createElement('button');
  create.type = 'button';
  create.className = 'model-picker-item model-picker-action';
  create.innerHTML = '<div class="model-picker-name">+ New project…</div>' +
    '<div class="model-picker-meta">A workspace with its own documents and instructions</div>';
  create.addEventListener('click', () => {
    closeProjectPicker();
    Projects.promptCreate();
  });
  projectPickerList.appendChild(create);
}

// Switching project mid-chat would leave the chat's thread pointing at a
// different workspace, so it only takes effect for chats that haven't started.
function selectProject(slug) {
  state.activeProjectSlug = slug;
  localStorage.setItem('scholar-active-project', slug || '');
  const session = state.sessions.find(s => s.id === state.currentSessionId);
  if (!session || !session.messages?.length) {
    if (session) { session.projectSlug = slug; session.threadSlug = null; persistSessions(); }
  }
  syncProjectPicker();
  renderHistoryList();
}

function syncAgentToggle() {
  if (!agentToggle) return;
  agentToggle.classList.toggle('active', state.agentMode);
  agentToggle.setAttribute('aria-pressed', String(state.agentMode));
  agentToggle.title = state.agentMode
    ? 'Agent mode on — Scholar can search and read the web before answering'
    : 'Agent mode off — click to let Scholar browse the web';
  if (chatModeLabel) {
    const mode = CHAT_MODES.find(m => m.id === state.chatMode);
    chatModeLabel.textContent = mode ? mode.label : 'Chat';
  }
}

function toggleAgentMode() {
  state.agentMode = !state.agentMode;
  saveSettings();
  syncAgentToggle();
}

function openChatModeMenu() {
  chatModeMenu.innerHTML = '';
  CHAT_MODES.forEach(mode => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'chat-mode-item' + (mode.id === state.chatMode ? ' selected' : '');
    item.innerHTML = `<span class="chat-mode-item-name">${escapeHtml(mode.label)}</span>` +
      `<span class="chat-mode-item-hint">${escapeHtml(mode.hint)}</span>`;
    item.addEventListener('click', () => {
      state.chatMode = mode.id;
      saveSettings();
      syncAgentToggle();
      chatModeMenu.classList.add('hidden');
    });
    chatModeMenu.appendChild(item);
  });
  chatModeMenu.classList.remove('hidden');
}

// === Syntax highlighting (dependency-free) ===
const HL_KEYWORDS = {
  js: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof in of try catch finally throw async await yield import export from default null undefined true false void delete static get set',
  py: 'def return if elif else for while in not and or is None True False class import from as with try except finally raise lambda pass break continue global nonlocal yield async await assert del print self',
  css: '',
  html: '',
  json: 'true false null',
  sh: 'if then else elif fi for while do done case esac function echo exit return local export set read cd source',
  sql: 'select from where insert into values update set delete create table drop alter join left right inner outer on as order by group having limit offset and or not null primary key',
};
const HL_ALIASES = { javascript: 'js', typescript: 'js', jsx: 'js', tsx: 'js', ts: 'js', node: 'js', python: 'py', bash: 'sh', shell: 'sh', zsh: 'sh', xml: 'html', htm: 'html' };

function microHighlight(code, lang) {
  lang = HL_ALIASES[lang] || lang;
  const kw = new Set((HL_KEYWORDS[lang] || HL_KEYWORDS.js).split(' '));
  let out = '';
  // comments | strings | numbers | words — tokenize the raw code, escape as we emit
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|<!--[\s\S]*?-->)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1] !== undefined) {
      // '#' comments only apply to shell/python-ish; leave as plain elsewhere
      const isHash = m[1][0] === '#';
      const hashOk = lang === 'py' || lang === 'sh' || lang === 'yaml';
      out += (isHash && !hashOk) ? escapeHtml(m[1]) : `<span class="hl-com">${escapeHtml(m[1])}</span>`;
    } else if (m[2] !== undefined) out += `<span class="hl-str">${escapeHtml(m[2])}</span>`;
    else if (m[3] !== undefined) out += `<span class="hl-num">${escapeHtml(m[3])}</span>`;
    else if (m[4] !== undefined) out += kw.has(m[4]) ? `<span class="hl-kw">${escapeHtml(m[4])}</span>` : escapeHtml(m[4]);
    else out += escapeHtml(m[5]);
  }
  // html: tint tags after the fact (tokens above already escaped)
  if (lang === 'html') {
    out = out.replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="hl-kw">$2</span>');
  }
  return out;
}

function codeLang(codeEl) {
  const cls = codeEl.className || '';
  const m = cls.match(/language-([\w-]+)/);
  if (m) return m[1].toLowerCase();
  const t = codeEl.textContent.trimStart();
  if (/^<!doctype|^<html|^</i.test(t)) return 'html';
  return '';
}

const looksLikeHtmlDoc = (t) => /^\s*(<!doctype html|<html)/i.test(t) || (/<\w+[^>]*>/.test(t) && /<\/(div|body|button|p|span|h\d|style|script)>/i.test(t));

// `streaming` skips syntax highlighting. Highlighting a block that is still
// growing means re-tokenizing all of it every time it changes; the finished
// block gets highlighted exactly once instead, by the final pass. Code still
// reads as monospaced, selectable, copyable text in the meantime.
function addCopyButtons(el, streaming) {
  el.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');

    if (code && !streaming && !code.dataset.hl) {
      const lang = codeLang(code);
      code.innerHTML = microHighlight(code.textContent, lang || 'js');
      code.dataset.hl = '1';
    }

    // HTML preview button (artifacts-lite)
    if (code && !pre.querySelector('.preview-btn')) {
      const lang = codeLang(code);
      if (lang === 'html' || looksLikeHtmlDoc(code.textContent)) {
        const pv = document.createElement('button');
        pv.className = 'preview-btn';
        pv.textContent = 'Preview';
        pv.addEventListener('click', () => openPreview(code.textContent));
        pre.appendChild(pv);
      }
    }

    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    });
    pre.appendChild(btn);
  });
}

// === Streaming renderer ===
//
// Renders a reply as it arrives without re-doing work already done.
//
// The old approach re-rendered the whole message on every update: parse all
// the markdown accumulated so far, throw away the entire DOM subtree, rebuild
// it. Each tick was proportional to the length of the reply, and there is one
// tick per chunk, so a reply of length N cost N² — which no amount of
// throttling fixes, it only spreads the same total work over fewer frames.
//
// Instead, the reply is split at block boundaries. Everything before the last
// boundary is *settled*: it cannot change no matter what arrives next, so it
// is parsed once, appended to the DOM, and never touched again. Only the text
// after that boundary — the block still being written, normally a paragraph
// or two — is re-rendered per frame. Total work is proportional to N.
//
// A boundary is a blank line that is not inside a fenced code block. Blank
// lines separate blocks in markdown, so committing at one is safe; the fence
// check is what stops a blank line *inside* a code block from splitting it.
class StreamRenderer {
  constructor(bubble) {
    this.bubble = bubble;
    this.raw = '';
    this.committedUpto = 0;   // index in `raw`; everything before is settled
    this.frame = 0;

    // Boundary scanning is resumable: `scanPos` is how far into `raw` we have
    // already looked and `inFence` is the fence state at that point, so each
    // frame examines only the text that arrived since the last one. Rescanning
    // the whole uncommitted region every frame would reintroduce the quadratic
    // behaviour this class exists to remove — just in the scan instead of the
    // parse — whenever a model emits a long run with no blank line in it.
    this.scanPos = 0;
    this.inFence = false;
    this.lastBoundary = -1;

    bubble.innerHTML = '';
    this.settledEl = document.createElement('div');
    this.tailEl = document.createElement('div');
    bubble.appendChild(this.settledEl);
    bubble.appendChild(this.tailEl);
  }

  // Advances the scan over any newly-arrived complete lines, recording the
  // last blank line that sits outside a fenced code block. Returns the index
  // just past it, or -1 if no such boundary has been seen yet.
  _boundary() {
    while (this.scanPos < this.raw.length) {
      const nl = this.raw.indexOf('\n', this.scanPos);
      if (nl === -1) break;                     // trailing partial line
      const line = this.raw.slice(this.scanPos, nl);
      if (/^\s*(?:`{3,}|~{3,})/.test(line)) this.inFence = !this.inFence;
      else if (line.trim() === '' && !this.inFence) this.lastBoundary = this.scanPos + 1;
      this.scanPos = nl + 1;
    }
    return this.lastBoundary;
  }

  // Beyond this, the unsettled tail stops being re-parsed as markdown and
  // renders as plain text until it settles. Only reachable when a model emits
  // a very long run with no blank line in it, where per-frame markdown of the
  // growing tail would start to cost real time.
  static get MAX_LIVE_TAIL() { return 8000; }

  push(text) {
    if (!text) return;
    this.raw += text;
    this._schedule();
  }

  // At most one DOM update per animation frame, no matter the chunk rate.
  _schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this._paint();
    });
  }

  _paint() {
    const boundary = this._boundary();
    if (boundary > this.committedUpto) {
      const chunk = this.raw.slice(this.committedUpto, boundary);
      const html = renderMessage(chunk);
      // Parse into a fragment, decorate just those nodes, then append. Calling
      // addCopyButtons on the whole settled container instead would re-walk
      // every block already in it on every commit — cheap per block, but once
      // per commit across a growing container, which is the same quadratic
      // shape in miniature.
      const frag = document.createElement('div');
      frag.innerHTML = html;
      addCopyButtons(frag, true);
      while (frag.firstChild) this.settledEl.appendChild(frag.firstChild);
      this.committedUpto = boundary;
    }

    const tail = this.raw.slice(this.committedUpto);
    if (tail.length > StreamRenderer.MAX_LIVE_TAIL) {
      this.tailEl.textContent = tail;
    } else if (tail) {
      this.tailEl.innerHTML = renderMessage(tail);
      addCopyButtons(this.tailEl, true);
    } else {
      this.tailEl.innerHTML = '';
    }

    scrollToBottom();
  }

  // Final, authoritative render. Re-parses the whole reply in one pass so that
  // anything spanning a commit boundary (a list broken by a blank line, say)
  // comes out as one construct, then highlights code once.
  finish() {
    if (this.frame) { cancelAnimationFrame(this.frame); this.frame = 0; }
    this.bubble.innerHTML = renderMessage(this.raw);
    addCopyButtons(this.bubble);
    scrollToBottom();
  }

  // Replaces everything with a one-off message (used for an aborted stream
  // that produced no text).
  replaceWith(html) {
    if (this.frame) { cancelAnimationFrame(this.frame); this.frame = 0; }
    this.bubble.innerHTML = html;
  }
}

// Tokens + speed line under a response. Uses server-reported usage when
// available; otherwise estimates from streamed delta count (marked with ~).
function appendStats(body, { tStart, firstTokenAt, deltaCount, usage }) {
  const tokens = usage?.completion_tokens ?? deltaCount;
  if (!tokens || tokens <= 0) return;
  const exact = usage?.completion_tokens != null;
  const elapsed = (performance.now() - (firstTokenAt || tStart)) / 1000;
  const speed = tokens / Math.max(elapsed, 0.001);
  const el = document.createElement('div');
  el.className = 'msg-stats';
  el.textContent = `${exact ? '' : '~'}${tokens} tokens · ${speed.toFixed(1)} tok/s`;
  body.appendChild(el);
}

function scrollToBottom(force) {
  if (force) state.stickToBottom = true;
  if (state.stickToBottom) chatContainer.scrollTop = chatContainer.scrollHeight;
}

function onChatScroll() {
  const gap = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
  state.stickToBottom = gap < 80;
  scrollPill.classList.toggle('hidden', state.stickToBottom);
}

async function sendMessage() {
  const text = userInput.value.trim();
  const attachments = state.attachments;
  if ((!text && attachments.length === 0) || !state.connected || state.streaming) return;

  // Large combined attachments make prompt processing take minutes on local
  // models — warn before sending so a "hang" isn't a surprise.
  const inlinedBytes = attachments.filter(a => a.kind === 'file').reduce((n, a) => n + (a.text?.length || 0), 0);
  if (inlinedBytes > 60000) {
    const kb = Math.round(inlinedBytes / 1024);
    if (!confirm(`You're sending ~${kb} KB of file text. Local models can take a long time to process large prompts — continue?`)) return;
  }

  const content = buildApiContent(text, attachments);
  state.messages.push({ role: 'user', content });
  addUserMessage(text, attachments, state.messages.length - 1);
  userInput.value = '';
  clearAttachments();
  autoGrow();
  updateSendBtn();
  saveCurrentSession();

  await generateReply();
}

// Removes the last assistant reply and asks the model again with the same
// conversation. Wired to Regenerate on both the newest AI message and the
// user message that prompted it.
function regenerate() {
  if (state.streaming || !state.connected) return;
  if (state.messages[state.messages.length - 1]?.role === 'assistant') {
    state.messages.pop();
  }
  const wraps = messagesEl.querySelectorAll('.message.assistant');
  if (wraps.length) wraps[wraps.length - 1].remove();
  saveCurrentSession();
  generateReply();
}

// === AnythingLLM turn building ===

// AnythingLLM keeps the thread's history itself, so a normal turn sends only
// the new message and nothing else. That stops being true whenever the local
// transcript stops matching the server's — after an edit or a regenerate
// (which rewrite history), after opening a chat saved before its thread
// existed, or when thread creation failed and a new one had to be made. In
// those cases the thread is reset and the surviving turns are replayed as a
// single transcript message, which costs one request instead of one per turn.
function buildAnythingLLMTurn(session, threadSlug) {
  const messages = state.messages;
  const latest = extractText(messages[messages.length - 1]?.content || '');
  const priorCount = messages.length - 1;

  const inSync = session &&
    session.syncedBackend === BACKEND.ANYTHINGLLM &&
    session.syncedTo === priorCount &&
    session.threadSlug === threadSlug &&
    !!threadSlug;

  if (inSync) return { message: latest, reset: false };
  if (priorCount <= 0) return { message: latest, reset: true };

  const transcript = messages.slice(0, priorCount)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${extractText(m.content)}`)
    .join('\n\n');

  return {
    message: `[Earlier in this conversation]\n\n${transcript}\n\n[Current message]\n\n${latest}`,
    reset: true,
  };
}

// Images go to AnythingLLM as attachments so vision models can see them.
// Text and PDF attachments are already inlined into the message by
// buildApiContent, which is both simpler and more reliable than round-tripping
// them through AnythingLLM's document parser for a one-off question.
function buildAnythingLLMAttachments() {
  const last = state.messages[state.messages.length - 1];
  const content = last?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter(part => part.type === 'image_url' && part.image_url?.url?.startsWith('data:'))
    .map((part, i) => {
      const mime = part.image_url.url.slice(5, part.image_url.url.indexOf(';')) || 'image/png';
      return {
        name: `image-${i + 1}.${(mime.split('/')[1] || 'png')}`,
        mime,
        contentString: part.image_url.url,
      };
    });
}

// === Agent trail & citations ===

// The running list of agent steps ("searching the web for…", "reading
// example.com") that AnythingLLM emits while an agent works. It sits above the
// reply and collapses once the answer starts, so a finished chat isn't buried
// in process.
function agentTrail(body) {
  let box = body.querySelector('.agent-trail');
  if (box) return box._trail;

  box = document.createElement('details');
  box.className = 'agent-trail';
  box.open = true;

  const summary = document.createElement('summary');
  summary.className = 'agent-trail-summary';
  summary.innerHTML = '<span class="agent-trail-spinner"></span><span class="agent-trail-title">Working…</span>';

  const list = document.createElement('ol');
  list.className = 'agent-trail-steps';

  box.append(summary, list);
  body.insertBefore(box, body.firstChild);

  let count = 0;
  box._trail = {
    add(text) {
      count++;
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
      summary.querySelector('.agent-trail-title').textContent =
        `${count} step${count === 1 ? '' : 's'}`;
    },
    done() {
      box.open = false;
      box.classList.add('finished');
      summary.querySelector('.agent-trail-spinner')?.remove();
      summary.querySelector('.agent-trail-title').textContent =
        count ? `Used ${count} step${count === 1 ? '' : 's'}` : 'No steps';
    },
  };
  return box._trail;
}

// Document chunks the answer drew on. AnythingLLM returns the matching text
// with each citation, so the snippet goes in the title rather than being
// thrown away — it is the fastest way to see whether a citation is real.
function renderSources(body, sources) {
  const seen = new Set();
  const unique = [];
  sources.forEach(s => {
    const title = s.title || s.docpath || s.url || 'Source';
    if (seen.has(title)) return;
    seen.add(title);
    unique.push({ title, text: s.text || s.chunk || '', url: s.url || '' });
  });
  if (!unique.length) return;

  const box = document.createElement('details');
  box.className = 'sources-box';
  const summary = document.createElement('summary');
  summary.textContent = `${unique.length} source${unique.length === 1 ? '' : 's'}`;
  box.appendChild(summary);

  const list = document.createElement('ul');
  list.className = 'sources-list';
  unique.forEach(s => {
    const li = document.createElement('li');
    // A scraped page keeps its link; an uploaded document has none.
    if (/^https?:\/\//i.test(s.url)) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.title;
      li.appendChild(a);
    } else {
      li.textContent = s.title;
    }
    if (s.text) li.title = s.text.slice(0, 500);
    list.appendChild(li);
  });
  box.appendChild(list);
  body.appendChild(box);
}

// Generate an assistant reply for the current state.messages.
async function generateReply() {
  // Model selection is purely whatever's in the dropdown — no auto-switching.
  const targetModel = activeModelId();
  const isModelSwitch = !!targetModel && targetModel !== state.lastLoadedModel;

  const apiMessages = [];
  const sys = systemPrompt.value.trim();
  if (sys) apiMessages.push({ role: 'system', content: sys });
  apiMessages.push(...state.messages);

  const useStream = streamToggle.checked;
  state.streaming = true;
  state.abortController = new AbortController();
  sendBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  updateSendBtn();

  hideWelcome();
  const wrap = document.createElement('div');
  wrap.className = 'message assistant';
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  const faviconImg = document.createElement('img');
  faviconImg.src = 'Scholar_favicon_32.png';
  faviconImg.alt = 'Scholar';
  avatar.appendChild(faviconImg);
  const body = document.createElement('div');
  body.className = 'message-body';
  const bubble = document.createElement('div');
  bubble.className = 'message-content';
  // A model switch shows a distinct loading bar (load + queue time is
  // unpredictable); otherwise the usual typing dots for generation.
  bubble.innerHTML = isModelSwitch
    ? modelLoadingHTML(targetModel)
    : '<div class="typing"><span></span><span></span><span></span></div>';
  body.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  scrollToBottom(true);

  // Reasoning and answer are concatenated for display; nothing is hidden.
  let fullContent = '';
  let reasoning = '';
  let renderer = null;

  // Response stats: delta count approximates tokens when the server doesn't
  // report usage.
  const tStart = performance.now();
  let firstTokenAt = 0;
  let deltaCount = 0;
  let usage = null;
  let finishReason = null;

  // If nothing arrives for a while, say so — big prompts (multiple attached
  // files) can take minutes of prompt processing and look like a hang.
  const slowNote = document.createElement('div');
  slowNote.className = 'slow-note';
  slowNote.textContent = 'Still working — large prompts can take a while to process…';
  const slowTimer = setTimeout(() => { if (!firstTokenAt) body.appendChild(slowNote); }, 10000);
  const clearSlow = () => { clearTimeout(slowTimer); slowNote.remove(); };

  // The placeholder (dots / loading bar) stays until the first token, at which
  // point the renderer takes the bubble over.
  const startRenderer = () => {
    if (!renderer) renderer = new StreamRenderer(bubble);
    return renderer;
  };

  // Painting is shared by both backends, so only the request differs below.
  // Reasoning is rendered inline ahead of the answer, separated by a blank
  // line the first time the answer starts.
  const onFirstToken = () => {
    if (firstTokenAt) return;
    firstTokenAt = performance.now();
    state.lastLoadedModel = targetModel;
    clearSlow();
    startRenderer();
  };
  const pushReasoning = (t) => {
    if (!t) return;
    onFirstToken();
    reasoning += t;
    deltaCount++;
    renderer.push(t);
  };
  const pushAnswer = (t) => {
    if (!t) return;
    onFirstToken();
    const separator = (reasoning && !fullContent) ? '\n\n' : '';
    fullContent += t;
    deltaCount++;
    renderer.push(separator + t);
  };

  try {
    if (isAnythingLLM()) {
      const session = state.sessions.find(s => s.id === state.currentSessionId);
      const slug = session?.projectSlug || state.activeProjectSlug;
      if (!slug) {
        throw new Error('No project selected. Pick or create one from the picker next to Send — ' +
                        'AnythingLLM always chats through a workspace.');
      }

      // The thread is created on the first send rather than when the chat is
      // opened, so opening a chat never needs the network. A failure here is
      // not fatal: the workspace endpoint partitions by sessionId instead,
      // which still keeps this chat's history separate from every other one.
      const threadSlug = session ? await Projects.ensureThread(session) : null;
      const turn = buildAnythingLLMTurn(session, threadSlug);

      // Agent mode is the whole reason web browsing works: `@agent` is what
      // AnythingLLM's REST handler checks to start the agent cluster, which is
      // where the web-search and scraping skills live.
      const message = state.agentMode && !/^@agent\b/i.test(turn.message)
        ? '@agent ' + turn.message
        : turn.message;

      // The trail is created on the first thought rather than up front, so a
      // turn that never uses a tool shows no empty step list.
      let trail = null;
      const trailFor = () => (trail || (trail = agentTrail(body)));
      let sources = null;

      await AnythingLLM.stream({
        url: state.conn.allmUrl,
        key: state.conn.allmKey,
        slug,
        threadSlug,
        message,
        mode: state.agentMode ? 'chat' : state.chatMode,
        attachments: buildAnythingLLMAttachments(),
        reset: turn.reset,
        signal: state.abortController.signal,
        onDelta: pushAnswer,
        onReasoning: pushReasoning,
        onThought: (t) => {
          clearSlow();
          trailFor().add(t);
          scrollToBottom();
        },
        onSources: (s) => { sources = s; },
        onMetrics: (m) => {
          // AnythingLLM reports prompt/completion token counts under the same
          // names the stats line already understands.
          if (m && (m.prompt_tokens != null || m.completion_tokens != null)) usage = m;
        },
      });

      if (trail) trail.done();
      if (!fullContent && !reasoning) {
        fullContent = '(empty response)';
        bubble.innerHTML = renderMessage(fullContent);
      } else {
        startRenderer().finish();
      }
      if (sources?.length) renderSources(body, sources);

      // The server now holds everything the client does, plus the reply it is
      // about to append.
      if (session) {
        session.syncedTo = state.messages.length + 1;
        session.syncedBackend = BACKEND.ANYTHINGLLM;
      }
    } else {
      const payload = {
        model: targetModel || undefined,
        messages: apiMessages,
        temperature: parseFloat(tempSlider.value),
        max_tokens: parseInt(tokensSlider.value),
        stream: useStream,
      };

      await LMStudio.stream({
        url: state.conn.lmsUrl,
        key: state.conn.lmsToken,
        model: payload.model,
        messages: apiMessages,
        temperature: payload.temperature,
        maxTokens: payload.max_tokens,
        useStream,
        signal: state.abortController.signal,
        onDelta: pushAnswer,
        onReasoning: pushReasoning,
        onMetrics: (u) => { usage = u; },
        onFinishReason: (r) => { finishReason = r; },
      });

      // The non-streaming path lands in one piece rather than in tokens, but
      // it arrives through the same callbacks, so the renderer already holds
      // it and only needs finishing.
      if (!fullContent && !reasoning) {
        fullContent = '(empty response)';
        bubble.innerHTML = renderMessage(fullContent);
      } else {
        startRenderer().finish();
      }
    }

    if (finishReason === 'length') {
      const note = document.createElement('div');
      note.className = 'trunc-note';
      note.textContent = `⚠ Response was cut off — it hit the Max Tokens limit (${tokensSlider.value}). Raise Max Tokens in Settings and regenerate.`;
      body.appendChild(note);
    }
    const getRaw = () => JSON.stringify({
      model: targetModel, finish_reason: finishReason,
      reasoning_content: reasoning || undefined, content: fullContent,
    }, null, 2);
    appendStats(body, { tStart, firstTokenAt, deltaCount, usage });
    addMessageActions(body, () => fullContent, getRaw);
    state.messages.push({ role: 'assistant', content: fullContent });
    saveCurrentSession();
    maybeAutoName();

  } catch (err) {
    if (err.name === 'AbortError') {
      // Keep whatever arrived before Stop — it's a real partial answer.
      if (fullContent || reasoning) {
        if (renderer) renderer.finish();
        appendStats(body, { tStart, firstTokenAt, deltaCount, usage });
        addMessageActions(body, () => fullContent,
          () => JSON.stringify({ model: targetModel, aborted: true, reasoning_content: reasoning || undefined, content: fullContent }, null, 2));
        state.messages.push({ role: 'assistant', content: fullContent });
        saveCurrentSession();
      } else if (renderer) {
        renderer.replaceWith('<em>Stopped.</em>');
      } else {
        bubble.innerHTML = '<em>Stopped.</em>';
      }
    } else {
      // A reply that partly arrived before the failure is still worth keeping
      // on screen, with the error appended rather than replacing it.
      if (renderer && (fullContent || reasoning)) {
        renderer.finish();
        const note = document.createElement('div');
        note.className = 'message-content error';
        note.textContent = err.message;
        body.appendChild(note);
      } else {
        bubble.className = 'message-content error';
        bubble.textContent = err.message;
      }
      state.connected = false;
      setStatus('disconnected');
      setTimeout(connect, 3000);
    }
  } finally {
    clearSlow();
    state.streaming = false;
    state.abortController = null;
    sendBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    updateSendBtn();
    scrollToBottom();
  }
}

// === Per-message actions (copy / regenerate) ===
const COPY_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const REGEN_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';

function addMessageActions(body, getText, getRaw) {
  // Only the newest AI message can regenerate — retire older regen buttons
  document.querySelectorAll('.msg-actions .regen-btn').forEach(b => b.remove());

  let row = body.querySelector('.msg-actions');
  if (!row) {
    row = document.createElement('div');
    row.className = 'msg-actions';
    body.appendChild(row);
  }
  row.innerHTML = '';

  const copy = document.createElement('button');
  copy.className = 'msg-action-btn';
  copy.innerHTML = COPY_SVG + '<span>Copy</span>';
  copy.addEventListener('click', () => {
    navigator.clipboard.writeText(getText());
    const span = copy.querySelector('span');
    span.textContent = 'Copied!';
    setTimeout(() => span.textContent = 'Copy', 1500);
  });
  row.appendChild(copy);

  const regen = document.createElement('button');
  regen.className = 'msg-action-btn regen-btn';
  regen.innerHTML = REGEN_SVG + '<span>Regenerate</span>';
  regen.addEventListener('click', regenerate);
  row.appendChild(regen);

  // Debug aid: copy the exact raw payload (reasoning channel, content,
  // finish reason) so rendering issues can be diagnosed from ground truth.
  if (getRaw) {
    const raw = document.createElement('button');
    raw.className = 'msg-action-btn';
    raw.innerHTML = '<span>Raw</span>';
    raw.title = 'Copy the raw model output for debugging';
    raw.addEventListener('click', () => {
      navigator.clipboard.writeText(getRaw());
      const span = raw.querySelector('span');
      span.textContent = 'Copied!';
      setTimeout(() => span.textContent = 'Raw', 1500);
    });
    row.appendChild(raw);
  }
}

const EDIT_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

// Copy + Edit actions for a user (prompt) message. Edit swaps the bubble for
// a textarea; saving truncates state.messages (and the DOM) from this point
// on and resends, exactly like editing a prompt in Claude/ChatGPT. `index`
// is this message's position in state.messages at render time — stable
// because messages before it never move, and editing removes everything
// from `index` onward (in both state and DOM) before pushing the edit.
function addUserMessageActions(body, wrap, bubble, text, attachments, index) {
  const row = document.createElement('div');
  row.className = 'msg-actions';

  const copy = document.createElement('button');
  copy.className = 'msg-action-btn';
  copy.innerHTML = COPY_SVG + '<span>Copy</span>';
  copy.addEventListener('click', () => {
    navigator.clipboard.writeText(text || '');
    const span = copy.querySelector('span');
    span.textContent = 'Copied!';
    setTimeout(() => span.textContent = 'Copy', 1500);
  });
  row.appendChild(copy);

  if (index != null) {
    const edit = document.createElement('button');
    edit.className = 'msg-action-btn';
    edit.innerHTML = EDIT_SVG + '<span>Edit</span>';
    edit.addEventListener('click', () => startEditMessage(body, wrap, bubble, row, text, attachments, index));
    row.appendChild(edit);

    // Re-asks with this prompt as the last word, dropping everything that
    // followed it. On the newest prompt that's just "answer again"; on an
    // older one it rewinds the conversation to that point first.
    const regen = document.createElement('button');
    regen.className = 'msg-action-btn';
    regen.innerHTML = REGEN_SVG + '<span>Regenerate</span>';
    regen.addEventListener('click', () => {
      if (state.streaming || !state.connected) return;
      state.messages = state.messages.slice(0, index + 1);
      // Drop every rendered message after this one so the DOM matches.
      let node = wrap.nextSibling;
      while (node) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
      saveCurrentSession();
      generateReply();
    });
    row.appendChild(regen);
  }

  body.appendChild(row);
}

function startEditMessage(body, wrap, bubble, actionsRow, text, attachments, index) {
  if (state.streaming) return;

  const snapshot = bubble.innerHTML;
  bubble.innerHTML = '';
  actionsRow.classList.add('hidden');

  const textarea = document.createElement('textarea');
  textarea.className = 'edit-textarea';
  textarea.value = text || '';
  bubble.appendChild(textarea);

  const editActions = document.createElement('div');
  editActions.className = 'edit-actions';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'msg-action-btn';
  cancelBtn.textContent = 'Cancel';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'msg-action-btn edit-save-btn';
  saveBtn.textContent = 'Save & Submit';
  editActions.appendChild(cancelBtn);
  editActions.appendChild(saveBtn);
  bubble.appendChild(editActions);

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  cancelBtn.addEventListener('click', () => {
    bubble.innerHTML = snapshot;
    actionsRow.classList.remove('hidden');
  });

  saveBtn.addEventListener('click', () => {
    if (state.streaming || !state.connected) return;
    const newText = textarea.value.trim();
    const hasImage = attachments.some(a => a.kind === 'image');
    if (!newText && !hasImage) return;

    const newContent = buildApiContent(newText, attachments);
    state.messages = state.messages.slice(0, index);
    state.messages.push({ role: 'user', content: newContent });

    // Drop this message and everything after it, then re-render the edit.
    let node = wrap;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
    addUserMessage(newText, attachments, index);
    saveCurrentSession();
    generateReply();
  });
}

// === Auto-naming chats ===
// After the first exchange, quietly ask the model for a 3–5 word title.
async function maybeAutoName() {
  const session = state.sessions.find(s => s.id === state.currentSessionId);
  if (!session || session.customTitle || session.autoNamed) return;
  if (state.messages.filter(m => m.role === 'assistant').length !== 1) return;
  session.autoNamed = true; // one attempt only, even if it fails

  const userText = extractText(state.messages.find(m => m.role === 'user')?.content || '').slice(0, 400);
  const aiText = extractText(state.messages.find(m => m.role === 'assistant')?.content || '').slice(0, 400);
  const prompt = `Write a short title (3-5 words) summarizing this conversation. Reply with ONLY the title — no quotes, no punctuation around it, no explanation.\n\nUser: ${userText}\nAssistant: ${aiText}`;

  if (isAnythingLLM()) {
    const slug = session.projectSlug || state.activeProjectSlug;
    if (!slug) return;
    try {
      // Named on the workspace rather than the chat's own thread, so the
      // titling prompt never lands in the conversation the user is reading.
      // The scratch session is reset afterwards so it doesn't accumulate.
      let title = '';
      await AnythingLLM.stream({
        url: state.conn.allmUrl, key: state.conn.allmKey, slug,
        threadSlug: null, message: prompt, mode: 'chat',
        onDelta: (t) => { title += t; },
        signal: AbortSignal.timeout(60000),
      });
      title = cleanAutoTitle(title);
      if (!title) return;
      session.title = title;
      persistSessions();
      renderHistoryList();
    } catch (e) { /* best-effort — the first-message title stays */ }
    finally {
      AnythingLLM.resetThread({ url: state.conn.allmUrl, key: state.conn.allmKey, slug, threadSlug: null });
    }
    return;
  }

  const namingModel = activeModelId();
  try {
    const resp = await fetch(state.apiBase + '/v1/chat/completions', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        model: namingModel || undefined,
        messages: [{ role: 'user', content: `Write a short title (3-5 words) summarizing this conversation. Reply with ONLY the title — no quotes, no punctuation around it, no explanation.\n\nUser: ${userText}\nAssistant: ${aiText}` }],
        temperature: 0.3,
        max_tokens: 400, // headroom for models that think before answering
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const title = cleanAutoTitle(data.choices?.[0]?.message?.content || '');
    if (!title) return;
    session.title = title;
    persistSessions();
    renderHistoryList();
  } catch (e) { /* best-effort — placeholder title stays */ }
}

// Models that think before answering wrap the answer in reasoning and often
// add a preamble, so the title is the last non-empty line with the thinking,
// special tokens, and surrounding quotes stripped off.
function cleanAutoTitle(raw) {
  let title = (raw || '').replace(/<think(?:ing)?>[\s\S]*?(<\/think(?:ing)?>|$)/gi, '');
  title = stripSpecialTokens(title);
  const lines = title.split('\n').map(l => l.trim()).filter(Boolean);
  title = (lines[lines.length - 1] || '').replace(/^["'“”]+|["'“”.]+$/g, '').trim();
  return (!title || title.length > 80) ? '' : title;
}

// === HTML preview (artifacts-lite) ===
function openPreview(html) {
  const modal = $('#preview-modal');
  const frame = $('#preview-frame');
  frame.srcdoc = html;
  modal.classList.remove('hidden');
}

function closePreview() {
  const modal = $('#preview-modal');
  const frame = $('#preview-frame');
  frame.srcdoc = '';
  modal.classList.add('hidden');
}

function stopStreaming() {
  if (state.abortController) state.abortController.abort();
}

// `keepProject` is set when the new chat was started from a project tile, so
// the click that chose the project isn't undone by the reset that follows it.
function newChat(opts) {
  state.messages = [];
  state.currentSessionId = null;
  state.chatFullyLoaded = false;
  if (!opts?.keepProject && isAnythingLLM()) syncProjectPicker();
  clearAttachments();
  messagesEl.innerHTML = '';
  if (welcome) messagesEl.appendChild(welcome);
  showWelcome(true);
  renderHistoryList();
  updateDataStats();
  if (!inputArea.classList.contains('hidden')) userInput.focus();
}

// === Chat sessions ===
const SESSIONS_KEY = 'lmstudio-chat-sessions';

function loadSessions() {
  try {
    state.sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch (e) {
    state.sessions = [];
  }
  renderHistoryList();
}

function persistSessions() {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(state.sessions));
  } catch (e) {
    // localStorage quota exceeded (large images) — drop oldest sessions until it fits
    while (state.sessions.length > 1) {
      state.sessions.pop();
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(state.sessions));
        return;
      } catch (e2) { /* keep trimming */ }
    }
  }
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter(p => p.type === 'text').map(p => p.text).join(' ');
  return '';
}

function sessionTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New chat';
  const text = extractText(firstUser.content).trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 60) : 'Attachment';
}

function saveCurrentSession() {
  if (state.messages.length === 0) return;
  const now = Date.now();
  let session = state.sessions.find(s => s.id === state.currentSessionId);
  if (!session) {
    session = { id: 'c' + now.toString(36) + Math.random().toString(36).slice(2, 7), createdAt: now };
    state.currentSessionId = session.id;
    // A chat is bound to whichever project was active when it started, and
    // keeps it — switching projects later must not silently move an existing
    // conversation into a different workspace's documents.
    session.projectSlug = isAnythingLLM() ? state.activeProjectSlug : null;
    session.threadSlug = null;
    session.backend = currentBackend();
    // Apply folder assignment to new sessions
    if (state.nextChatFolderId) {
      session.folderId = state.nextChatFolderId;
      state.nextChatFolderId = null;
      clearFolderAssignment();
    }
  }
  session.messages = state.messages;
  if (!session.customTitle && !session.autoNamed) session.title = sessionTitle(state.messages);
  session.model = state.currentModel;
  session.settings = {
    temperature: parseFloat(tempSlider.value),
    maxTokens: parseInt(tokensSlider.value),
    systemPrompt: systemPrompt.value,
  };
  session.updatedAt = now;
  // Keep the active session at the top, newest-first
  state.sessions = [session, ...state.sessions.filter(s => s.id !== session.id)];
  persistSessions();
  renderHistoryList();
  updateDataStats();
}

function loadSession(id) {
  const session = state.sessions.find(s => s.id === id);
  if (!session) return;
  if (state.streaming) stopStreaming();
  state.currentSessionId = id;
  state.deleteConfirmSessionId = null;
  state.messages = JSON.parse(JSON.stringify(session.messages || []));
  clearAttachments();

  // Follow the chat into its project, so the composer and the picker describe
  // what this conversation is actually talking to.
  if (session.projectSlug && Projects.byslug(session.projectSlug)) {
    state.activeProjectSlug = session.projectSlug;
    syncProjectPicker();
  }

  // Restore the chat's model if it's still loaded in LM Studio.
  const opt = session.model && [...modelSelect.options].find(o => o.value === session.model);
  if (opt) {
    modelSelect.value = session.model;
    state.currentModel = session.model;
    refreshModelCaps();
    syncModelPickerLabel();
  }
  // Restore the chat's settings
  if (session.settings) {
    const st = session.settings;
    if (st.temperature != null) { tempSlider.value = st.temperature; tempValue.textContent = tempSlider.value; }
    if (st.maxTokens != null) { tokensSlider.value = st.maxTokens; tokensValue.textContent = tokensSlider.value; }
    if (st.systemPrompt != null) systemPrompt.value = st.systemPrompt;
    saveSettings();
  }

  state.chatFullyLoaded = false;
  renderCurrentMessages();
  scrollToBottom(true);

  // Keep the sidebar open on desktop (push mode); close it on phones
  if (window.innerWidth < 768) closeHistory();
  // Update highlight in place — rebuilding the list here would destroy the
  // title node mid-double-click and break rename.
  updateActiveHistoryItem();
}

function updateActiveHistoryItem() {
  historyList.querySelectorAll('.history-item').forEach(li =>
    li.classList.toggle('active', li.dataset.id === state.currentSessionId));
}

function deleteSession(id) {
  state.sessions = state.sessions.filter(s => s.id !== id);
  persistSessions();
  if (state.currentSessionId === id) newChat();
  else renderHistoryList();
  updateDataStats();
}

// === Folder assignment picker ===
function renderFolderPickerList() {
  folderPickerList.innerHTML = '';

  const noneItem = document.createElement('li');
  noneItem.className = 'folder-picker-item' + (state.nextChatFolderId === null ? ' selected' : '');
  noneItem.innerHTML = '<span class="folder-picker-item-label">No folder</span>';
  noneItem.addEventListener('click', () => {
    state.nextChatFolderId = null;
    clearFolderAssignment();
    closeFolderPicker();
    renderFolderPickerList();
  });
  folderPickerList.appendChild(noneItem);

  state.folders.forEach(folder => {
    const item = document.createElement('li');
    item.className = 'folder-picker-item' + (state.nextChatFolderId === folder.id ? ' selected' : '');
    item.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/></svg><span class="folder-picker-item-label">${escapeHtml(folder.name)}</span>`;
    item.addEventListener('click', () => {
      state.nextChatFolderId = folder.id;
      updateFolderAssignmentUI();
      closeFolderPicker();
      renderFolderPickerList();
    });
    folderPickerList.appendChild(item);
  });
}

function updateFolderAssignmentUI() {
  if (state.nextChatFolderId) {
    folderAssignBtn.classList.add('folder-assigned');
  } else {
    folderAssignBtn.classList.remove('folder-assigned');
  }
}

function clearFolderAssignment() {
  state.nextChatFolderId = null;
  folderAssignBtn.classList.remove('folder-assigned');
}

function openFolderPicker() {
  renderFolderPickerList();
  folderPickerPopover.classList.remove('hidden');
}

function closeFolderPicker() {
  folderPickerPopover.classList.add('hidden');
}

// === Chat folders ===
const FOLDERS_KEY = 'lmstudio-chat-folders';

function loadFolders() {
  try {
    state.folders = JSON.parse(localStorage.getItem(FOLDERS_KEY)) || [];
  } catch (e) {
    state.folders = [];
  }
}

function persistFolders() {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders));
  } catch (e) { /* quota — folders are tiny, nothing sensible to trim */ }
}

// Creates a folder and drops it straight into rename mode (via the caller,
// which re-renders and finds the fresh title node) rather than prompting for
// a name up front — matches how a new chat starts untitled too.
function createFolder() {
  const folder = { id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: 'New folder', collapsed: false };
  state.folders.unshift(folder);
  persistFolders();
  renderHistoryList();
  const nameEl = historyList.querySelector(`.history-folder[data-id="${folder.id}"] .history-folder-name`);
  if (nameEl) startRenameFolder(folder, nameEl);
}

function startRenameFolder(folder, nameEl) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = folder.name || '';
  nameEl.textContent = '';
  nameEl.appendChild(input);
  input.focus();
  input.select();

  let done = false;
  const commit = (save) => {
    if (done) return;
    done = true;
    const v = input.value.trim();
    if (save && v) {
      folder.name = v.slice(0, 60);
      persistFolders();
    }
    // Must happen before renderHistoryList — that function refuses to rebuild
    // while a rename input is still focused, to avoid destroying it mid-edit.
    // Leaving it in place after commit would make the rebuild never happen.
    input.remove();
    renderHistoryList();
  };
  input.addEventListener('click', e => e.stopPropagation());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
  });
  input.addEventListener('blur', () => commit(true));
}

// Deleting a folder never deletes its chats — they just fall back to being
// ungrouped, the same place a chat starts out.
function deleteFolder(id) {
  state.folders = state.folders.filter(f => f.id !== id);
  state.sessions.forEach(s => { if (s.folderId === id) s.folderId = null; });
  persistFolders();
  persistSessions();
  renderHistoryList();
}

function toggleFolderCollapsed(id) {
  const f = state.folders.find(x => x.id === id);
  if (!f) return;
  f.collapsed = !f.collapsed;
  persistFolders();
  renderHistoryList();
}

function moveSessionToFolder(sessionId, folderId) {
  const s = state.sessions.find(x => x.id === sessionId);
  if (!s) return;
  s.folderId = folderId || null;
  persistSessions();
  renderHistoryList();
}

function relTime(ts) {
  if (!ts) return '';
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd ago';
  return new Date(ts).toLocaleDateString();
}

const TRASH_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
const PIN_SVG = (filled) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3.76a2 2 0 0 0 .59 1.42l1.7 1.7a1 1 0 0 1-.7 1.7H6.41a1 1 0 0 1-.7-1.7l1.7-1.7A2 2 0 0 0 8 10.76z"/></svg>`;

function togglePin(id) {
  const s = state.sessions.find(x => x.id === id);
  if (!s) return;
  s.pinned = !s.pinned;
  persistSessions();
  renderHistoryList();
}

function startRename(session, titleEl) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = session.title || '';
  titleEl.textContent = '';
  titleEl.appendChild(input);
  input.focus();
  input.select();

  let done = false;
  const commit = (save) => {
    if (done) return;
    done = true;
    const v = input.value.trim();
    if (save && v && v !== session.title) {
      session.title = v.slice(0, 80);
      session.customTitle = true;
      persistSessions();
    }
    input.remove(); // must go before re-render: the rename guard checks for it
    renderHistoryList();
  };
  input.addEventListener('click', e => e.stopPropagation());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
  });
  input.addEventListener('blur', () => commit(true));
}

// Bucket sessions Claude-style: Pinned, Today, Yesterday, Previous 7 days, Older.
// Buckets ungrouped (unpinned, folderless) sessions Claude-style: Today,
// Yesterday, Previous 7 days, Older.
function groupSessions(sessions) {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const yesterday = startOfToday.getTime() - dayMs;
  const weekAgo = startOfToday.getTime() - 7 * dayMs;

  const groups = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ];
  sessions.forEach(s => {
    const t = s.updatedAt || s.createdAt || 0;
    if (t >= startOfToday.getTime()) groups[0].items.push(s);
    else if (t >= yesterday) groups[1].items.push(s);
    else if (t >= weekAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  });
  return groups.filter(g => g.items.length);
}

const FOLDER_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/></svg>';
const CHEVRON_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';

// Closes any open move-to-folder popover. Exported at module scope (rather
// than nested in renderHistoryList) so a document-level click listener can
// close a menu when the click lands anywhere outside it.
function closeMoveMenus() {
  historyList.querySelectorAll('.history-move-menu').forEach(m => m.classList.add('hidden'));
}
document.addEventListener('click', closeMoveMenus);

// Builds one chat row. Shared by every section (pinned, per-folder, and the
// date buckets) so behavior — rename, pin, move, delete, drag source — stays
// identical no matter where the chat currently lives.
function buildHistoryItem(session) {
  const li = document.createElement('li');
  li.className = 'history-item' + (session.id === state.currentSessionId ? ' active' : '');
  li.dataset.id = session.id;
  li.draggable = true;
  li.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', session.id);
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', () => li.classList.remove('dragging'));

  const main = document.createElement('div');
  main.className = 'history-item-main';
  const title = document.createElement('div');
  title.className = 'history-item-title';
  title.textContent = session.title || 'New chat';
  title.title = 'Double-click to rename';
  title.addEventListener('dblclick', e => { e.stopPropagation(); startRename(session, title); });
  const time = document.createElement('div');
  time.className = 'history-item-time';
  time.textContent = relTime(session.updatedAt);
  main.appendChild(title);
  main.appendChild(time);
  main.addEventListener('click', () => loadSession(session.id));

  const pin = document.createElement('button');
  pin.className = 'history-pin' + (session.pinned ? ' pinned' : '');
  pin.setAttribute('aria-label', session.pinned ? 'Unpin chat' : 'Pin chat');
  pin.innerHTML = PIN_SVG(!!session.pinned);
  pin.addEventListener('click', e => { e.stopPropagation(); togglePin(session.id); });

  const move = document.createElement('div');
  move.className = 'history-move';
  const moveBtn = document.createElement('button');
  moveBtn.className = 'history-move-btn';
  moveBtn.setAttribute('aria-label', 'Move to folder');
  moveBtn.title = 'Move to folder';
  moveBtn.innerHTML = FOLDER_SVG;
  const menu = document.createElement('div');
  menu.className = 'history-move-menu hidden';
  const noneItem = document.createElement('button');
  noneItem.type = 'button';
  noneItem.className = 'history-move-item' + (!session.folderId ? ' current' : '');
  noneItem.textContent = 'No folder';
  noneItem.addEventListener('click', e => { e.stopPropagation(); closeMoveMenus(); moveSessionToFolder(session.id, null); });
  menu.appendChild(noneItem);
  state.folders.forEach(f => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'history-move-item' + (session.folderId === f.id ? ' current' : '');
    item.textContent = f.name;
    item.addEventListener('click', e => { e.stopPropagation(); closeMoveMenus(); moveSessionToFolder(session.id, f.id); });
    menu.appendChild(item);
  });
  moveBtn.addEventListener('click', e => {
    e.stopPropagation();
    const willOpen = menu.classList.contains('hidden');
    closeMoveMenus();
    if (willOpen) menu.classList.remove('hidden');
  });
  move.appendChild(moveBtn);
  move.appendChild(menu);

  const del = document.createElement('button');
  del.className = 'history-delete';
  del.setAttribute('aria-label', 'Delete chat');
  del.innerHTML = TRASH_SVG;

  const confirmOverlay = document.createElement('div');
  confirmOverlay.className = 'history-delete-confirm hidden';
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'history-delete-confirm-btn';
  confirmBtn.setAttribute('aria-label', 'Confirm delete');
  confirmBtn.textContent = 'Delete';
  confirmBtn.addEventListener('click', e => { e.stopPropagation(); deleteSession(session.id); });
  confirmOverlay.appendChild(confirmBtn);

  del.addEventListener('click', e => {
    e.stopPropagation();
    if (state.deleteConfirmSessionId === session.id) {
      // Already in confirm mode, delete immediately
      deleteSession(session.id);
    } else {
      // Enter confirm mode
      state.deleteConfirmSessionId = session.id;
      renderHistoryList();
    }
  });

  // If this session is in delete confirm mode, show the overlay
  if (state.deleteConfirmSessionId === session.id) {
    confirmOverlay.classList.remove('hidden');
  }

  li.appendChild(main);
  li.appendChild(pin);
  li.appendChild(move);
  li.appendChild(del);
  li.appendChild(confirmOverlay);
  return li;
}

function appendHistoryGroup(label, sessions) {
  const header = document.createElement('li');
  header.className = 'history-group';
  header.textContent = label;
  historyList.appendChild(header);
  sessions.forEach(s => historyList.appendChild(buildHistoryItem(s)));
}

function appendFolderSection(folder, sessions, searching) {
  const section = document.createElement('li');
  section.className = 'history-folder-section';

  const header = document.createElement('div');
  header.className = 'history-folder' + (folder.collapsed && !searching ? ' collapsed' : '');
  header.dataset.id = folder.id;

  const chevron = document.createElement('span');
  chevron.className = 'history-folder-chevron';
  chevron.innerHTML = CHEVRON_SVG;
  const icon = document.createElement('span');
  icon.className = 'history-folder-icon';
  icon.innerHTML = FOLDER_SVG;
  const name = document.createElement('span');
  name.className = 'history-folder-name';
  name.textContent = folder.name;
  name.title = 'Double-click to rename';
  name.addEventListener('dblclick', e => { e.stopPropagation(); startRenameFolder(folder, name); });
  const count = document.createElement('span');
  count.className = 'history-folder-count';
  count.textContent = sessions.length || '';
  const del = document.createElement('button');
  del.className = 'history-folder-delete';
  del.setAttribute('aria-label', 'Delete folder');
  del.title = 'Delete folder (keeps its chats)';
  del.innerHTML = TRASH_SVG;
  del.addEventListener('click', e => { e.stopPropagation(); deleteFolder(folder.id); });

  header.appendChild(chevron);
  header.appendChild(icon);
  header.appendChild(name);
  header.appendChild(count);
  header.appendChild(del);
  header.addEventListener('click', () => toggleFolderCollapsed(folder.id));

  // Drop target for dragging a chat row in from anywhere in the list.
  header.addEventListener('dragover', e => { e.preventDefault(); header.classList.add('drag-over'); });
  header.addEventListener('dragleave', () => header.classList.remove('drag-over'));
  header.addEventListener('drop', e => {
    e.preventDefault();
    header.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    if (id) moveSessionToFolder(id, folder.id);
  });

  const list = document.createElement('ul');
  list.className = 'history-folder-items' + (folder.collapsed && !searching ? ' hidden' : '');
  sessions.forEach(s => list.appendChild(buildHistoryItem(s)));

  section.appendChild(header);
  section.appendChild(list);
  historyList.appendChild(section);
}

function renderHistoryList() {
  if (!historyList) return;
  // Don't rebuild while a rename is in progress — it would destroy the input
  const renamingChat = historyList.querySelector('.history-item-title input');
  const renamingFolder = historyList.querySelector('.history-folder-name input');
  if ((renamingChat || renamingFolder) && document.activeElement &&
      (renamingChat === document.activeElement || renamingFolder === document.activeElement)) return;
  historyList.innerHTML = '';

  const q = (historySearch?.value || '').trim().toLowerCase();
  const searching = !!q;
  let sessions = state.sessions;
  if (searching) {
    sessions = sessions.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.messages || []).some(m => extractText(m.content).toLowerCase().includes(q))
    );
  }

  const validFolderIds = new Set(state.folders.map(f => f.id));
  const pinned = sessions.filter(s => s.pinned);
  const unpinned = sessions.filter(s => !s.pinned);
  const folderless = unpinned.filter(s => !s.folderId || !validFolderIds.has(s.folderId));

  const hasAnything = pinned.length || unpinned.length || state.folders.length;
  if (!hasAnything) {
    historyEmpty.textContent = searching ? 'No matching chats.' : 'No saved chats yet.';
    historyEmpty.classList.remove('hidden');
    return;
  }
  historyEmpty.classList.add('hidden');

  if (pinned.length) appendHistoryGroup('Pinned', pinned);

  state.folders.forEach(folder => {
    const items = unpinned.filter(s => s.folderId === folder.id);
    // While searching, an empty folder is just noise — skip it. Otherwise
    // folders always show (even empty) so there's somewhere to drag a chat.
    if (searching && !items.length) return;
    appendFolderSection(folder, items, searching);
  });

  groupSessions(folderless).forEach(group => appendHistoryGroup(group.label, group.items));
}

// Remembers whether the Chats panel was left open, so a reload restores it —
// like Claude's sidebar — instead of always starting closed. Only persisted
// as an open/closed *preference*; restoring it into an actual open panel on
// launch is still gated to desktop widths (see init()), matching how the
// panel already behaves as a push-over sidebar there but a full overlay
// drawer on mobile.
const HISTORY_OPEN_KEY = 'lmstudio-history-open';

function openHistory() {
  state.deleteConfirmSessionId = null;
  renderHistoryList();
  historyPanel.classList.remove('hidden');
  historyOverlay.classList.remove('hidden'); // hidden on wide screens via CSS
  appEl.classList.add('history-open');        // pushes content over on desktop
  localStorage.setItem(HISTORY_OPEN_KEY, '1');
}

function closeHistory() {
  historyPanel.classList.add('hidden');
  historyOverlay.classList.add('hidden');
  appEl.classList.remove('history-open');
  localStorage.setItem(HISTORY_OPEN_KEY, '0');
}

function toggleHistory() {
  if (historyPanel.classList.contains('hidden')) openHistory();
  else closeHistory();
}

// Drags the Chats panel open/closed 1:1 with the finger — like a native iOS
// side menu (or the Claude app), not a threshold that just pops it open once
// crossed. Two gestures share the same tracking: an edge swipe from the left
// when the panel is closed opens it; a swipe anywhere while it's open closes
// it.
//
// Restricted to iOS installed web apps (Add to Home Screen, standalone
// display mode) — `navigator.standalone` is only ever `true` there. In an
// ordinary browser tab (iOS Safari included) a left-edge swipe is the "back"
// gesture; hijacking it there would fight the browser's own navigation, so
// this stays off everywhere else.
function setupHistoryPanelSwipe() {
  if (window.navigator.standalone !== true) return;

  const EDGE_ZONE_PX = 24;    // an "opening" drag must start this close to the left edge
  const CONFIRM_PX = 10;      // drag distance before committing to horizontal vs. a vertical scroll
  const OPEN_FRACTION = 0.4;  // release past this fraction of the panel's width -> snap open
  const FLICK_VELOCITY = 0.5; // px/ms — a fast flick commits regardless of distance

  let mode = null;       // 'opening' | 'closing' | null
  let active = false;    // horizontal intent confirmed — currently steering the panel
  let startX = 0, startY = 0, startT = 0, lastX = 0, lastT = 0, velocity = 0;
  let panelWidth = 0;

  function beginDrag(clientX, clientY) {
    const closed = historyPanel.classList.contains('hidden');
    if (closed) {
      if (clientX > EDGE_ZONE_PX) { mode = null; return; }
      mode = 'opening';
    } else {
      mode = 'closing';
    }
    startX = lastX = clientX;
    startY = clientY;
    startT = lastT = performance.now();
    velocity = 0;
    active = false;
    panelWidth = historyPanel.getBoundingClientRect().width || 300;
  }

  function setDragPosition(rawOffset) {
    // rawOffset: 0 (fully closed) .. panelWidth (fully open), regardless of mode.
    const clamped = Math.max(0, Math.min(panelWidth, rawOffset));
    historyPanel.style.transform = `translateX(${clamped - panelWidth}px)`;
    historyOverlay.style.opacity = String(clamped / panelWidth);
  }

  function endDrag(rawOffset) {
    historyPanel.classList.remove('dragging');
    historyOverlay.classList.remove('dragging');
    historyPanel.style.transform = '';
    historyOverlay.style.opacity = '';
    const openEnough = rawOffset / panelWidth >= OPEN_FRACTION || velocity >= FLICK_VELOCITY;
    const closeEnough = rawOffset / panelWidth <= (1 - OPEN_FRACTION) || velocity <= -FLICK_VELOCITY;
    if (mode === 'opening') {
      if (openEnough) openHistory(); // else stays closed — CSS transition snaps it back
    } else if (mode === 'closing') {
      if (closeEnough) closeHistory(); else openHistory(); // re-affirm open so the CSS snap plays
    }
    mode = null;
    active = false;
  }

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    beginDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!mode) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!active) {
      if (Math.abs(dx) < CONFIRM_PX && Math.abs(dy) < CONFIRM_PX) return;
      if (Math.abs(dy) >= Math.abs(dx)) { mode = null; return; } // vertical scroll, not a panel drag
      active = true;
      historyPanel.classList.add('dragging');
      historyOverlay.classList.remove('hidden');
      historyOverlay.classList.add('dragging');
    }

    const now = performance.now();
    if (now > lastT) velocity = (t.clientX - lastX) / (now - lastT);
    lastX = t.clientX; lastT = now;

    const rawOffset = mode === 'opening' ? dx : panelWidth + dx;
    setDragPosition(rawOffset);
    e.preventDefault(); // once committed, don't let the page scroll under the drag
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (!mode) return;
    if (!active) { mode = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const rawOffset = mode === 'opening' ? dx : panelWidth + dx;
    endDrag(rawOffset);
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (active) endDrag(mode === 'opening' ? 0 : panelWidth); // snap back to where it started
    mode = null;
    active = false;
  }, { passive: true });
}

// === Sidebar ===
function openSidebar() {
  sidebar.classList.remove('hidden');
  sidebarOverlay.classList.remove('hidden');
}

function closeSidebar() {
  sidebar.classList.add('hidden');
  sidebarOverlay.classList.add('hidden');
}

// Lets the Settings and Chats panels be dragged wider/narrower from their
// inner edge. The width lives in a CSS custom property on :root (so both the
// panel's own `width` and, for the history panel, #app's push-over
// padding-left stay in sync automatically — see the `var(--history-width)`
// rules in style.css) and is persisted so it survives a reload.
//
// `anchor` says which edge of the panel is fixed in place: 'right' for the
// sidebar (it hugs the right edge of the screen, so dragging its left edge
// changes width as screenWidth - pointerX), 'left' for the history panel
// (dragging its right edge changes width as pointerX itself).
function setupPanelResize(panel, handle, cssVar, storageKey, anchor) {
  if (!panel || !handle) return;

  const MIN_WIDTH = 240;
  const maxWidth = () => Math.min(640, Math.round(window.innerWidth * 0.7));

  const saved = parseInt(localStorage.getItem(storageKey), 10);
  if (saved && saved >= MIN_WIDTH) {
    document.documentElement.style.setProperty(cssVar, saved + 'px');
  }

  let dragging = false;

  const widthFor = (clientX) => {
    const raw = anchor === 'right' ? window.innerWidth - clientX : clientX;
    return Math.max(MIN_WIDTH, Math.min(maxWidth(), Math.round(raw)));
  };

  const onMove = (e) => {
    if (!dragging) return;
    const w = widthFor(e.clientX);
    document.documentElement.style.setProperty(cssVar, w + 'px');
  };

  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.classList.remove('resizing-panel');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    localStorage.setItem(storageKey, String(widthFor(e.clientX)));
  };

  handle.addEventListener('pointerdown', (e) => {
    // Only the primary button/touch starts a drag; a click-through on
    // whatever's beneath is preserved for anything else.
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    handle.classList.add('dragging');
    document.body.classList.add('resizing-panel');
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    e.preventDefault();
  });
}

// === Input ===
function autoGrow() {
  userInput.style.height = 'auto';
  // scrollHeight is 0 when the field is hidden; don't collapse the box in that case
  if (userInput.scrollHeight > 0) {
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
  }
}

function updateSendBtn() {
  const hasInput = userInput.value.trim() || state.attachments.length > 0;
  sendBtn.disabled = !hasInput || !state.connected || state.streaming;
}

// === Attachments ===
const MAX_FILE_BYTES = 1024 * 1024; // 1 MB per text file (also caps extracted PDF text)
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB per PDF, before text extraction

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
}

function readFile(file, asDataUrl) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    if (asDataUrl) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

// Splits a mixed file list (from the picker or a drag-drop) into images,
// PDFs, and plain text, routing each to its handler.
function handleAttachedFiles(files) {
  if (!files.length) return;
  const images = files.filter(f => f.type.startsWith('image/'));
  const pdfs = files.filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
  const texts = files.filter(f => !images.includes(f) && !pdfs.includes(f));
  if (images.length) {
    if (state.modelCaps.vision) handleImageFiles(images);
    else alert('The current model doesn\'t support images.');
  }
  if (pdfs.length) handlePdfFiles(pdfs);
  if (texts.length) handleTextFiles(texts);
}

async function handleImageFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const url = await readFile(file, true);
      state.attachments.push({ kind: 'image', name: file.name, size: file.size, url });
    } catch (e) { /* skip unreadable file */ }
  }
  renderAttachments();
  updateSendBtn();
}

const TEXT_FILE_RE = /\.(txt|md|markdown|json|csv|tsv|log|js|jsx|ts|tsx|py|html?|css|scss|xml|ya?ml|toml|ini|sh|bash|java|c|h|cpp|hpp|cs|go|rs|rb|php|sql|swift|kt|r)$/i;

async function handleTextFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('text/') && !TEXT_FILE_RE.test(file.name)) {
      alert(`"${file.name}" isn't a supported text file and was skipped.`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      alert(`"${file.name}" is larger than 1 MB and was skipped.`);
      continue;
    }
    try {
      const text = await readFile(file, false);
      state.attachments.push({ kind: 'file', name: file.name, size: file.size, text });
    } catch (e) { /* skip unreadable file */ }
  }
  renderAttachments();
  updateSendBtn();
}

// Extracts text (not a render) from each page via pdf.js, running entirely
// in-browser — the PDF's bytes never leave the device. Scanned/image-only
// PDFs yield no text and are skipped since there's nothing to send.
async function handlePdfFiles(files) {
  if (!window.pdfjsLib) {
    alert('PDF support failed to load — try reloading the page.');
    return;
  }
  for (const file of files) {
    if (file.size > MAX_PDF_BYTES) {
      alert(`"${file.name}" is larger than 20 MB and was skipped.`);
      continue;
    }
    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages && text.length <= MAX_FILE_BYTES; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(' ') + '\n\n';
      }
      text = text.trim();
      if (!text) {
        alert(`"${file.name}" has no extractable text (it may be a scanned image) and was skipped.`);
        continue;
      }
      const truncated = text.length > MAX_FILE_BYTES;
      if (truncated) text = text.slice(0, MAX_FILE_BYTES) + '\n\n[...truncated]';
      state.attachments.push({ kind: 'file', name: file.name, size: file.size, text });
    } catch (e) {
      alert(`Couldn't read "${file.name}" as a PDF.`);
    }
  }
  renderAttachments();
  updateSendBtn();
}

function removeAttachment(idx) {
  state.attachments.splice(idx, 1);
  renderAttachments();
  updateSendBtn();
}

function clearAttachments() {
  state.attachments = [];
  renderAttachments();
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

const FILE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';

function renderAttachments() {
  attachmentsEl.innerHTML = '';
  if (state.attachments.length === 0) {
    attachmentsEl.classList.add('hidden');
    return;
  }
  attachmentsEl.classList.remove('hidden');

  state.attachments.forEach((att, idx) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip' + (att.kind === 'image' ? ' image' : '');

    if (att.kind === 'image') {
      const img = document.createElement('img');
      img.src = att.url;
      img.alt = att.name;
      chip.appendChild(img);
    } else {
      const icon = document.createElement('span');
      icon.className = 'file-icon';
      icon.innerHTML = FILE_SVG;
      const meta = document.createElement('div');
      meta.className = 'file-meta';
      const name = document.createElement('div');
      name.className = 'file-name';
      name.textContent = att.name;
      const size = document.createElement('div');
      size.className = 'file-size';
      size.textContent = formatBytes(att.size);
      meta.appendChild(name);
      meta.appendChild(size);
      chip.appendChild(icon);
      chip.appendChild(meta);
    }

    const remove = document.createElement('button');
    remove.className = 'attachment-remove';
    remove.setAttribute('aria-label', 'Remove attachment');
    remove.textContent = '×';
    remove.addEventListener('click', () => removeAttachment(idx));
    chip.appendChild(remove);

    attachmentsEl.appendChild(chip);
  });
}

// Turn typed text + attachments into an API message content value.
// Returns a string for text-only, or an array of parts when images are present.
function buildApiContent(text, attachments) {
  const images = attachments.filter(a => a.kind === 'image');
  const files = attachments.filter(a => a.kind === 'file');

  let textPart = text || '';
  if (files.length) {
    const blocks = files.map(f => `\n\n[File: ${f.name}]\n\`\`\`\n${f.text}\n\`\`\``).join('');
    textPart = (textPart + blocks).trim();
  }

  if (images.length) {
    const parts = [];
    if (textPart) parts.push({ type: 'text', text: textPart });
    images.forEach(img => parts.push({ type: 'image_url', image_url: { url: img.url } }));
    return parts;
  }
  return textPart;
}

// === Events ===
function setupListeners() {
  // Setup screen
  setupConnect.addEventListener('click', () => tryConnect());
  [setupUrl, setupToken, setupAllmUrl, setupAllmKey].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', e => { if (e.key === 'Enter') tryConnect(); });
  });
  useLocalhost.addEventListener('click', () => {
    setupUrl.value = 'http://localhost:1234';
    tryConnect();
  });
  if (useAllmLocal) {
    useAllmLocal.addEventListener('click', () => {
      setupAllmUrl.value = 'http://localhost:3001';
      tryConnect();
    });
  }

  // Backend switch, on both the setup screen and the sidebar. Switching is
  // just a state change plus a reconnect — both backends keep their own saved
  // address and key, so nothing is re-entered.
  document.querySelectorAll('[data-backend-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.backendChoice;
      if (next === state.conn.backend) return;
      state.conn.backend = next;
      saveConnection();
      syncBackendUI();
      setupError.classList.add('hidden');
      // Only reconnect from the sidebar; on the setup screen the user still
      // has to press Connect, and probing a half-typed address is noise.
      if (btn.dataset.backendScope === 'sidebar') {
        state.connected = false;
        if (activeUrl()) connect(); else showSetup();
      }
    });
  });

  // Sidebar
  sidebarToggle.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  sidebarReconn.addEventListener('click', () => {
    const raw = sidebarUrl.value.trim();
    if (!raw) return;
    state.conn.lmsUrl = normalizeBase(raw);
    state.conn.lmsToken = apiTokenInput ? apiTokenInput.value.trim() : state.conn.lmsToken;
    state.conn.backend = BACKEND.LMSTUDIO;
    state.connected = false;
    saveConnection();
    syncConnectionInputs();
    connect();
    closeSidebar();
  });

  if (sidebarAllmReconnect) {
    sidebarAllmReconnect.addEventListener('click', () => {
      const raw = sidebarAllmUrl.value.trim();
      if (!raw) return;
      state.conn.allmUrl = normalizeBase(raw);
      state.conn.allmKey = sidebarAllmKey.value.trim();
      state.conn.backend = BACKEND.ANYTHINGLLM;
      state.connected = false;
      saveConnection();
      syncConnectionInputs();
      connect();
      closeSidebar();
    });
  }

  // The credential fields exist in two places — Settings and the setup screen
  // — so a bad key is still fixable while disconnected, when Settings is
  // unreachable. Each pair edits one value.
  const mirror = (from, to, apply) => {
    if (!from) return;
    from.addEventListener('input', () => {
      apply(from.value.trim());
      if (to) to.value = from.value;
      saveConnection();
    });
  };
  mirror(apiTokenInput, setupToken, v => { state.conn.lmsToken = v; syncLegacyAliases(); });
  mirror(setupToken, apiTokenInput, v => { state.conn.lmsToken = v; syncLegacyAliases(); });
  mirror(sidebarAllmKey, setupAllmKey, v => { state.conn.allmKey = v; });
  mirror(setupAllmKey, sidebarAllmKey, v => { state.conn.allmKey = v; });
  mirror(sidebarAllmUrl, setupAllmUrl, v => { state.conn.allmUrl = normalizeBase(v); });
  mirror(setupAllmUrl, sidebarAllmUrl, v => { state.conn.allmUrl = normalizeBase(v); });

  // "Show" reveals the token so it can be checked against LM Studio. Each
  // button names its field via data-token-for; the two fields toggle
  // independently since only one is on screen at a time.
  document.querySelectorAll('.token-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = $('#' + btn.dataset.tokenFor);
      if (!field) return;
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-label', show ? 'Hide token' : 'Show token');
      btn.classList.toggle('revealed', show);
    });
  });

  disconnectBtn.addEventListener('click', () => {
    closeSidebar();
    showSetup();
  });

  // Project picker (AnythingLLM) — occupies the same composer slot the model
  // picker uses on LM Studio.
  if (projectPickerBtn) projectPickerBtn.addEventListener('click', openProjectPicker);
  if (projectModalClose) projectModalClose.addEventListener('click', closeProjectPicker);
  if (projectModal) projectModal.addEventListener('click', e => {
    if (e.target === projectModal) closeProjectPicker();
  });

  if (agentToggle) agentToggle.addEventListener('click', toggleAgentMode);

  if (chatModeBtn) {
    chatModeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (chatModeMenu.classList.contains('hidden')) openChatModeMenu();
      else chatModeMenu.classList.add('hidden');
    });
  }
  document.addEventListener('click', (e) => {
    if (chatModeMenu && !chatModeMenu.classList.contains('hidden') &&
        !chatModeMenu.contains(e.target) && e.target !== chatModeBtn) {
      chatModeMenu.classList.add('hidden');
    }
  });

  if (codeViewBtn) codeViewBtn.addEventListener('click', () => ScholarCode.toggle());

  // Settings
  tempSlider.addEventListener('input', () => { tempValue.textContent = tempSlider.value; saveSettings(); });
  tokensSlider.addEventListener('input', () => { tokensValue.textContent = tokensSlider.value; saveSettings(); });
  systemPrompt.addEventListener('change', saveSettings);
  streamToggle.addEventListener('change', saveSettings);
  if (messageLoadLimitSlider) {
    // 'input' (every drag tick) only updates the number label — re-rendering
    // the message list on every tick would recreate the exact heaviness this
    // setting exists to avoid. The limit itself only applies on 'change'
    // (drag release), and only to chats opened after that.
    messageLoadLimitSlider.addEventListener('input', () => {
      messageLoadLimitValue.textContent = messageLoadLimitSlider.value;
    });
    messageLoadLimitSlider.addEventListener('change', () => {
      state.messageLoadLimit = parseInt(messageLoadLimitSlider.value);
      saveSettings();
    });
  }
  if (stripImagesBtn) {
    stripImagesBtn.addEventListener('click', () => {
      const removed = stripImagesFromCurrentChat();
      stripImagesBtn.textContent = removed > 0
        ? `Removed ${removed} image${removed === 1 ? '' : 's'}`
        : 'No images in this chat';
      setTimeout(() => { stripImagesBtn.textContent = 'Remove images from this chat'; }, 2500);
    });
  }
  if (clearAllChatsBtn) clearAllChatsBtn.addEventListener('click', clearAllChats);

  // Chat
  modelSelect.addEventListener('change', onModelChange);
  modelPickerBtn.addEventListener('click', openModelPicker);
  modelModalClose.addEventListener('click', closeModelPicker);
  modelModal.addEventListener('click', e => { if (e.target === modelModal) closeModelPicker(); });
  newChatBtn.addEventListener('click', newChat);
  userInput.addEventListener('input', () => { autoGrow(); updateSendBtn(); updateWelcomeFade(); });
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !state.streaming) sendMessage();
    }
  });
  sendBtn.addEventListener('click', () => { if (!state.streaming) sendMessage(); });
  stopBtn.addEventListener('click', stopStreaming);

  // Attachments — one button/input covers both, so mobile browsers show
  // their native "Take Photo / Photo Library / Browse Files" sheet.
  attachFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { handleAttachedFiles([...e.target.files]); e.target.value = ''; });

  // Folder assignment picker
  folderAssignBtn.addEventListener('click', openFolderPicker);
  folderPickerPopover.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', e => {
    if (!folderPickerPopover.classList.contains('hidden') &&
        !folderAssignBtn.contains(e.target) &&
        !folderPickerPopover.contains(e.target)) {
      closeFolderPicker();
    }
  });

  userInput.addEventListener('paste', e => {
    if (!state.modelCaps.vision) return;
    const imgs = [...(e.clipboardData?.items || [])]
      .filter(it => it.kind === 'file' && it.type.startsWith('image/'))
      .map(it => it.getAsFile())
      .filter(Boolean);
    if (imgs.length) { e.preventDefault(); handleImageFiles(imgs); }
  });

  // History panel
  historyBtn.addEventListener('click', toggleHistory);
  historyClose.addEventListener('click', closeHistory);
  historyOverlay.addEventListener('click', closeHistory);
  historyNew.addEventListener('click', () => { newChat(); if (window.innerWidth < 768) closeHistory(); });
  if (historyNewFolder) historyNewFolder.addEventListener('click', createFolder);
  historySearch.addEventListener('input', renderHistoryList);
  setupHistoryPanelSwipe();

  // Version dropdown (desktop only)
  if (versionBtn) {
    versionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      versionDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.version-dropdown-wrap')) {
        versionDropdown.classList.add('hidden');
      }
    });
  }
  if (changelogViewAll) changelogViewAll.addEventListener('click', openChangelogModal);
  if (changelogClose) changelogClose.addEventListener('click', closeChangelogModal);
  if (changelogModal) {
    changelogModal.addEventListener('click', (e) => {
      if (e.target === changelogModal) closeChangelogModal();
    });
  }

  // Scroll position / pill
  chatContainer.addEventListener('scroll', onChatScroll);
  scrollPill.addEventListener('click', () => scrollToBottom(true));

  // HTML preview modal
  $('#preview-close').addEventListener('click', closePreview);
  $('#preview-modal').addEventListener('click', e => { if (e.target.id === 'preview-modal') closePreview(); });

  // Drag-and-drop attachments (anywhere on the page)
  document.addEventListener('dragover', e => {
    e.preventDefault();
    if (state.connected) composerEl.classList.add('drag-over');
  });
  document.addEventListener('dragleave', e => {
    if (!e.relatedTarget) composerEl.classList.remove('drag-over');
  });
  document.addEventListener('drop', e => {
    e.preventDefault();
    composerEl.classList.remove('drag-over');
    if (!state.connected) return;
    handleAttachedFiles([...(e.dataTransfer?.files || [])]);
  });

  // Reconnect when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    // activeUrl(), not state.apiBase — the latter only tracks LM Studio, so an
    // AnythingLLM-only setup would never reconnect on focus.
    if (!document.hidden && activeUrl() && !state.connected && !state.streaming) connect();
  });

  // Tie #app's actual height to the real visible viewport instead of a CSS
  // viewport unit. `dvh` only reacts to browser chrome (address bar)
  // show/hide, not the on-screen keyboard, so without this the layout stays
  // full-height while the keyboard covers part of it — which is exactly
  // when mobile browsers kick in their own "scroll the focused input into
  // view" behavior and yank the whole page up. Once #app's height matches
  // window.visualViewport.height, the flex layout already fits the visible
  // area (composer right above the keyboard, chat area shrunk to match),
  // so there's nothing left for the browser to scroll.
  if (window.visualViewport) {
    const vv = window.visualViewport;
    // Safari can also pan the *visual* viewport itself (a compositor-level
    // offset, separate from any DOM scroll position) to bring a focused
    // input into view — it does this because none of our ancestors are
    // scrollable, so it's WebKit's fallback. That pan doesn't clear itself
    // and isn't blocked by overflow/position tricks; window.scrollTo(0, 0)
    // is what actually resets it.
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    const syncAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', vv.height + 'px');
      resetScroll();
    };
    vv.addEventListener('resize', syncAppHeight);
    vv.addEventListener('scroll', syncAppHeight);
    syncAppHeight();

    // The keyboard-open animation settles after the resize/scroll events
    // fire, so re-assert a few times to catch WebKit's pan once it's done.
    userInput.addEventListener('focus', () => {
      resetScroll();
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 150);
      setTimeout(resetScroll, 350);
    });
  }
}

// === Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// === Start ===
init();
