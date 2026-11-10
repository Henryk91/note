// The global setup mocks `marked` (the package is ESM only). Use the real UMD build here.
jest.mock('marked', () => jest.requireActual('../node_modules/marked/lib/marked.umd.js'));

import { renderMarkdownHtml } from '../src/shared/utils/markdown';

describe('renderMarkdownHtml', () => {
  test('keeps Markdown rendering with single line breaks, lists, headings and links', () => {
    const html = renderMarkdownHtml('#### Title\n\n1. one\n2. two\n\nline a\nline b\n\n[x](https://example.com)');
    expect(html).toContain('<h4>Title</h4>');
    expect(html).toContain('<ol>');
    expect(html).toContain('line a<br>line b');
    expect(html).toContain('<a href="https://example.com">x</a>');
  });

  test('strips script-capable HTML', () => {
    const html = renderMarkdownHtml(
      'Referer: <img src=x onerror=alert(1)>\n<script>alert(2)</script>\n<a href="javascript:alert(3)">x</a>',
    );
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).toContain('Referer:');
  });
});
