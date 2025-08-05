import { create } from 'zustand';
import { GlobalStats, Pool, MinerStats, Theme, NotificationSettings } from '@/types';

interface AppState {
  // Global state
  stats: GlobalStats | null;
  pools: Record<string, Pool>;
  isLoading: boolean;
  error: string | null;
  
  // Theme
  theme: Theme;
  
  // Current miner
  currentMiner: string | null;
  minerStats: MinerStats | null;
  
  // Notifications
  notifications: NotificationSettings;
  
  // WebSocket connection status
  isConnected: boolean;
  
  // Actions
  setStats: (stats: GlobalStats) => void;
  setPool: (poolName: string, pool: Pool) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: Partial<Theme>) => void;
  setCurrentMiner: (address: string | null) => void;
  setMinerStats: (stats: MinerStats | null) => void;
  setNotifications: (settings: NotificationSettings) => void;
  setConnected: (connected: boolean) => void;
  
  // Computed values
  getTotalHashrate: () => number;
  getTotalWorkers: () => number;
  getPoolByName: (name: string) => Pool | undefined;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  stats: null,
  pools: {},
  isLoading: false,
  error: null,
  theme: {
    mode: 'dark',
    primary: '#3b82f6',
    accent: '#22c55e',
  },
  currentMiner: null,
  minerStats: null,
  notifications: {
    hashrateDrop: true,
    paymentConfirmed: true,
    workerOffline: true,
    threshold: 1000,
  },
  isConnected: false,
  
  // Actions
  setStats: (stats) => set({ stats, pools: stats.pools }),
  setPool: (poolName, pool) => set((state) => ({
    pools: { ...state.pools, [poolName]: pool }
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTheme: (themeUpdate) => set((state) => ({
    theme: { ...state.theme, ...themeUpdate }
  })),
  setCurrentMiner: (currentMiner) => set({ currentMiner }),
  setMinerStats: (minerStats) => set({ minerStats }),
  setNotifications: (notifications) => set({ notifications }),
  setConnected: (isConnected) => set({ isConnected }),
  
  // Computed values
  getTotalHashrate: () => {
    const { stats } = get();
    return stats?.global.hashrate || 0;
  },
  getTotalWorkers: () => {
    const { stats } = get();
    return stats?.global.workers || 0;
  },
  getPoolByName: (name) => {
    const { pools } = get();
    return pools[name];
  },
}));

// Persist theme to localStorage
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('nomp-theme');
  if (savedTheme) {
    try {
      const theme = JSON.parse(savedTheme);
      useStore.getState().setTheme(theme);
    } catch (e) {
      console.error('Failed to parse saved theme:', e);
    }
  }
  
  // Subscribe to theme changes
  useStore.subscribe((state) => {
    localStorage.setItem('nomp-theme', JSON.stringify(state.theme));
    
    // Apply theme to document
    const root = document.documentElement;
    if (state.theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  });
}