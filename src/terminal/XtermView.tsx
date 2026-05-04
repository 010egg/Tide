import { useRef, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import 'xterm/css/xterm.css';
import './XtermView.css';

function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const startTerminal = async () => {
    if (startedRef.current || !containerRef.current) return;
    startedRef.current = true;

    const { Terminal } = await import('xterm');
    const { FitAddon } = await import('@xterm/addon-fit');

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

    term.writeln('\x1b[1;32m● Terminal ready\x1b[0m');
    term.writeln('Setting up PTY...');

    // Set up listener and spawn in parallel
    const listenerPromise = listen<string>('pty-output', (event) => {
      term.write(event.payload);
    });

    // Forward input
    term.onData((data: string) => {
      invoke('pty_write', { data });
    });

    // Wait for listener then spawn
    listenerPromise.then(() => {
      term.writeln('Listener OK, spawning shell...');
      invoke('pty_spawn').then(() => {
        setReady(true);
      }).catch((e) => {
        term.writeln(`\r\n\x1b[1;31mSpawn failed: ${e}\x1b[0m`);
      });
    }).catch((e) => {
      term.writeln(`\r\n\x1b[1;31mListen failed: ${e}\x1b[0m`);
    });

    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);
  };

  return (
    <div className="xterm-wrap" onClick={() => !startedRef.current && startTerminal()}>
      <div className="terminal-header">
        <span className="terminal-tab active">终端</span>
        {ready && <span className="terminal-cwd">zsh</span>}
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
