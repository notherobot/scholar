# Scholar

A personal chat interface that connects to **LM Studio** running on your PC over Tailscale — with MCP tools, so the model can search the web when it needs to.

**Live URL:** https://notherobot.github.io/scholar/

---

## How It Works

```
Your browser (phone, tablet, laptop — anywhere)
    → loads the page from GitHub Pages
    → talks to LM Studio on your PC over Tailscale
    → LM Studio answers, calling MCP tools when it decides to
```

Tailscale gives your PC a stable private address that works from any of your devices. No port forwarding, no tunnels to start.

Scholar is a static page. There is no Scholar server, no database, and no analytics — every request goes straight from your browser to your PC.

---

## Setup

### 1. Install Tailscale on your PC and phone

- **PC:** https://tailscale.com/download
- **iPhone / Android:** "Tailscale" in the App Store / Play Store

Sign in with the same account on all devices.

### 2. Start LM Studio's server

1. Load a model.
2. **Developer** tab → **Start Server** (port `1234`).
3. In **Server Settings**, turn on:
   - **Enable CORS**
   - **Serve on Local Network**
   - **Require Authentication** — then **Manage Tokens** → create a token
   - **Allow calling servers from mcp.json** (needed for MCP)

### 3. Connect

Open Scholar, enter your address and paste the token:

- `my-pc.tailnet.ts.net` — a MagicDNS name, connected over **https**
- `100.x.x.x:1234` — a raw Tailscale IP, connected over **http**

Both are saved in your browser and reconnect automatically next time.

### Serving over https

GitHub Pages serves Scholar over https, and **a browser will not let an https page call a plain http address.** So from the hosted URL you need an https address for LM Studio:

1. One-time: in the [Tailscale admin console](https://login.tailscale.com/admin/dns) → DNS, turn on **HTTPS Certificates**.
2. On the PC running LM Studio:
   ```
   sudo tailscale serve --bg --https=443 localhost:1234
   ```
   (`sudo` depends on how Tailscale is installed; not needed on macOS/Windows.) Tailscale provisions the certificate itself — there's no separate `tailscale cert` step.
3. Check it took: `tailscale serve status`. Remove it later with `tailscale serve reset`.

Then enter `my-pc.tailnet.ts.net` (no port) in Scholar.

If you'd rather use a raw `100.x.x.x` address, run Scholar itself over http instead — clone the repo and serve it locally (`python3 -m http.server 8000`). Scholar detects this mismatch and tells you which case you're in rather than failing with a bare network error.

---

## MCP tools

Scholar chats through LM Studio's native `POST /api/v1/chat` endpoint rather than the OpenAI-compatible one, because **only the native endpoint accepts `integrations`** — the field that attaches MCP servers to a request. The OpenAI-shaped endpoint cannot run tools at all.

**Name your servers** in Settings → **MCP servers**, comma-separated:

| Where it comes from | What to type |
| --- | --- |
| A server in LM Studio's `mcp.json` | `mcp/<label>` — the label you gave it there |
| A plugin from the LM Studio Hub | `<owner>/<name>` |

They have to be typed because LM Studio exposes no endpoint that lists them. Settings tells you plainly whether any are attached, since "MCP is working" and "no servers named, so the model has no tools" otherwise look identical.

There is **no on/off toggle**. The servers are attached to every message and the model calls them when it decides to — which is what a system prompt telling it to look things up is for. That prompt belongs in LM Studio's model preset, not here.

When a tool runs, it appears above the reply with its name, the server it came from, its arguments, and its result — or its failure. A tool called three times with identical arguments is flagged as a loop rather than printing the same line repeatedly.

**MCP needs the API token.** LM Studio gates `mcp.json` servers behind **Require Authentication**, because those servers can reach your filesystem. Without a token you get `403 Permission denied to use plugin`; Scholar names that specific fix rather than blaming the address.

**MCP over the API needs LM Studio 0.4.0 or newer.** On an older build the endpoint 404s, and Scholar says so.

---

## What's not here

**No system prompt, temperature, or max tokens.** These live in the model's preset in LM Studio, which is where they actually take effect. Having a second, quieter copy in Scholar just gave them somewhere to disagree.

**No projects, workspaces, or document upload.** Scholar briefly ran on AnythingLLM to get those; it now talks only to LM Studio. That history is on the `backup/v0.9.0-anythingllm` branch if it's ever wanted back.

---

## Scholar Code

A separate coding view (the `< >` button in the header): file tree, editor with syntax highlighting, sandboxed live preview, and a chat that writes into your files.

Ask for a change and the reply's code blocks get an **Apply to file** / **Create file** button. **Run** previews the open file — an HTML file has its sibling `.css` and `.js` inlined first, so a multi-file page previews properly; anything else runs as a script with its console mirrored into the frame. MCP tools are available here too.

**What it can't do, and why.** Scholar is a static page in a browser tab. It cannot run a shell, install packages, or read and write files on your PC. Files here live in this browser's storage; "running code" means HTML/CSS/JS in a sandboxed iframe. Everything else — writing, refactoring, reviewing, explaining — goes to the model with the real file contents in the prompt. An MCP server with filesystem access would change that, and LM Studio can host one.

---

## Conversations

`/api/v1/chat` takes a **single message**, not a transcript — its input objects carry no role. Multi-turn works by threading: every reply returns a `response_id`, and sending it back as `previous_response_id` continues that thread on the server.

Scholar handles the ways that thread breaks:

- An **edit** or a **regenerate** rewrites history the server still holds, so the thread is dropped and the conversation replayed to re-establish it.
- **LM Studio restarting** drops its stored threads while the id stays in your browser. Nothing distinguishes a dead id from a live one until the request is refused, so the first failure of a threaded turn is retried once as a full replay before it counts as an error. You see a normal answer, not a crash.

---

## Features

- Streaming responses with a stop button, and reasoning rendered inline
- MCP tool calls shown live: name, server, arguments, result, failures, loop detection
- Model picker, auto-populated from LM Studio with size/context/quantization info
- Markdown with code copy buttons and syntax highlighting; HTML preview for code blocks
- Attachments: images, PDFs (text extracted in-browser), and plain-text/code files
- Copy, Edit, and Regenerate on messages
- Saved chat history with search, pinning, rename, folders, and auto-generated titles
- Scholar Code: file tree, editor, sandboxed preview, model-applied edits
- Connection status in Settings, separate from the composer's dot
- PWA — add to home screen on mobile

---

## On iPhone

Open Scholar in Safari, then **Share → Add to Home Screen**. It launches without browser chrome and behaves like an app.

The layout is built for that: safe-area insets keep content clear of the Dynamic Island and home indicator, the view resizes with the keyboard rather than hiding the composer behind it, every control meets Apple's 44pt touch minimum, and no input is under 16px — below that, iOS zooms the page in on focus and never zooms back out.

**Scholar Code** becomes tabbed on a phone — Files, Editor, Chat — instead of three stacked panels. Tapping a file opens it in the editor.

---

## Security

- **Tailscale is end-to-end encrypted** — traffic between your phone and PC uses WireGuard. Nothing passes through a third-party server.
- **Private network** — your Tailscale address is only reachable by your own devices.
- **Static page** — no backend, no database, no analytics.
- **Local storage only** — your address, token, chats, and code files stay in your browser.
- **Your API token unlocks MCP servers**, and those can reach your filesystem. Treat any device you connect from as trusted, and revoke the token in LM Studio if one is lost.
- Code previews run in an iframe sandboxed without `allow-same-origin`, so previewed code cannot read Scholar's storage or your token.

---

## License

MIT
