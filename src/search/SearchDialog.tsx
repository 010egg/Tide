import { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '../store/document';
import './SearchDialog.css';

interface SearchDialogProps {
  onClose: () => void;
}

function SearchDialog({ onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [results, setResults] = useState<{ line: number; text: string }[]>([]);
  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    try {
      const lines = content.split('\n');
      const matches: { line: number; text: string }[] = [];
      for (let i = 0; i < lines.length; i++) {
        let found = false;
        if (isRegex) {
          try {
            found = new RegExp(query, 'i').test(lines[i]);
          } catch { /* invalid regex */ }
        } else {
          found = lines[i].toLowerCase().includes(query.toLowerCase());
        }
        if (found) {
          matches.push({ line: i + 1, text: lines[i].trim().slice(0, 80) });
        }
      }
      setResults(matches);
    } catch {
      setResults([]);
    }
  }, [query, content, isRegex]);

  const handleReplace = () => {
    if (!query) return;
    try {
      const pattern = isRegex
        ? new RegExp(query, 'gi')
        : new RegExp(escapeRegex(query), 'gi');
      const newContent = content.replace(pattern, replacement);
      setContent(newContent);
    } catch { /* invalid regex */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="search-row">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="查找..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="search-count">
            {results.length > 0 ? `${results.length} 个结果` : ''}
          </span>
        </div>
        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="替换为..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
          />
          <button className="search-replace-btn" onClick={handleReplace}>
            全部替换
          </button>
        </div>
        <div className="search-options">
          <label className="search-option">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
            />
            正则表达式
          </label>
        </div>
        {results.length > 0 && (
          <div className="search-results">
            {results.slice(0, 20).map((r, i) => (
              <div key={i} className="search-result-item">
                <span className="search-result-line">{r.line}</span>
                <span className="search-result-text">{r.text}</span>
              </div>
            ))}
            {results.length > 20 && (
              <div className="search-result-more">
                ...还有 {results.length - 20} 个结果
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default SearchDialog;
