import { io, Socket } from 'socket.io-client';
import { GlobalStats } from '@/types';

class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';
    
    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    return this.socket;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  onStatsUpdate(callback: (stats: GlobalStats) => void) {
    this.socket?.on('stats', callback);
  }

  onPoolUpdate(callback: (poolName: string, data: any) => void) {
    this.socket?.on('pool_update', callback);
  }

  onBlockFound(callback: (block: any) => void) {
    this.socket?.on('block_found', callback);
  }

  onMinerUpdate(callback: (address: string, data: any) => void) {
    this.socket?.on('miner_update', callback);
  }

  // Subscriptions
  subscribeMiner(address: string) {
    this.socket?.emit('subscribe_miner', address);
  }

  unsubscribeMiner(address: string) {
    this.socket?.emit('unsubscribe_miner', address);
  }

  subscribePool(poolName: string) {
    this.socket?.emit('subscribe_pool', poolName);
  }

  unsubscribePool(poolName: string) {
    this.socket?.emit('unsubscribe_pool', poolName);
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;