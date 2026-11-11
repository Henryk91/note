import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
});

/**
 * Renders Markdown exactly as before (marked, breaks: true) and sanitises the HTML before it reaches
 * dangerouslySetInnerHTML. Site Track entries are written by an unauthenticated endpoint, so raw HTML such as
 * `<img src=x onerror=alert(1)>` must never be trusted.
 */
export const renderMarkdownHtml = (input: string): string => {
  const raw = marked.parse(input ?? '', { async: false }) as string;
  return DOMPurify.sanitize(raw);
};

export const getMarkdownText = (input: string) => ({ __html: renderMarkdownHtml(input) });
