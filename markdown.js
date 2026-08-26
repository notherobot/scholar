/**
 * Scholar markdown renderer.
 *
 * Written for streaming: a reply is re-rendered many times while it arrives,
 * often mid-word, mid-fence, or mid-emphasis. Two properties matter more than
 * feature completeness, and both are structural rather than best-effort:
 *
 *  1. It always terminates. Every iteration of the block loop is required to
 *     consume at least one line — the paragraph branch takes the current line
 *     unconditionally before it looks at any continuation, and a guard at the
 *     bottom of the loop advances the cursor if a branch ever failed to. The
 *     previous renderer had no such guard: a line that matched none of its
 *     block rules but *was* excluded from paragraphs (a bare "# ", "--- x",
 *     "***text") left the cursor parked and spun the tab forever. Partial
 *     lines are the normal case while streaming, so that fired constantly.
 *
 *  2. It cannot backtrack catastrophically. Paired inline delimiters are found
 *     with indexOf and consumed with slice — no regex of the `(.+?)` between
 *     two delimiters shape, which degrades to O(n^2) on unclosed input (again,
 *     the normal case mid-stream).
 *
 * Inline markup is applied to already-escaped text, and emitted HTML is never
 * re-scanned, so a URL containing _underscores_ can't be mangled by the
 * emphasis pass the way chained .replace() calls mangle it.
 */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Only http/https/mailto/relative targets become live links. Anything else
  // (javascript:, data:) renders as plain text — model output is untrusted.
  function safeUrl(url) {
    const u = String(url).trim();
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null;
    return u;
  }

  // === Inline ===

  const INLINE_DELIMS = [
    { open: '***', close: '***', wrap: (h) => `<strong><em>${h}</em></strong>` },
    { open: '**',  close: '**',  wrap: (h) => `<strong>${h}</strong>` },
    { open: '__',  close: '__',  wrap: (h) => `<strong>${h}</strong>` },
    { open: '~~',  close: '~~',  wrap: (h) => `<del>${h}</del>` },
    { open: '*',   close: '*',   wrap: (h) => `<em>${h}</em>` },
    { open: '_',   close: '_',   wrap: (h) => `<em>${h}</em>` },
  ];

  // depth guards against pathological nesting (e.g. "*".repeat(5000)) turning
  // into deep recursion; past the limit the delimiters are just literal text.
  function renderInline(src, depth) {
    depth = depth || 0;
    const text = String(src);
    let out = '';
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      // Inline code — highest precedence, contents are never parsed further.
      if (ch === '`') {
        const end = text.indexOf('`', i + 1);
        if (end !== -1) {
          out += `<code>${escapeHtml(text.slice(i + 1, end))}</code>`;
          i = end + 1;
          continue;
        }
      }

      // Image / link. The label is matched with indexOf so an unclosed "["
      // costs a single scan rather than a backtracking retry per position.
      if (ch === '!' && text[i + 1] === '[') {
        const consumed = takeLink(text, i + 1, depth, true);
        if (consumed) { out += consumed.html; i = i + 1 + consumed.length; continue; }
      }
      if (ch === '[') {
        const consumed = takeLink(text, i, depth, false);
        if (consumed) { out += consumed.html; i += consumed.length; continue; }
      }

      // Emphasis. Longest opener first so "***" isn't read as "**" + "*".
      if (ch === '*' || ch === '_' || ch === '~') {
        let matched = null;
        for (const d of INLINE_DELIMS) {
          if (!text.startsWith(d.open, i)) continue;
          const from = i + d.open.length;
          // An opener immediately followed by whitespace is literal ("2 * 3").
          if (/\s/.test(text[from] || '')) continue;
          const end = text.indexOf(d.close, from);
          if (end === -1 || end === from) continue;
          matched = { d, from, end };
          break;
        }
        if (matched) {
          const inner = text.slice(matched.from, matched.end);
          out += matched.d.wrap(depth < 4 ? renderInline(inner, depth + 1) : escapeHtml(inner));
          i = matched.end + matched.d.close.length;
          continue;
        }
      }

      out += escapeHtml(ch);
      i++;
    }

    return out;
  }

  // Reads "[label](target)" starting at `start` (which must be the "[").
  // Returns null when either bracket pair is unclosed, so the caller falls
  // through and emits the "[" as literal text.
  function takeLink(text, start, depth, isImage) {
    const labelEnd = text.indexOf(']', start + 1);
    if (labelEnd === -1 || text[labelEnd + 1] !== '(') return null;
    const urlEnd = text.indexOf(')', labelEnd + 2);
    if (urlEnd === -1) return null;

    const label = text.slice(start + 1, labelEnd);
    const url = safeUrl(text.slice(labelEnd + 2, urlEnd));
    const length = urlEnd + 1 - start;

    if (url === null) {
      return { html: escapeHtml(text.slice(start, urlEnd + 1)), length };
    }
    if (isImage) {
      return { html: `<img alt="${escapeHtml(label)}" src="${escapeHtml(url)}" loading="lazy">`, length };
    }
    const inner = depth < 4 ? renderInline(label, depth + 1) : escapeHtml(label);
    return { html: `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`, length };
  }

  // === Blocks ===

  const RE_FENCE     = /^(\s*)(`{3,}|~{3,})\s*([\w+-]*)/;
  const RE_HEADING   = /^(#{1,6})(?:\s+(.*))?$/;
  const RE_HR        = /^\s*(?:-\s*){3,}$|^\s*(?:\*\s*){3,}$|^\s*(?:_\s*){3,}$/;
  const RE_UL        = /^(\s*)[-*+]\s+(.*)$/;
  const RE_OL        = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
  const RE_TABLE_SEP = /^\s*\|?[\s:-]*-[\s|:-]*$/;

  function isBlockStart(line) {
    return RE_FENCE.test(line) || RE_HEADING.test(line) || RE_HR.test(line) ||
           RE_UL.test(line) || RE_OL.test(line) || /^\s*>/.test(line);
  }

  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map(c => c.trim());
  }

  function parseBlocks(src, depth) {
    depth = depth || 0;
    const lines = String(src).split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const startedAt = i;          // termination guard, checked at loop end
      const line = lines[i];

      // --- Fenced code -------------------------------------------------
      const fence = line.match(RE_FENCE);
      if (fence) {
        const marker = fence[2][0];
        const minLen = fence[2].length;
        const lang = fence[3] || '';
        const body = [];
        i++;
        while (i < lines.length) {
          const m = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
          if (m && m[1][0] === marker && m[1].length >= minLen) { i++; break; }
          body.push(lines[i]);
          i++;
        }
        const cls = lang ? ` class="language-${escapeHtml(lang.toLowerCase())}"` : '';
        out.push(`<pre><code${cls}>${escapeHtml(body.join('\n'))}</code></pre>`);
        continue;
      }

      // --- Blank -------------------------------------------------------
      if (line.trim() === '') { i++; continue; }

      // --- Heading -----------------------------------------------------
      // Matches even with no text after the hashes ("# " while streaming);
      // an empty heading renders empty rather than stalling the parser.
      const heading = line.match(RE_HEADING);
      if (heading) {
        const level = heading[1].length;
        const body = (heading[2] || '').replace(/\s+#+\s*$/, '');
        out.push(`<h${level}>${renderInline(body)}</h${level}>`);
        i++;
        continue;
      }

      // --- Horizontal rule ---------------------------------------------
      if (RE_HR.test(line)) { out.push('<hr>'); i++; continue; }

      // --- Blockquote ---------------------------------------------------
      if (/^\s*>/.test(line)) {
        const body = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          body.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        const inner = depth < 4 ? parseBlocks(body.join('\n'), depth + 1) : escapeHtml(body.join('\n'));
        out.push(`<blockquote>${inner}</blockquote>`);
        continue;
      }

      // --- Table --------------------------------------------------------
      if (line.includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1])) {
        const header = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
          rows.push(splitRow(lines[i]));
          i++;
        }
        let html = '<table><thead><tr>';
        header.forEach(c => { html += `<th>${renderInline(c)}</th>`; });
        html += '</tr></thead><tbody>';
        rows.forEach(r => {
          html += '<tr>';
          // Pad/trim to the header width so a half-arrived row stays aligned.
          for (let c = 0; c < header.length; c++) html += `<td>${renderInline(r[c] || '')}</td>`;
          html += '</tr>';
        });
        out.push(html + '</tbody></table>');
        continue;
      }

      // --- Lists ---------------------------------------------------------
      if (RE_UL.test(line) || RE_OL.test(line)) {
        i = takeList(lines, i, out, depth);
        continue;
      }

      // --- Paragraph ------------------------------------------------------
      // Takes the current line unconditionally, *then* gathers continuations.
      // This is what makes progress guaranteed: no matter what the line looks
      // like, it is consumed here if nothing above claimed it.
      const para = [lines[i]];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i]) &&
             !(lines[i].includes('|') && RE_TABLE_SEP.test(lines[i + 1] || ''))) {
        para.push(lines[i]);
        i++;
      }
      out.push(`<p>${renderInline(para.join('\n')).replace(/\n/g, '<br>')}</p>`);

      // Defensive: no branch above may leave the cursor where it started.
      // If one ever does, move on rather than spin.
      if (i === startedAt) i++;
    }

    return out.join('\n');
  }

  // Consumes one list (and any nested sub-lists) starting at `start`.
  // Returns the index of the first line after it.
  function takeList(lines, start, out, depth) {
    const first = lines[start];
    const ordered = RE_OL.test(first);
    const baseIndent = (first.match(ordered ? RE_OL : RE_UL))[1].length;
    const items = [];
    let i = start;

    while (i < lines.length) {
      const m = lines[i].match(ordered ? RE_OL : RE_UL);
      if (!m || m[1].length < baseIndent) break;

      if (m[1].length > baseIndent) {
        // Deeper indent — recurse, attaching the sub-list to the open item.
        const sub = [];
        const next = takeList(lines, i, sub, depth + 1);
        if (items.length) items[items.length - 1] += sub.join('');
        i = next;
        continue;
      }

      const body = [ordered ? m[3] : m[2]];
      i++;
      // Lazy continuation: unindented, non-blank, not the start of a new block.
      while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
        body.push(lines[i].trim());
        i++;
      }
      items.push(renderInline(body.join('\n')).replace(/\n/g, '<br>'));
    }

    // A list matcher that consumed nothing would stall the caller — treat the
    // line as a paragraph instead so the cursor always moves.
    if (!items.length) {
      out.push(`<p>${renderInline(lines[start])}</p>`);
      return start + 1;
    }

    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && lines[start].match(RE_OL)[2] !== '1'
      ? ` start="${parseInt(lines[start].match(RE_OL)[2], 10)}"` : '';
    out.push(`<${tag}${startAttr}>` + items.map(li => `<li>${li}</li>`).join('') + `</${tag}>`);
    return i;
  }

  // Beyond this, rendering is skipped in favour of plain <pre> text. A reply
  // this long is a runaway generation, not something anyone reads as prose,
  // and it keeps the worst case bounded no matter what the model emits.
  const MAX_RENDER_CHARS = 250000;

  function render(src) {
    const text = String(src == null ? '' : src);
    if (text.length > MAX_RENDER_CHARS) {
      return `<pre><code>${escapeHtml(text)}</code></pre>`;
    }
    return parseBlocks(text, 0);
  }

  window.ScholarMD = { render, renderInline, escapeHtml };
})();
