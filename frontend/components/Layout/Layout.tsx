import React, { useEffect } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import { useStore } from '@/store/useStore';
import wsManager from '@/lib/websocket';
import apiClient from '@/lib/api';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'NOMP - Node Open Mining Portal',
  description = 'Modern mining pool interface with real-time statistics and miner dashboards'
}) => {
  const { setStats, setConnected, setError, setLoading } = useStore();

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = wsManager.connect();

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setError('Failed to connect to server');
    });

    // Listen for real-time stats updates
    wsManager.onStatsUpdate((stats) => {
      setStats(stats);
    });

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const stats = await apiClient.getStats();
        setStats(stats);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setError('Failed to load pool data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Cleanup on unmount
    return () => {
      wsManager.disconnect();
    };
  }, [setStats, setConnected, setError, setLoading]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'dark:bg-gray-800 dark:text-white',
          }}
        />
      </div>
    </>
  );
};

export default Layout;