import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import './XtermView.css';

function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const [terminals, setTerminals] = useState([{ id: '1', name: '终端' }]);
  const [activeTermId, setActiveTermId] = useState('1');

  useEffect(() => {
    if (!containerRef.current || activeTermId !== '1' || terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: '"SF Mono", "Fira Code", monospace',
      theme: {
        background: '#1F1F1F',
        foreground: '#E8E8E8',
        cursor: '#E8E8E8',
        green: '#5DCAA5',
        blue: '#85B7EB',
        brightGreen: '#5DCAA5',
        brightBlue: '#85B7EB',
        red: '#F0997B',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;32m  Typro Terminal\x1b[0m');
    term.writeln('  PTY shell support coming soon.');
    term.writeln('');

    terminalRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      terminalRef.current = null;
    };
  }, [activeTermId]);

  return (
    <div className="xterm-wrap">
      <div className="terminal-header">
        {terminals.map((t) => (
          <div
            key={t.id}
            className={`terminal-tab ${t.id === activeTermId ? 'active' : ''}`}
            onClick={() => setActiveTermId(t.id)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            {t.name}
          </div>
        ))}
        <div className="terminal-tab-add">+</div>
        <div className="terminal-cwd">zsh</div>
      </div>
      <div ref={containerRef} className="xterm-container" />
    </div>
  );
}

export default XtermView;
