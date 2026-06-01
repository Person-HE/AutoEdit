// 键盘快捷键 Hook
import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboard = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    // Handle modifier keys
    let shortcutKey = key;
    if (event.ctrlKey || event.metaKey) {
      shortcutKey = `ctrl+${key}`;
    }
    if (event.shiftKey) {
      shortcutKey = `shift+${key}`;
    }
    if (event.altKey) {
      shortcutKey = `alt+${key}`;
    }

    if (shortcuts[shortcutKey]) {
      event.preventDefault();
      shortcuts[shortcutKey]();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
