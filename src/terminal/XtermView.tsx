import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import 'xterm/css/xterm.css';
import './XtermView.css';

function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const startedRef = useRef(false);

  const startTerminal = async () => {
    if (startedRef.current || !containerRef.current) return;
    startedRef.current = true;

    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import('xterm'),
      import('@xterm/addon-fit'),
    ]);

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, "SF Mono", "Fira Code", monospace',
      theme: { background: '#1F1F1F', foreground: '#E8E8E8', cursor: '#E8E8E8' },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    // Set up bidirectional PTY communication
    listen<string>('pty-output', (event) => {
      term.write(event.payload);
    });

    term.onData((data: string) => {
      invoke('pty_write', { data });
    });

    invoke('pty_spawn');
    term.focus();

    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);
  };

  return (
    <div className="xterm-wrap" onClick={() => !startedRef.current && startTerminal()}>
      <div className="terminal-header">
        <span className="terminal-tab active">终端</span>
      </div>
      <div ref={containerRef} className="xterm-container">
        {!startedRef.current && (
          <div className="terminal-placeholder">点击此处启动终端</div>
        )}
      </div>
    </div>
  );
}

export default XtermView;
