import { useDocumentStore } from '../store/document';
import './Outline.css';

interface Heading {
  level: number;
  text: string;
  line: number;
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: i + 1,
      });
    }
  }
  return headings;
}

function Outline() {
  const content = useDocumentStore((s) => s.content);
  const headings = extractHeadings(content);

  if (headings.length === 0) {
    return (
      <div className="outline-section">
        <div className="outline-label">大纲</div>
        <div className="outline-empty">暂无标题</div>
      </div>
    );
  }

  return (
    <div className="outline-section">
      <div className="outline-label">大纲</div>
      <div className="outline-list">
        {headings.map((h, i) => (
          <div
            key={i}
            className={`outline-item h${Math.min(h.level, 3)}`}
            title={h.text}
          >
            {h.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Outline;
