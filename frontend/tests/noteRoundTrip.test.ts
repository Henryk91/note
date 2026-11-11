/**
 * @jest-environment jsdom
 */
// The global test setup stubs `marked`; the editor must use the real lexer.
jest.mock('marked', () => jest.requireActual('../node_modules/marked/lib/marked.umd.js'));
import { Editor } from '@tiptap/core';
import { noteExtensions } from '../src/features/notes/editor/extensions';
import fs from 'fs';
import path from 'path';
import { baselineOf, docToMarkdown, markdownToDoc } from '../src/features/notes/editor/noteMarkdown';

// ui-review "Notes: WYSIWYG requirements": load every seeded note into the rich-text editor, save it without changes,
// and the stored Markdown must be byte-identical. `seed-notes.json` holds every distinct NOTE text created by
// backend/scripts/seed-dev.ts and seed-mockup.ts (dumped from the local dev database).

const seedNotes: string[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed-notes.json'), 'utf8'));

// Constructs named in the review that the seeds may not all contain.
const EXTRA = [
  'Title\nline one\nline two',
  '#### Small heading\n\nText under it',
  'Links\n\nhttps://example.com/bare and [named](https://example.com/x "T")',
  'Steps\n\n1. one\n2. two\n10. ten',
  'Mixed\n\n- a\n  - nested b\n- c\n\n> quoted\n> more\n\n---\n\n~~~js\nconst x = 1;\n~~~',
  'Trailing newline\n',
  'Spaces  \nhard break with two spaces',
  'Html block\n\n<div>\n<b>x</b>\n</div>\n\n| a | b |\n|---|---|\n| 1 | 2 |',
  '',
  '\n\nStarts with blank lines',
  '- list first\n- second',
  '```\ncode first\n```',
  'Escapes \\* and \\_ and a_b_c and <not html',
  // Stored through the backend's xss() filter: < and > arrive as &lt; / &gt;.
  'Markdown Code\n\n```\n# H1\n&gt; blockquote\nif (a &lt; b &amp;&amp; c &gt; d) {}\n```\n\n    &lt;h1&gt; Hello, world!&lt;/h1&gt;\n\n---',
  'Quotes\n\n&gt; quoted after the filter\n&gt; second line\n\nx -&gt; y and `a &gt; b` inline',
];

const load = (md: string) => {
  const editor = new Editor({ extensions: noteExtensions(), content: markdownToDoc(md) as any });
  const json = editor.getJSON() as any;
  return { editor, json, baseline: baselineOf(json) };
};

describe('note editor Markdown round trip', () => {
  test('the fixture holds the seeded notes', () => {
    expect(seedNotes.length).toBeGreaterThan(20);
  });

  test.each([...(seedNotes as string[]), ...EXTRA].map((s) => [JSON.stringify(s).slice(0, 60), s]))(
    'opened and saved unchanged is byte-identical: %s',
    (_label, md) => {
      const { editor, json, baseline } = load(md as string);
      expect(docToMarkdown(json, baseline)).toBe(md);
      editor.destroy();
    },
  );

  test('text stored with &lt; / &gt; (backend xss filter) shows the characters: code, inline code, text, quote markers', () => {
    const { editor } = load(EXTRA[EXTRA.length - 2]);
    const pre = editor.state.doc.child(1);
    expect(pre.type.name).toBe('codeBlock');
    expect(pre.textContent).toBe('# H1\n> blockquote\nif (a < b && c > d) {}');
    const raw = editor.state.doc.child(2);
    expect(raw.textContent).toContain('<h1> Hello, world!</h1>');
    editor.destroy();
    const q = load(EXTRA[EXTRA.length - 1]).editor;
    expect(q.state.doc.child(1).type.name).toBe('blockquote');
    // the two quoted lines are joined by a hard break (breaks: true), which has no text
    expect(q.state.doc.child(1).textContent).toBe('quoted after the filtersecond line');
    expect(q.state.doc.child(2).textContent).toBe('x -> y and a > b inline');
    q.destroy();
  });

  test('editing a code block stored with &gt; saves the real characters', () => {
    const md = 'Code\n\n```\na &gt; b\n```';
    const { editor, baseline } = load(md);
    let end = 0;
    editor.state.doc.forEach((node, offset, index) => {
      if (index === 1) end = offset + node.nodeSize - 1;
    });
    editor.commands.setTextSelection(end);
    editor.commands.insertContent(' c');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe('Code\n\n```\na > b c\n```');
    editor.destroy();
  });

  test('an edit changes only the edited block; the rest keeps its exact source', () => {
    const md = 'Human Flag\n1. Grip straight arm\n2. Flag bounce\n\n[youtube.com/watch?v=bG0h7bSfxQI](https://www.youtube.com/watch?v=bG0h7bSfxQI)';
    const { editor, baseline } = load(md);
    // type at the end of the title
    editor.commands.setTextSelection(1 + 'Human Flag'.length);
    editor.commands.insertContent(' 2');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe(md.replace('Human Flag', 'Human Flag 2'));
    editor.destroy();
  });

  test('typing into a body paragraph serialises that paragraph with marks kept', () => {
    const md = 'General core\n\nWindshield wipers, **dead bug** x 10.\n\nSee [guide](https://example.com/core).';
    const { editor, baseline } = load(md);
    const json = editor.getJSON() as any;
    // position at the end of the second block ("Windshield ... x 10.")
    let pos = 0;
    editor.state.doc.forEach((node, offset, index) => {
      if (index === 1) pos = offset + node.nodeSize - 1;
    });
    editor.commands.setTextSelection(pos);
    editor.commands.insertContent(' Then rest.');
    expect(json).toBeTruthy();
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe(
      'General core\n\nWindshield wipers, **dead bug** x 10. Then rest.\n\nSee [guide](https://example.com/core).',
    );
    editor.destroy();
  });

  test('typed Markdown characters are escaped (WYSIWYG: what you type is text)', () => {
    const { editor, baseline } = load('');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('A *star* note');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe('A \\*star\\* note');
    editor.destroy();
  });

  test('Enter in the title starts the body', () => {
    const { editor, baseline } = load('');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('Groceries');
    editor.commands.keyboardShortcut('Enter');
    editor.commands.insertContent('milk');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe('Groceries\n\nmilk');
    editor.destroy();
  });

  // Report, not a gate: which seeded notes would be written differently if every block were re-serialised
  // (i.e. what normalising an edited block can change). Recorded in docs/progress.md.
  test('full re-serialisation report', () => {
    const changed = [...(seedNotes as string[]), ...EXTRA].filter((md) => {
      const { editor, json } = load(md);
      const out = docToMarkdown(json);
      editor.destroy();
      return out !== md;
    });
    // eslint-disable-next-line no-console
    console.log(`re-serialised differently: ${changed.length}\n${changed.map((c) => JSON.stringify(c)).join('\n')}`);
    expect(Array.isArray(changed)).toBe(true);
  });
});
