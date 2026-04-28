import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallPlatform = 'android' | 'ios' | 'desktop' | 'unknown';
export type InstallStatus = 'available' | 'installed' | 'unavailable' | 'dismissed';

interface PWAInstallState {
  status: InstallStatus;
  platform: InstallPlatform;
  isStandalone: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
}

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Win|Mac|Linux/.test(navigator.platform)) return 'desktop';
  return 'unknown';
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Inject the PWA manifest and meta tags into <head>.
// /apple-touch-icon.png is copied from AFI_logo.png by the Vite plugin at
// startup, so iOS Safari can always find it at a well-known static URL.
function injectManifest() {
  // ── Manifest link ─────────────────────────────────────────────────────────
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
  }

  // ── Apple touch icon (always set/overwrite) ───────────────────────────────
  // iOS Safari reads <link rel="apple-touch-icon"> when "Add to Home Screen"
  // is tapped. We always point it at the static /apple-touch-icon.png so it
  // uses the real AFI logo instead of generating an "A" initial.
  const existingApple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
  if (existingApple) {
    existingApple.href = '/apple-touch-icon.png';
    existingApple.setAttribute('sizes', '180x180');
  } else {
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.sizes = '180x180';
    appleIcon.href = '/apple-touch-icon.png';
    document.head.appendChild(appleIcon);
  }

  // ── Meta tags ─────────────────────────────────────────────────────────────
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0A091C';
    document.head.appendChild(meta);
  }
  if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
    const meta = document.createElement('meta');
    meta.name = 'mobile-web-app-capable';
    meta.content = 'yes';
    document.head.appendChild(meta);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-capable';
    meta.content = 'yes';
    document.head.appendChild(meta);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-status-bar-style';
    meta.content = 'black-translucent';
    document.head.appendChild(meta);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-title';
    meta.content = 'AFI';
    document.head.appendChild(meta);
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAInstall(): PWAInstallState {
  const [status, setStatus] = useState<InstallStatus>(() =>
    isRunningStandalone() ? 'installed' : 'unavailable'
  );
  const [, forceUpdate] = useState(0);

  const platform = detectPlatform();
  const isStandalone = isRunningStandalone();

  useEffect(() => {
    injectManifest();

    if (isRunningStandalone()) {
      setStatus('installed');
      return;
    }

    // If iOS — always "available" (manual instructions)
    if (platform === 'ios') {
      setStatus('available');
      return;
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setStatus('available');
      forceUpdate(n => n + 1);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If already captured from a previous render
    if (deferredPrompt) {
      setStatus('available');
    }

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      setStatus('installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [platform]);

  const install = async () => {
    if (platform === 'ios') {
      // Caller handles showing iOS instructions
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setStatus('installed');
    } else {
      setStatus('dismissed');
    }
    deferredPrompt = null;
  };

  const canInstall =
    !isStandalone &&
    (status === 'available' || status === 'dismissed');

  return { status, platform, isStandalone, canInstall, install };
}
