/**
 * @jest-environment jsdom
 */
// The global test setup stubs `marked`; the editor and the renderer must use the real one.
jest.mock('marked', () => jest.requireActual('../node_modules/marked/lib/marked.umd.js'));
import { Editor } from '@tiptap/core';
import { noteExtensions } from '../src/features/notes/editor/extensions';
import { baselineOf, docToMarkdown, markdownToDoc } from '../src/features/notes/editor/noteMarkdown';

// Henry's "Markdown Show" note: images, linked images, inline HTML, task lists and tables showed as raw source in the
// editor. They now render as the old app rendered them (marked + DOMPurify) and are still written back byte for byte.
const MD = [
  'Markdown Show',
  '',
  '[Lipsum Pics](https://picsum.photos/)',
  '',
  '![alt text](https://picsum.photos/200/200/?random)',
  '',
  '[![Everything Is AWESOME](https://img.youtube.com/vi/StTqXEQ2l-Y/0.jpg)](https://www.youtube.com/watch?v=StTqXEQ2l-Y)',
  '',
  'Lorem **bold** and <del>Morbi a mi risus</del>. Vestibulum <br> end.',
  '',
  '- [ ] task open',
  '- [x] task done',
  '',
  '| a | b |',
  '|---|---|',
  '| 1 | 2 |',
].join('\n');

const load = (md: string) => {
  const editor = new Editor({ extensions: noteExtensions(), content: markdownToDoc(md) as any });
  return { editor, baseline: baselineOf(editor.getJSON() as any) };
};

describe('Markdown the editor does not model is shown rendered', () => {
  test('images, linked images and inline HTML are atoms with their exact source', () => {
    const doc = markdownToDoc(MD) as any;
    const atoms = JSON.stringify(doc).match(/"type":"inlineRaw","attrs":\{"md":"[^"\\]*(?:\\.[^"\\]*)*"\}/g) ?? [];
    expect(atoms.map((a) => JSON.parse(`{${a}}`).attrs.md)).toEqual([
      '![alt text](https://picsum.photos/200/200/?random)',
      '[![Everything Is AWESOME](https://img.youtube.com/vi/StTqXEQ2l-Y/0.jpg)](https://www.youtube.com/watch?v=StTqXEQ2l-Y)',
      '<del>Morbi a mi risus</del>',
      '<br>',
    ]);
  });

  test('rendered in the editor: image, linked image, strikethrough, task list and table', () => {
    const { editor } = load(MD);
    const el = editor.view.dom as HTMLElement;
    expect(el.querySelectorAll('.note-inline-raw img').length).toBe(2);
    expect(el.querySelector('.note-inline-raw a img')).toBeTruthy();
    expect(el.querySelector('.note-inline-raw del')?.textContent).toBe('Morbi a mi risus');
    expect(el.querySelectorAll('.note-raw-preview input[type=checkbox]').length).toBe(2);
    expect(el.querySelector('.note-raw-preview table td')?.textContent).toBe('1');
    editor.destroy();
  });

  test('scripts in raw HTML are removed (DOMPurify)', () => {
    const { editor } = load('X\n\n<img src=x onerror=alert(1)> and <b onclick="alert(1)">b</b>');
    const html = (editor.view.dom as HTMLElement).innerHTML;
    expect(html).not.toMatch(/onerror|onclick/);
    editor.destroy();
  });

  test('saved unchanged: byte-identical', () => {
    const { editor, baseline } = load(MD);
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe(MD);
    editor.destroy();
  });

  test('editing text next to an image keeps the image source exactly', () => {
    const md = 'Pics\n\nSee ![cat](https://x.test/c.png) here';
    const { editor, baseline } = load(md);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent('!');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe('Pics\n\nSee ![cat](https://x.test/c.png) here!');
    editor.destroy();
  });

  test('an image inside bold keeps its bold markers when the paragraph is re-written', () => {
    const md = 'T\n\nA **big ![i](https://x.test/i.png)** b';
    const { editor, baseline } = load(md);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent('c');
    expect(docToMarkdown(editor.getJSON() as any, baseline)).toBe('T\n\nA **big ![i](https://x.test/i.png)** bc');
    editor.destroy();
  });
});
