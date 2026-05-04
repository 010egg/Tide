import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeStringify from 'rehype-stringify';

let rehypeKatex: any = null;
let rehypeMermaid: any = null;

async function ensurePlugins() {
  if (!rehypeKatex) {
    rehypeKatex = (await import('rehype-katex')).default;
  }
  if (!rehypeMermaid) {
    rehypeMermaid = (await import('rehype-mermaid')).default;
  }
}

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    await ensurePlugins();

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(rehypeKatex)
      .use(rehypeMermaid, { strategy: 'img-svg' })
      .use(rehypeStringify)
      .process(markdown);

    return String(result);
  } catch {
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const previewThemeCss = `
  :root {
    --bg: #ffffff;
    --text: #1a1a1a;
    --text-secondary: #555;
    --text-tertiary: #888;
    --border: #e8e5de;
    --accent: #534AB7;
  }
  [data-theme="dark"] {
    --bg: #1e1e1e;
    --text: #cccccc;
    --text-secondary: #999;
    --text-tertiary: #888;
    --border: #3e3e3e;
    --accent: #7F77DD;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    line-height: 1.8;
    color: var(--text);
    background: var(--bg);
    padding: 18px 22px;
    max-width: 800px;
  }
  h1 { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 500; margin: 16px 0 6px; }
  h3 { font-size: 13px; font-weight: 500; margin: 12px 0 4px; }
  p { margin-bottom: 10px; }
  ul, ol { padding-left: 16px; margin-bottom: 10px; }
  li { margin-bottom: 2px; }
  blockquote {
    border-left: 3px solid var(--border);
    padding: 4px 14px;
    color: var(--text-secondary);
    font-style: italic;
    margin-bottom: 10px;
  }
  code {
    background: #f5f4f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 11px;
  }
  pre {
    background: #1F1F1F;
    color: #E8E8E8;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 10px;
  }
  pre code { background: none; padding: 0; }
  table {
    width: 100%;
    font-size: 11px;
    border-collapse: collapse;
    border: 0.5px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
    margin-bottom: 10px;
  }
  th { background: #f5f4f0; padding: 5px 8px; border-bottom: 0.5px solid var(--border); text-align: left; }
  td { padding: 5px 8px; border-bottom: 0.5px solid #f5f4f0; }
  img { max-width: 100%; border-radius: 4px; }
  a { color: var(--accent); }
  .katex { font-size: 1.1em; }
  .task-list-item { list-style: none; }
  .task-list-item input { margin-right: 6px; }
`;
