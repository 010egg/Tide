import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../store/document';
import { useSettingsStore } from '../store/settings';
import { markdownToHtml, previewThemeCss } from './pipeline';
import './HtmlPreview.css';

function HtmlPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const content = useDocumentStore((s) => s.content);
  const theme = useSettingsStore((s) => s.theme);
  const [mode, setMode] = useState<'preview' | 'source'>('preview');

  useEffect(() => {
    if (!iframeRef.current || mode !== 'preview') return;
    let cancelled = false;

    async function update() {
      if (!content) {
        if (!cancelled && iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.body.innerHTML =
              '<p style="color:#bbb;text-align:center;padding:40px;">预览内容将显示在这里</p>';
          }
        }
        return;
      }

      try {
        const html = await markdownToHtml(content);
        if (!cancelled && iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(
              `<!DOCTYPE html><html data-theme="${theme}"><head><style>${previewThemeCss}</style></head><body>${html}</body></html>`
            );
            doc.close();
          }
        }
      } catch {
        if (!cancelled && iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.body.innerHTML = `<pre style="color:#999;">${escapeHtml(content)}</pre>`;
          }
        }
      }
    }

    const timer = setTimeout(update, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, mode, theme]);

  return (
    <div className="html-preview">
      <div className="preview-tabs">
        <div
          className={`preview-tab ${mode === 'preview' ? 'active' : ''}`}
          onClick={() => setMode('preview')}
        >
          HTML 预览
        </div>
        <div
          className={`preview-tab ${mode === 'source' ? 'active' : ''}`}
          onClick={() => setMode('source')}
        >
          源码
        </div>
        <div className="preview-sync">↻ 自动同步</div>
      </div>
      <div className="preview-content">
        {mode === 'preview' ? (
          <iframe
            ref={iframeRef}
            className="preview-iframe"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
          />
        ) : (
          <pre className="preview-source">
            <code>{content || '(空内容)'}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default HtmlPreview;
