import { useEffect } from 'react';
import { CHANNELS, Channel } from '../data/channels';

interface UseTVRemoteProps {
  currentPage: 'home' | 'watch' | 'account' | 'plans' | 'movies';
  selectedChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
  onGoHome: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

export function useTVRemote({
  currentPage,
  selectedChannel,
  onSelectChannel,
  onGoHome,
  isModalOpen,
  onCloseModal,
}: UseTVRemoteProps) {
  useEffect(() => {
    const handleTVKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.isContentEditable;

      // Never intercept Backspace or keys when user is typing in any input field!
      if (isInput) {
        return;
      }

      // 1. Back button handling (Tizen: 10009, webOS: 461, Standard: Escape, TV Remote GoBack)
      if (
        e.key === 'Escape' ||
        e.key === 'GoBack' ||
        e.key === 'BrowserBack' ||
        (e as any).keyCode === 10009 ||
        (e as any).keyCode === 461
      ) {
        if (isModalOpen) {
          e.preventDefault();
          onCloseModal();
          return;
        }
        if (currentPage === 'watch' || currentPage === 'plans' || currentPage === 'account') {
          e.preventDefault();
          onGoHome();
          return;
        }
      }

      // If modal is open, don't trigger background channel changes
      if (isModalOpen) return;

      // 2. Allow keyboard arrow keys to scroll page vertically smoothly
      if (!isInput) {
        if (e.key === 'ArrowDown') {
          window.scrollBy({ top: 120, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
          window.scrollBy({ top: -120, behavior: 'smooth' });
        }
      }

      // 3. Dedicated Channel Up / Down keys on TV Remote (only TV remote specific keys, not standard PageUp/Down)
      const currentIdx = CHANNELS.findIndex((c) => c.id === selectedChannel.id);
      if (e.key === 'ChannelUp' || (e as any).keyCode === 427) {
        e.preventDefault();
        const nextIdx = (currentIdx + 1) % CHANNELS.length;
        onSelectChannel(CHANNELS[nextIdx]);
        return;
      }

      if (e.key === 'ChannelDown' || (e as any).keyCode === 428) {
        e.preventDefault();
        const prevIdx = (currentIdx - 1 + CHANNELS.length) % CHANNELS.length;
        onSelectChannel(CHANNELS[prevIdx]);
        return;
      }

      // 4. Number Keys (1-9) on TV Remote for direct channel tuning
      if (/^[1-9]$/.test(e.key) && !isInput) {
        const num = parseInt(e.key, 10);
        if (num <= CHANNELS.length) {
          onSelectChannel(CHANNELS[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleTVKeyDown);
    return () => window.removeEventListener('keydown', handleTVKeyDown);
  }, [currentPage, selectedChannel, onSelectChannel, onGoHome, isModalOpen, onCloseModal]);
}
