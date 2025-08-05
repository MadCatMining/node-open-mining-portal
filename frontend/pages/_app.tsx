import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.css';
import Layout from '@/components/Layout/Layout';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Apply initial theme
    const savedTheme = localStorage.getItem('nomp-theme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        if (theme.mode === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.error('Failed to parse saved theme:', e);
      }
    }
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}