# Scholar

A personal chat interface that connects to **AnythingLLM** running on your PC over Tailscale — with projects, document knowledge, web-browsing agents, and a coding view. **LM Studio** is kept as a plain fallback.

**Live URL:** https://notherobot.github.io/scholar/

---

## How It Works

```
Your browser (phone, tablet, laptop — anywhere)
    → loads the page from GitHub Pages
    → talks to your PC over Tailscale
    → AnythingLLM answers, using your workspace's documents
       (and, in agent mode, the web)
```

Tailscale gives your PC a stable private address that works from any of your devices. No port forwarding, no tunnels to start.

Scholar is a static page. There is no Scholar server, no database, and no analytics — every request goes straight from your browser to your PC.

---

## Setup

### 1. Install Tailscale on your PC and phone

- **PC:** https://tailscale.com/download
- **iPhone / Android:** "Tailscale" in the App Store / Play Store

Sign in with the same account on all devices.

### 2. Turn on AnythingLLM's Developer API

1. Open AnythingLLM on your PC (default port **3001**).
2. **Settings → Tools → Developer API → Generate New API Key**.
3. Copy the key.

### 3. Connect

1. Open Scholar.
2. Leave the backend on **AnythingLLM**.
3. Enter your address and paste the key:
   - `my-pc.tailnet.ts.net:3001` — a MagicDNS name, connected over **https**
   - `100.x.x.x:3001` — a raw Tailscale IP, connected over **http**
4. Tap **Connect**.

Both are saved in your browser and reconnect automatically next time.

### Serving over https

GitHub Pages serves Scholar over https, and **a browser will not let an https page call a plain http address.** So from the hosted URL you need an https address for AnythingLLM:

```
tailscale cert my-pc.tailnet.ts.net
tailscale serve --bg --https 443 http://127.0.0.1:3001
```

Then enter `my-pc.tailnet.ts.net` (no port) in Scholar.

If you'd rather use a raw `100.x.x.x` address, run Scholar itself over http instead — clone the repo and serve it locally (`python3 -m http.server 8000`). Scholar detects this mismatch and tells you which case you're in rather than failing with a bare network error.

---

## Projects

A Scholar **project** is an AnythingLLM **workspace**, one to one:

| Scholar | AnythingLLM |
| --- | --- |
| Project | Workspace |
| Custom instructions | Workspace system prompt |
| Project knowledge | Documents embedded in the workspace |
| A chat in a project | A thread in that workspace |

Create one from the **Projects** section of the Chats panel. Open its gear icon to:

- **Add documents** — drag files in, or paste a URL to have AnythingLLM fetch and embed the page. Every chat in the project can then cite them, with no re-uploading.
- **Set custom instructions** — the project's standing system prompt.

Clicking a project starts a new chat inside it. Answers list the documents they drew on; hover a source to see the matching snippet.

Chats live as real AnythingLLM threads, so they appear in AnythingLLM's own UI too, and their history and retrieval sit next to the documents rather than only in this browser.

---

## Agents and web browsing

Toggle the **globe** next to Send. Scholar then sends the message as `@agent …`, which starts AnythingLLM's agent — it can search the web, read pages, and use whatever other skills you have enabled before answering. Its steps stream live above the reply.

For web search to work you must configure a search provider in AnythingLLM: **Settings → Agent Skills → Web Search** (SearXNG, Serper, Brave, Google CSE, …). Without one, the agent still runs but has nothing to search with.

The **chat mode** pill picks how a project answers:

- **Chat** — normal conversation; documents used when relevant.
- **Query** — answer only from the project's documents, or refuse.
- **Automatic** — let the model call tools itself, if its provider supports native tool calling.

> Earlier versions of Scholar drove AnythingLLM through its OpenAI-compatible shim (`/api/v1/openai/chat/completions`), where `@agent` is silently ignored and no agent ever runs. Scholar now uses the native `/api/v1/workspace/{slug}/thread/{thread}/stream-chat` endpoint, where agent invocation is a real branch.

---

## Scholar Code

A separate coding view (the `< >` button in the header): file tree, editor with syntax highlighting, sandboxed live preview, and a chat that writes into your files.

Ask for a change and the reply's code blocks get an **Apply to file** / **Create file** button. **Run** previews the open file — an HTML file has its sibling `.css` and `.js` inlined first, so a multi-file page previews properly; anything else runs as a script with its console mirrored into the frame. **Push to project** uploads the files into the active project as documents, so ordinary chats can read them too.

**What it can't do, and why.** Scholar is a static page in a browser tab. It cannot run a shell, install packages, or read and write files on your PC — there is nothing on the other end to do that. AnythingLLM's own filesystem skill is restricted to its Docker runtime and its CLI plugin is development-only, so neither is a way around it. Files here live in this browser's storage; "running code" means HTML/CSS/JS in a sandboxed iframe. Everything else — writing, refactoring, reviewing, explaining — goes to the model with the real file contents in the prompt.

---

## On iPhone

Open Scholar in Safari, then **Share → Add to Home Screen**. It launches without browser chrome and behaves like an app.

The layout is built for that case specifically: safe-area insets keep content clear of the Dynamic Island and the home indicator, the view resizes with the keyboard rather than hiding the composer behind it, every control meets Apple's 44pt touch minimum, and no input is under 16px — below that, iOS zooms the page in on focus and never zooms back out.

Two things adapt on a phone:

- The **answer mode** (Chat / Query / Automatic) moves from the composer into the project picker, since the composer has no room for it alongside the project name.
- **Scholar Code** becomes tabbed — Files, Editor, Chat — instead of three stacked panels. Tapping a file opens it in the editor.

---

## LM Studio (fallback)

Switch the backend in **Settings → Backend**. Both backends keep their own address and key, so switching back is one click.

1. LM Studio → **Developer** tab → **Start Server** (port `1234`).
2. In **Server Settings**: turn on **Enable CORS** and **Serve on Local Network**.
3. Enter the address in Scholar.

LM Studio has no workspaces, so on this backend there are no projects, no documents, and no agents — you get the model picker, the System Prompt, Temperature, and Max Tokens instead. Those three settings are hidden on AnythingLLM, where the project's own instructions govern.

---

## Features

- AnythingLLM backend on its default port 3001, with projects, documents, threads, and agents
- LM Studio backend as a fallback, with the model picker and sampling controls
- Streaming responses with a stop button, and reasoning rendered inline
- Citations on every answer, with snippets on hover
- Agent step trail streamed live
- Markdown with code copy buttons and syntax highlighting; HTML preview for code blocks
- Attachments: images, PDFs (text extracted in-browser), and plain-text/code files
- Copy, Edit, and Regenerate — an edit or regenerate resets the AnythingLLM thread and replays the surviving turns, so the server's history never drifts from what you see
- Saved chat history with search, pinning, rename, folders, and auto-generated titles
- Scholar Code: file tree, editor, sandboxed preview, model-applied edits
- PWA — add to home screen on mobile

---

## Security

- **Tailscale is end-to-end encrypted** — all traffic between your phone and PC uses WireGuard. Nothing passes through a third-party server.
- **Private network** — your Tailscale address is only reachable by your own devices.
- **Static page** — no backend, no database, no analytics.
- **Local storage only** — your addresses, API key, chats, and code files are stored in your browser and never leave your device.
- **Your AnythingLLM API key is a full-access credential.** It can read, create, and delete every workspace and document on that instance. Scholar keeps it in this browser's `localStorage`, so treat any device you connect from as trusted, and revoke the key in AnythingLLM if a device is lost.
- Code previews run in an iframe sandboxed without `allow-same-origin`, so previewed code cannot read Scholar's storage or your key.

---

## License

MIT
