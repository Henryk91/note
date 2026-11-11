import { marked, Token, Tokens } from 'marked';

/**
 * Markdown <-> rich-text document for the WYSIWYG note editor (TipTap / ProseMirror JSON).
 *
 * Stored notes stay Markdown and keep rendering with `marked` (breaks: true) + DOMPurify elsewhere in the app, so the
 * editor parses with the very same lexer. To keep the stored text byte-identical when a note is opened and saved
 * without changes, every top-level block remembers its exact source (`raw`) and the whitespace after it (`tail`):
 * a block whose content did not change is written back from its source; only blocks the user edited are serialised.
 *
 * Note layout (docs/mockups/notes-phone.html): the first line of the note is its title, shown as a 22 px heading.
 */

export type PMMark = { type: string; attrs?: Record<string, any> };
export type PMNode = { type: string; attrs?: Record<string, any>; content?: PMNode[]; text?: string; marks?: PMMark[] };

const LEX_OPTIONS = { gfm: true, breaks: true } as const;

/** Attributes that only carry source information; they are ignored when deciding whether a block changed. */
export const SOURCE_ATTRS = ['raw', 'tail', 'idx', 'prefix', 'absent', 'hasNl', 'lead', 'endNl', 'delim', 'kind', 'marker', 'fence', 'tight', 'count'];

// ---- inline: marked tokens -> PM nodes ---------------------------------------------------------------

const addMark = (nodes: PMNode[], mark: PMMark): PMNode[] =>
  nodes.map((n) => (n.type === 'text' || n.type === 'inlineRaw' ? { ...n, marks: [...(n.marks ?? []), mark] } : n));

/**
 * Inline source the editor does not model as text (images, a link around an image, inline HTML such as
 * `<del>...</del>`): one atom that is shown rendered (marked + DOMPurify, as the old app did) and written back as is.
 */
const inlineRaw = (md: string): PMNode => ({ type: 'inlineRaw', attrs: { md } });

const OPEN_TAG = /^<([A-Za-z][A-Za-z0-9-]*)(\s[^>]*)?>$/;
const VOID_TAGS = new Set(['br', 'img', 'hr', 'wbr', 'input', 'source', 'col', 'area', 'embed', 'meta', 'link', 'track', 'param', 'base']);

/**
 * The backend's xss() input filter stores every `<` / `>` as `&lt;` / `&gt;` (and marked hands out `\<` as `&lt;`).
 * The old app rendered notes as HTML, where these show as the characters; the editor shows text, so they are decoded
 * for display. Only text is decoded (never re-read as HTML) and each block keeps its stored source, so an unchanged
 * note is still written back byte for byte.
 */
export const decodeEntities = (s: string): string =>
  s.indexOf('&') < 0
    ? s
    : s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
        .replace(/&amp;/g, '&');

const textNodes = (text: string, marks?: PMMark[], decode = true): PMNode[] => {
  const out: PMNode[] = [];
  (decode ? decodeEntities(text) : text).split('\n').forEach((part, i) => {
    if (i > 0) out.push({ type: 'hardBreak' });
    if (part) out.push({ type: 'text', text: part, ...(marks?.length ? { marks } : {}) });
  });
  return out;
};

// Verbatim inline source is written back as it is, so it is shown as stored.
const verbatim = (raw: string): PMNode[] => textNodes(raw, [{ type: 'verbatim' }], false);

const inline = (tokens: Token[] | undefined): PMNode[] => {
  const out: PMNode[] = [];
  const list = tokens ?? [];
  for (let i = 0; i < list.length; i += 1) {
    const t = list[i];
    // An inline HTML element (`<del>text</del>`): its opening tag, content and closing tag become one atom.
    if (t.type === 'html') {
      const open = t.raw.match(OPEN_TAG);
      const tag = open?.[1]?.toLowerCase();
      if (tag && !VOID_TAGS.has(tag) && !t.raw.endsWith('/>')) {
        const close = list.findIndex((k, j) => j > i && k.type === 'html' && new RegExp(`^</${tag}\\s*>$`, 'i').test(k.raw));
        if (close > i) {
          out.push(inlineRaw(list.slice(i, close + 1).map((k) => k.raw).join('')));
          i = close;
          continue;
        }
      }
      out.push(inlineRaw(t.raw));
      continue;
    }
    switch (t.type) {
      case 'text':
        // A `text` token can hold nested inline tokens (e.g. in tight list items); otherwise it is a leaf.
        if ((t as Tokens.Text).tokens?.length) out.push(...inline((t as Tokens.Text).tokens));
        else out.push(...textNodes((t as Tokens.Text).text));
        break;
      case 'escape':
        out.push(...textNodes((t as Tokens.Escape).text));
        break;
      case 'br':
        out.push({ type: 'hardBreak' });
        break;
      case 'strong':
        out.push(...addMark(inline((t as Tokens.Strong).tokens), { type: 'bold', attrs: { delim: t.raw.slice(0, 2) } }));
        break;
      case 'em':
        out.push(...addMark(inline((t as Tokens.Em).tokens), { type: 'italic', attrs: { delim: t.raw.slice(0, 1) } }));
        break;
      case 'del':
        out.push(...addMark(inline((t as Tokens.Del).tokens), { type: 'strike' }));
        break;
      case 'codespan':
        out.push(...textNodes((t as Tokens.Codespan).text, [{ type: 'code' }]));
        break;
      case 'image':
        out.push(inlineRaw(t.raw));
        break;
      case 'link': {
        const l = t as Tokens.Link;
        if (l.tokens?.some((k) => k.type === 'image' || k.type === 'html')) {
          out.push(inlineRaw(t.raw)); // a linked image: rendered as one piece
          break;
        }
        const kind = t.raw.startsWith('<') ? 'angle' : t.raw.startsWith('[') ? 'inline' : 'bare';
        out.push(...addMark(inline(l.tokens), { type: 'link', attrs: { href: l.href, title: l.title ?? null, kind } }));
        break;
      }
      default:
        // Anything else: kept as literal text and written back exactly as it was.
        out.push(...verbatim(t.raw));
    }
  }
  return out;
};

// ---- blocks ------------------------------------------------------------------------------------------

const trailingNl = (s: string) => s.match(/\n*$/)?.[0] ?? '';
const stripNl = (s: string) => s.replace(/\n+$/, '');

const listMarker = (raw: string) => raw.match(/^\s*([-*+]|\d+[.)])/)?.[1] ?? '-';

/** `&gt; quote` (a blockquote whose `>` was escaped on save): the paragraph's source with the markers decoded. */
const ESCAPED_QUOTE = /^ {0,3}&gt;/;
const unescapeQuoteMarkers = (raw: string) => raw.replace(/^( {0,3})((?:&gt; ?)+)/gm, (_m, ind: string, marks: string) => ind + marks.replace(/&gt;/g, '>'));

const blockFromToken = (t: Token): PMNode | null => {
  switch (t.type) {
    case 'paragraph':
      if (ESCAPED_QUOTE.test(t.raw)) {
        const quote = marked.lexer(unescapeQuoteMarkers(t.raw), LEX_OPTIONS).find((k) => k.type === 'blockquote');
        if (quote) return blockFromToken(quote);
      }
      return { type: 'paragraph', content: inline((t as Tokens.Paragraph).tokens) };
    case 'text': // top-level text (rare)
      return { type: 'paragraph', content: inline((t as Tokens.Text).tokens ?? [{ type: 'text', raw: t.raw, text: (t as Tokens.Text).text } as Token]) };
    case 'heading': {
      const h = t as Tokens.Heading;
      if (!/^#{1,6}( |$)/.test(t.raw)) break; // setext headings: keep as raw text
      return { type: 'heading', attrs: { level: h.depth }, content: inline(h.tokens) };
    }
    case 'code': {
      const c = t as Tokens.Code;
      const fence = t.raw.match(/^ {0,3}(`{3,}|~{3,})/)?.[1] ?? null;
      if (!fence) break; // indented code: keep as raw text
      const code = decodeEntities(c.text);
      return { type: 'codeBlock', attrs: { language: c.lang || null, fence }, content: code ? [{ type: 'text', text: code }] : [] };
    }
    case 'list': {
      const l = t as Tokens.List;
      if (l.items.some((i) => i.task)) break; // task lists: keep as raw text
      const items: PMNode[] = l.items.map((it) => {
        const blocks = it.tokens
          .filter((k) => k.type !== 'space')
          .map((k) => (k.type === 'text' ? { type: 'paragraph', content: inline((k as Tokens.Text).tokens ?? []) } : blockFromToken(k)))
          .filter(Boolean) as PMNode[];
        if (!blocks.length || blocks[0].type !== 'paragraph') blocks.unshift({ type: 'paragraph', content: [] });
        return { type: 'listItem', content: blocks };
      });
      const marker = listMarker(l.items[0]?.raw ?? '');
      return l.ordered
        ? { type: 'orderedList', attrs: { start: typeof l.start === 'number' ? l.start : 1, marker, tight: !l.loose }, content: items }
        : { type: 'bulletList', attrs: { marker, tight: !l.loose }, content: items };
    }
    case 'blockquote':
      return { type: 'blockquote', content: (t as Tokens.Blockquote).tokens.filter((k) => k.type !== 'space').map((k) => blockFromToken(k) ?? rawBlock(k.raw)) };
    case 'hr':
      return { type: 'horizontalRule', attrs: { marker: stripNl(t.raw).trim() } };
    default:
      break;
  }
  return null;
};

const rawBlock = (raw: string): PMNode => {
  const text = decodeEntities(stripNl(raw));
  return { type: 'rawBlock', content: text ? [{ type: 'text', text }] : [] };
};

/** Top-level blocks of a Markdown string, each with its exact source; whitespace goes into the previous block's `tail`. */
const blocks = (src: string, withSource = false): PMNode[] => {
  const tokens = marked.lexer(src, LEX_OPTIONS);
  const out: PMNode[] = [];
  let lead = '';
  tokens.forEach((t) => {
    if (t.type === 'space') {
      if (out.length) {
        const last = out[out.length - 1];
        if (withSource) last.attrs = { ...last.attrs, tail: (last.attrs?.tail ?? '') + t.raw };
      } else lead += t.raw;
      return;
    }
    const node = blockFromToken(t) ?? rawBlock(t.raw);
    if (withSource) node.attrs = { ...node.attrs, raw: t.raw, tail: '', idx: out.length };
    out.push(node);
  });
  if (withSource) (out as any).lead = lead;
  return out;
};

// ---- note document -----------------------------------------------------------------------------------

/**
 * Parses a stored note into the editor document: `title` (the first line) followed by the body blocks.
 * When the note starts with something that is not text (a code fence, a list, raw HTML...), there is no title line:
 * the title stays empty (`absent`) and writes nothing back until the user types one.
 */
export const markdownToDoc = (md: string): PMNode => {
  const first = marked.lexer(md, LEX_OPTIONS).find((t) => t.type !== 'space');
  const leadingBlank = /^\s*\n/.test(md) && md.trim() !== '';
  const titled = !leadingBlank && (md === '' || (!!first && (first.type === 'paragraph' || (first.type === 'heading' && /^#{1,6} /.test(first.raw)))));

  let title: PMNode;
  let rest: string;
  let hasNl = false;
  if (titled) {
    const nl = md.indexOf('\n');
    const line = nl < 0 ? md : md.slice(0, nl);
    hasNl = nl >= 0;
    rest = nl < 0 ? '' : md.slice(nl + 1);
    const prefix = line.match(/^#{1,6} +/)?.[0] ?? '';
    const lineTokens = marked.lexer(line.slice(prefix.length), LEX_OPTIONS);
    const para = lineTokens.find((t) => t.type === 'paragraph') as Tokens.Paragraph | undefined;
    title = { type: 'title', attrs: { raw: line, prefix, absent: false }, content: para ? inline(para.tokens) : [] };
  } else {
    title = { type: 'title', attrs: { raw: '', prefix: '', absent: true }, content: [] };
    rest = md;
  }
  const body = blocks(rest, true);
  // Document-level source facts live on the title node (the doc node itself has no attributes).
  title.attrs = { ...title.attrs, hasNl, lead: (body as any).lead ?? '', count: body.length };
  return { type: 'doc', content: [title, ...(body.length ? body : [{ type: 'paragraph', content: [] }])] };
};

// ---- serialising -------------------------------------------------------------------------------------

/** The comparable part of a node: content and non-source attributes, adjacent text runs merged. */
export const canon = (n: PMNode): any => {
  const attrs: Record<string, any> = {};
  Object.entries(n.attrs ?? {}).forEach(([k, v]) => {
    if (!SOURCE_ATTRS.includes(k) && v !== null && v !== undefined) attrs[k] = v;
  });
  const marks = (n.marks ?? [])
    .map((m) => ({ type: m.type, ...(m.type === 'link' ? { href: m.attrs?.href } : {}) }))
    .sort((a, b) => a.type.localeCompare(b.type));
  const content: any[] = [];
  (n.content ?? []).forEach((c) => {
    const cc = canon(c);
    const prev = content[content.length - 1];
    if (prev && prev.type === 'text' && cc.type === 'text' && JSON.stringify(prev.marks) === JSON.stringify(cc.marks)) prev.text += cc.text;
    else content.push(cc);
  });
  return { type: n.type, ...(Object.keys(attrs).length ? { attrs } : {}), ...(n.text !== undefined ? { text: n.text } : {}), ...(marks.length ? { marks } : {}), ...(content.length ? { content } : {}) };
};

/** Signatures of the document as the editor holds it right after loading: `idx` -> canonical JSON. */
export type Baseline = { title: string; blocks: Map<number, string> };
export const baselineOf = (doc: PMNode): Baseline => {
  const [title, ...rest] = doc.content ?? [];
  const map = new Map<number, string>();
  rest.forEach((b) => {
    if (typeof b.attrs?.idx === 'number') map.set(b.attrs.idx, JSON.stringify(canon(b)));
  });
  return { title: JSON.stringify(canon(title ?? { type: 'title' })), blocks: map };
};

const escapeText = (s: string, atLineStart: boolean): string => {
  let out = s
    .replace(/\\/g, '\\\\')
    .replace(/([*`[\]])/g, '\\$1')
    .replace(/(^|[^A-Za-z0-9])_|_(?=[^A-Za-z0-9]|$)/g, (m) => m.replace('_', '\\_'))
    .replace(/<(?=[A-Za-z/!?])/g, '\\<')
    .replace(/~~/g, '\\~\\~');
  if (atLineStart) out = out.replace(/^(\s*)(#{1,6}(?= |$)|>|[-+](?= )|\d+(?=[.)] ))/, (m, sp, mk) => `${sp}\\${mk}`);
  return out;
};

const MARK_ORDER = ['link', 'bold', 'italic', 'strike', 'code', 'verbatim'];
const openMark = (m: PMMark): string => {
  switch (m.type) {
    case 'bold':
      return m.attrs?.delim || '**';
    case 'italic':
      return m.attrs?.delim || '*';
    case 'strike':
      return '~~';
    case 'link':
      return m.attrs?.kind === 'bare' ? '' : m.attrs?.kind === 'angle' ? '<' : '[';
    default:
      return '';
  }
};
const closeMark = (m: PMMark): string => {
  switch (m.type) {
    case 'bold':
      return m.attrs?.delim || '**';
    case 'italic':
      return m.attrs?.delim || '*';
    case 'strike':
      return '~~';
    case 'link': {
      if (m.attrs?.kind === 'bare') return '';
      if (m.attrs?.kind === 'angle') return '>';
      const title = m.attrs?.title ? ` "${String(m.attrs.title).replace(/"/g, '\\"')}"` : '';
      return `](${m.attrs?.href ?? ''}${title})`;
    }
    default:
      return '';
  }
};

/** Inline content (text with marks, hard breaks) -> Markdown, `breaks: true` style (a hard break is a single newline). */
export const inlineToMarkdown = (nodes: PMNode[] = []): string => {
  let out = '';
  let active: PMMark[] = [];
  const key = (m: PMMark) => m.type + JSON.stringify(m.attrs ?? {});
  const closeTo = (keep: number) => {
    while (active.length > keep) out += closeMark(active.pop()!);
  };
  nodes.forEach((n) => {
    if (n.type === 'hardBreak') {
      closeTo(0);
      out += '\n';
      return;
    }
    if (n.type !== 'text' && n.type !== 'inlineRaw') return;
    const marks = [...(n.marks ?? [])]
      .filter((m) => m.type !== 'code' && m.type !== 'verbatim')
      .sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
    let same = 0;
    while (same < active.length && same < marks.length && key(active[same]) === key(marks[same])) same += 1;
    closeTo(same);
    marks.slice(same).forEach((m) => {
      out += openMark(m);
      active.push(m);
    });
    if (n.type === 'inlineRaw') {
      out += n.attrs?.md ?? '';
      return;
    }
    const text = n.text ?? '';
    const isCode = n.marks?.some((m) => m.type === 'code');
    const isVerbatim = n.marks?.some((m) => m.type === 'verbatim');
    const bare = active.some((m) => m.type === 'link' && m.attrs?.kind !== 'inline');
    if (isCode) {
      const run = Math.max(0, ...(text.match(/`+/g) ?? []).map((r) => r.length));
      const fence = '`'.repeat(run + 1);
      const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
      out += `${fence}${pad}${text}${pad}${fence}`;
    } else if (isVerbatim || bare) out += text;
    else out += escapeText(text, out === '' || out.endsWith('\n'));
  });
  closeTo(0);
  return out;
};

const indent = (s: string, pad: string) => s.split('\n').map((l, i) => (i === 0 || l === '' ? l : pad + l)).join('\n');

/** One block (and its children) -> Markdown, without trailing newlines. */
export const blockToMarkdown = (n: PMNode): string => {
  switch (n.type) {
    case 'paragraph':
      return inlineToMarkdown(n.content);
    case 'heading':
      return `${'#'.repeat(n.attrs?.level ?? 1)} ${inlineToMarkdown(n.content)}`;
    case 'codeBlock': {
      const text = (n.content ?? []).map((c) => c.text ?? '').join('');
      const longest = Math.max(0, ...(text.match(/^`{3,}/gm) ?? []).map((r) => r.length));
      const fence = n.attrs?.fence && n.attrs.fence.length > longest ? n.attrs.fence : '`'.repeat(Math.max(3, longest + 1));
      return `${fence}${n.attrs?.language ?? ''}\n${text}\n${fence}`;
    }
    case 'bulletList':
    case 'orderedList': {
      const ordered = n.type === 'orderedList';
      const delim = ordered ? (String(n.attrs?.marker ?? '1.').endsWith(')') ? ')' : '.') : '';
      const start = ordered ? Number(n.attrs?.start ?? 1) : 0;
      const sep = n.attrs?.tight === false ? '\n\n' : '\n';
      return (n.content ?? [])
        .map((item, i) => {
          const marker = ordered ? `${start + i}${delim}` : n.attrs?.marker || '-';
          const pad = ' '.repeat(marker.length + 1);
          const inner = (item.content ?? []).map(blockToMarkdown).join(n.attrs?.tight === false ? '\n\n' : '\n');
          return `${marker} ${indent(inner, pad)}`;
        })
        .join(sep);
    }
    case 'blockquote':
      return (n.content ?? [])
        .map(blockToMarkdown)
        .join('\n\n')
        .split('\n')
        .map((l) => (l ? `> ${l}` : '>'))
        .join('\n');
    case 'horizontalRule':
      return n.attrs?.marker || '---';
    case 'rawBlock':
      return (n.content ?? []).map((c) => c.text ?? '').join('');
    default:
      return inlineToMarkdown(n.content);
  }
};

/**
 * Editor document -> stored Markdown. With a `baseline` (taken right after loading), blocks that did not change are
 * written from their original source, so a note saved without changes is byte-identical. Without one, everything is
 * serialised (used to report which constructs would be normalised once edited).
 */
export const docToMarkdown = (doc: PMNode, baseline?: Baseline): string => {
  const [title, ...body] = doc.content ?? [];
  const dAttrs = title?.attrs ?? {};
  const unchanged = (b: PMNode) =>
    !!baseline && typeof b.attrs?.idx === 'number' && b.attrs?.raw != null && baseline.blocks.get(b.attrs.idx) === JSON.stringify(canon(b));

  // Title line
  let titleMd = '';
  const titleSame = !!baseline && baseline.title === JSON.stringify(canon(title ?? { type: 'title' }));
  if (title && titleSame && title.attrs?.raw != null) titleMd = title.attrs.raw;
  else if (title && (title.content?.length || !title.attrs?.absent)) titleMd = (title.attrs?.prefix ?? '') + inlineToMarkdown(title.content).replace(/\n/g, ' ');

  // Body: an empty trailing paragraph the editor adds for an empty body writes nothing.
  const isEmptyPara = (b: PMNode) => b.type === 'paragraph' && !(b.content ?? []).length && b.attrs?.raw == null;
  const parts = body.filter((b, i) => !(isEmptyPara(b) && body.slice(i).every(isEmptyPara)));

  let out = '';
  let prevIdx: number | null = null;
  parts.forEach((b, i) => {
    const idx = typeof b.attrs?.idx === 'number' ? b.attrs.idx : null;
    const adjacent = idx !== null && prevIdx !== null && idx === prevIdx + 1;
    if (i > 0 && !adjacent) out = out.replace(/\n*$/, '\n\n');
    if (unchanged(b)) out += b.attrs!.raw + (b.attrs!.tail ?? '');
    else if (b.attrs?.raw != null) out += blockToMarkdown(b) + trailingNl(b.attrs.raw) + (b.attrs.tail ?? '');
    else out += blockToMarkdown(b);
    prevIdx = idx;
  });
  const lastOriginal = parts.length > 0 && parts[parts.length - 1].attrs?.idx === (dAttrs.count ?? 0) - 1;
  if (!lastOriginal) out = out.replace(/\n*$/, '');

  const lead = parts.length && parts[0].attrs?.idx === 0 ? (dAttrs.lead ?? '') : '';
  if (title?.attrs?.absent && !titleMd) return lead + out;
  if (!parts.length) return titleMd + (dAttrs.hasNl && titleSame && body.length && (dAttrs.count ?? 0) === 0 ? '\n' : '');
  const join = dAttrs.hasNl && parts[0].attrs?.idx === 0 ? `\n${lead}` : '\n\n';
  return titleMd + join + out;
};
