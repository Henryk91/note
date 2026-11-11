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

/** A block kept exactly as written (raw HTML, tables, indented code...): shown as plain text, written back verbatim. */
export const RawBlock = Node.create({
  name: 'rawBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  addAttributes: () => src(BLOCK_SRC),
  parseHTML: () => [{ tag: 'div.note-raw', preserveWhitespace: 'full' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { class: 'note-raw' }), 0],
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
  Verbatim,
  Extension.create({ name: 'notePlaceholderTitle', addStorage: () => ({ title: opts.placeholderTitle ?? 'Title' }) }),
];
