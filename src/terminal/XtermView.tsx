import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import 'xterm/css/xterm.css';
import './XtermView.css';

function XtermView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'running' | 'error'>('loading');

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    const initTimer = setTimeout(async () => {
      if (!containerRef.current || initializedRef.current) return;
      initializedRef.current = true;

      try {
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        const term = new Terminal({
          cursorBlink: true,
          fontSize: 12,
          fontFamily: '"SF Mono", "Fira Code", monospace',
          rows: 10,
          theme: {
            background: '#1F1F1F',
            foreground: '#E8E8E8',
            cursor: '#E8E8E8',
          },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          setStatus('error');
          term.dispose();
          return;
        }

        term.open(containerRef.current);
        fitAddon.fit();
        terminalRef.current = term;

        // Listen for PTY output from Rust backend
        const unlisten = await listen<string>('pty-output', (event) => {
          if (terminalRef.current) {
            terminalRef.current.write(event.payload);
          }
        });

        // Spawn PTY process
        try {
          await invoke('pty_spawn');
          setStatus('running');
        } catch (e) {
          console.error('PTY spawn failed:', e);
          term.writeln('\x1b[1;31m  Terminal unavailable\x1b[0m');
          term.writeln('  Shell process could not be started.');
          setStatus('error');
        }

        // Handle user input -> send to PTY
        term.onData((data: string) => {
          invoke('pty_write', { data }).catch(() => {});
        });

        const handleResize = () => {
          if (containerRef.current?.getBoundingClientRect().width! > 0) {
            fitAddon.fit();
            // TODO: notify Rust of PTY resize
          }
        };
        window.addEventListener('resize', handleResize);

        // Store cleanup
        (term as any)._cleanup = () => {
          unlisten();
          window.removeEventListener('resize', handleResize);
        };
      } catch (e) {
        console.error('Terminal init failed:', e);
        setStatus('error');
      }
    }, 500);

    return () => {
      clearTimeout(initTimer);
      if (terminalRef.current) {
        try {
          (terminalRef.current as any)._cleanup?.();
          terminalRef.current.dispose();
        } catch {}
        terminalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="xterm-wrap">
      <div className="terminal-header">
        <div className="terminal-tab active">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          终端
        </div>
      </div>
      <div ref={containerRef} className="xterm-container">
        {status === 'loading' && (
          <div className="terminal-fallback">终端启动中...</div>
        )}
        {status === 'error' && (
          <div className="terminal-fallback">终端暂不可用</div>
        )}
      </div>
    </div>
  );
}

export default XtermView;
