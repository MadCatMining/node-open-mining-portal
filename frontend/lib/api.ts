import axios from 'axios';
import { GlobalStats, MinerStats, Pool, Block, PoolConfig } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Global stats
  getStats: (): Promise<GlobalStats> =>
    api.get('/stats').then(res => res.data),

  getPoolStats: (): Promise<any> =>
    api.get('/pool_stats').then(res => res.data),

  // Pool specific
  getPool: (poolName: string): Promise<Pool> =>
    api.get(`/pool/${poolName}`).then(res => res.data),

  getPoolBlocks: (poolName: string, limit = 50): Promise<Block[]> =>
    api.get(`/pool/${poolName}/blocks?limit=${limit}`).then(res => res.data),

  getPoolWorkers: (poolName: string): Promise<Record<string, any>> =>
    api.get(`/pool/${poolName}/workers`).then(res => res.data),

  // Miner specific
  getMinerStats: (address: string): Promise<MinerStats> =>
    api.get(`/miner/${address}`).then(res => res.data),

  getMinerPayments: (address: string): Promise<any[]> =>
    api.get(`/miner/${address}/payments`).then(res => res.data),

  getMinerCharts: (address: string, period = '24h'): Promise<any> =>
    api.get(`/miner/${address}/charts?period=${period}`).then(res => res.data),

  // Admin endpoints
  getPoolConfigs: (): Promise<Record<string, PoolConfig>> =>
    api.get('/admin/pools').then(res => res.data),

  updatePoolConfig: (poolName: string, config: Partial<PoolConfig>) =>
    api.put(`/admin/pool/${poolName}`, config),

  restartPool: (poolName: string) =>
    api.post(`/admin/pool/${poolName}/restart`),

  // Notifications
  updateNotificationSettings: (address: string, settings: any) =>
    api.put(`/miner/${address}/notifications`, settings),
};

export default apiClient;