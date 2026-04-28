import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { useEffect } from 'react';

function PWAHead() {
  useEffect(() => {
    // Favicon
    const setLink = (rel: string, href: string, type?: string, sizes?: string) => {
      const existing = document.querySelector(`link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ''}`);
      const el = (existing as HTMLLinkElement) ?? document.createElement('link');
      el.setAttribute('rel', rel);
      el.setAttribute('href', href);
      if (type) el.setAttribute('type', type);
      if (sizes) el.setAttribute('sizes', sizes);
      if (!existing) document.head.appendChild(el);
    };
    const setMeta = (name: string, content: string) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      const el = (existing as HTMLMetaElement) ?? document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      if (!existing) document.head.appendChild(el);
    };

    setLink('icon', '/icon.svg', 'image/svg+xml');
    setLink('apple-touch-icon', '/apple-touch-icon.png', 'image/png', '180x180');
    setLink('manifest', '/manifest.json');
    setMeta('theme-color', '#0A091C');
    setMeta('mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', 'AFI');

    // Page title
    document.title = 'AFI — Finance RPG';
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <PWAHead />
        <RouterProvider router={router} />
      </CurrencyProvider>
    </AuthProvider>
  );
}