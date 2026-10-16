/**
 * NeliTv web Content Security & Digital Rights Management (DRM) Shield
 * Protects video streams from inspect element, downloads, screen captures and URL extraction
 * Disables right-click, F12, developer tools key combinations, and text selection on media
 */

export function setupSecurityGuards(onWarning?: (msg: string) => void) {
  if (typeof window === 'undefined') return () => {};

  // 1. Strictly Prevent Right-Click Context Menu Everywhere
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWarning) {
      onWarning('Maudhui haya yamelindwa na NeliTv web. Hairuhusiwi kubonyeza kulia au kuiba link.');
    }
    return false;
  };

  // 2. Prevent F12, DevTools, Inspect Element, View Source & Save
  const handleKeyDown = (e: KeyboardEvent) => {
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      onWarning?.('Kipengele cha Inspect (F12) kimezuiwa kwa usalama wa maudhui.');
      return false;
    }

    // Ctrl+Shift+I / J / C (DevTools) or Cmd+Option+I / J / C (Mac)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.shiftKey || e.altKey) &&
      (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
    ) {
      e.preventDefault();
      e.stopPropagation();
      onWarning?.('Zana za ukaguzi wa kodi zimezuiwa kwenye NeliTv web.');
      return false;
    }

    // Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      onWarning?.('Kuangalia chanzo cha kodi (View Source) kumezuiwa.');
      return false;
    }

    // Ctrl+S (Save Webpage)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Print Screen / Screenshot attempt detection
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      e.stopPropagation();
      try {
        navigator.clipboard?.writeText('Picha ya skrini (screenshot) imezuiwa na NeliTv web.');
      } catch {}
      onWarning?.('Kupiga picha ya skrini (Screenshot) kumezuiwa kwa ajili ya ulinzi wa hakimiliki.');
      return false;
    }
  };

  // 3. Prevent Drag and Drop of video elements
  const handleDragStart = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('dragstart', handleDragStart, true);

  // 4. Debugger loop deterrent
  let debugInterval: any = null;
  try {
    debugInterval = setInterval(() => {
      const start = performance.now();
      // debugger statement triggers pause if DevTools is open
      Function('debugger')();
      if (performance.now() - start > 100) {
        onWarning?.('Zana za ukaguzi zimefunguliwa.');
      }
    }, 4000);
  } catch {}

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('dragstart', handleDragStart, true);
    if (debugInterval) clearInterval(debugInterval);
  };
}
