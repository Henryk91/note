import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import CodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import { renderInlineMarkdownHtml, renderMarkdownHtml } from '../../../shared/utils/markdown';
import { decodeEntities } from './noteMarkdown';

/** Source-only attributes: never rendered, never copied onto a block created by pressing Enter. */
const src = (names: string[]) =>
  Object.fromEntries(names.map((n) => [n, { default: null, rendered: false, keepOnSplit: false }]));
const BLOCK_SRC = ['raw', 'tail', 'idx'];

/** The note's first line, shown as its title (22 px / 600). Enter moves on to the body. */
export const Title = Node.create({
  name: 'title',
  content: 'inline*',
  marks: '_',
  defining: true,
  addAttributes: () => src(['raw', 'prefix', 'absent', 'hasNl', 'lead', 'count']),
  parseHTML: () => [{ tag: 'h1.note-title' }],
  renderHTML: ({ HTMLAttributes }) => ['h1', mergeAttributes(HTMLAttributes, { class: 'note-title' }), 0],
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state, view } = editor;
        if (state.selection.$from.parent.type.name !== 'title') return false;
        const tr = state.tr;
        if (!state.selection.empty) tr.deleteSelection();
        tr.split(tr.selection.from, 1, [{ type: state.schema.nodes.paragraph }]);
        view.dispatch(tr.scrollIntoView());
        return true;
      },
    };
  },
});

/** Opens a link from rendered note HTML in a new tab (only http(s), mailto and relative links). */
const openLink = (a: HTMLAnchorElement) => {
  const href = a.getAttribute('href') ?? '';
  if (/^(https?:|mailto:|\/|#)/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
};

/**
 * A block the editor does not model (task lists, tables, raw HTML, indented code...): written back verbatim.
 * Shown rendered with the same renderer as the old app (marked + DOMPurify) and switches to its Markdown source while
 * the cursor is in it, so it can still be edited.
 */
export const RawBlock = Node.create({
  name: 'rawBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  addAttributes: () => src(BLOCK_SRC),
  parseHTML: () => [{ tag: 'div.note-raw', preserveWhitespace: 'full' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { class: 'note-raw' }), 0],
  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node;
      const dom = document.createElement('div');
      dom.className = 'note-raw';
      const preview = document.createElement('div');
      preview.className = 'note-raw-preview';
      preview.contentEditable = 'false';
      const source = document.createElement('div');
      source.className = 'note-raw-src';
      dom.append(preview, source);

      const render = () => {
        const text = current.textContent;
        const raw = current.attrs.raw as string | null;
        // Unchanged: render the stored source exactly as the old app did; edited: render what is there now.
        const md = raw != null && decodeEntities(raw.replace(/\n+$/, '')) === text ? raw : text;
        preview.innerHTML = md.trim() ? renderMarkdownHtml(md) : '';
        dom.classList.toggle('is-blank', !md.trim());
      };
      const sync = () => {
        const pos = typeof getPos === 'function' ? getPos() : null;
        const { from, to } = editor.state.selection;
        const inside = typeof pos === 'number' && editor.isFocused && from > pos && to < pos + current.nodeSize;
        dom.classList.toggle('is-editing', inside);
      };
      const onDown = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest('a');
        e.preventDefault();
        if (a) {
          openLink(a as HTMLAnchorElement);
          return;
        }
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (typeof pos === 'number') editor.chain().focus().setTextSelection(pos + 1 + current.content.size).run();
      };
      preview.addEventListener('mousedown', onDown);
      editor.on('selectionUpdate', sync);
      editor.on('focus', sync);
      editor.on('blur', sync);
      render();
      sync();
      return {
        dom,
        contentDOM: source,
        update: (n) => {
          if (n.type !== current.type) return false;
          current = n;
          render();
          sync();
          return true;
        },
        ignoreMutation: (m) => preview.contains(m.target as globalThis.Node),
        stopEvent: (e) => preview.contains(e.target as globalThis.Node),
        destroy: () => {
          preview.removeEventListener('mousedown', onDown);
          editor.off('selectionUpdate', sync);
          editor.off('focus', sync);
          editor.off('blur', sync);
        },
      };
    };
  },
});

/** Inline Markdown the editor does not model as text (an image, a linked image, `<del>...</del>`): shown rendered,
 *  written back exactly as stored. It can be selected and deleted like a character. */
export const InlineRaw = Node.create({
  name: 'inlineRaw',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ md: { default: '', rendered: false } }),
  parseHTML: () => [{ tag: 'span.note-inline-raw' }],
  renderHTML: () => ['span', { class: 'note-inline-raw' }],
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'note-inline-raw';
      dom.contentEditable = 'false';
      dom.innerHTML = renderInlineMarkdownHtml(node.attrs.md);
      dom.addEventListener('click', (e) => {
        const a = (e.target as HTMLElement).closest('a');
        if (a) {
          e.preventDefault();
          openLink(a as HTMLAnchorElement);
        }
      });
      return { dom };
    };
  },
});

/** Inline source kept as literal text (raw HTML, images): not escaped when written back. */
export const Verbatim = Mark.create({
  name: 'verbatim',
  excludes: '_',
  parseHTML: () => [{ tag: 'span.note-verbatim' }],
  renderHTML: () => ['span', { class: 'note-verbatim' }, 0],
});

const withSrc = <T extends { extend: (c: any) => any }>(ext: T, names: string[]) =>
  ext.extend({
    addAttributes(this: any) {
      return { ...(this.parent?.() ?? {}), ...src(names) };
    },
  });

/** Everything the note editor needs. `marked` reads and writes the stored Markdown (see noteMarkdown.ts). */
export const noteExtensions = (opts: { placeholderTitle?: string } = {}) => [
  StarterKit.configure({
    document: false,
    paragraph: false,
    heading: false,
    codeBlock: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    horizontalRule: false,
    bold: false,
    italic: false,
    dropcursor: false,
    gapcursor: false,
  }),
  Document.extend({ content: 'title block+' }),
  withSrc(Paragraph, BLOCK_SRC),
  withSrc(Heading, BLOCK_SRC),
  withSrc(CodeBlock, [...BLOCK_SRC, 'fence']),
  withSrc(BulletList, [...BLOCK_SRC, 'marker', 'tight']),
  withSrc(OrderedList, [...BLOCK_SRC, 'marker', 'tight']),
  withSrc(Blockquote, BLOCK_SRC),
  withSrc(HorizontalRule, [...BLOCK_SRC, 'marker']),
  withSrc(Bold, ['delim']),
  withSrc(Italic, ['delim']),
  Link.extend({
    addAttributes(this: any) {
      return { ...(this.parent?.() ?? {}), title: { default: null }, ...src(['kind']) };
    },
  }).configure({ openOnClick: false, autolink: false, linkOnPaste: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
  Title,
  RawBlock,
  InlineRaw,
  Verbatim,
  Extension.create({ name: 'notePlaceholderTitle', addStorage: () => ({ title: opts.placeholderTitle ?? 'Title' }) }),
];
