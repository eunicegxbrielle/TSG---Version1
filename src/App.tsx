import React, { useState, useEffect } from 'react';
import { Version1App } from './Version1App';
import { Version2App } from './Version2App';

export type ThemeMode = 'dark' | 'light';

function getInitialVersion(): 'v1' | 'v2' {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const ver = params.get('version') || params.get('v');
    if (ver === '1' || ver === 'v1') {
      return 'v1';
    }
  }
  return 'v2';
}

function getInitialTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tsg_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
  }
  return 'dark';
}

export default function App() {
  const [version, setVersion] = useState<'v1' | 'v2'>(getInitialVersion);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('tsg_theme', theme);
    } catch {
      // ignore storage errors
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#090a0d' : '#f6f4ef');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (version === 'v1') {
    return (
      <Version1App
        onSwitchToV2={() => setVersion('v2')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <Version2App
      onSwitchToV1={() => setVersion('v1')}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}
