export interface Pool {
  name: string;
  symbol: string;
  algorithm: string;
  hashrate: number;
  hashrateString: string;
  workerCount: number;
  blocks: {
    pending: number;
    confirmed: number;
    orphaned: number;
  };
  poolStats: {
    validShares: number;
    invalidShares: number;
    validBlocks: number;
    totalPaid: number;
  };
  workers: Record<string, Worker>;
  ports: Record<string, PoolPort>;
  difficulty: number;
  networkHashrate?: number;
  price?: number;
  profitability?: number;
  status: 'online' | 'offline' | 'error';
  lastBlock?: Block;
}

export interface Worker {
  shares: number;
  invalidshares: number;
  hashrateString: string;
  hashrate: number;
  lastShare?: number;
  ip?: string;
  difficulty?: number;
  efficiency: number;
}

export interface PoolPort {
  diff: number;
  varDiff?: {
    minDiff: number;
    maxDiff: number;
    targetTime: number;
    retargetTime: number;
    variancePercent: number;
  };
}

export interface Block {
  height: number;
  hash: string;
  txHash: string;
  reward: number;
  difficulty: number;
  time: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'orphaned';
  finder?: string;
}

export interface GlobalStats {
  time: number;
  global: {
    workers: number;
    hashrate: number;
  };
  algos: Record<string, AlgoStats>;
  pools: Record<string, Pool>;
}

export interface AlgoStats {
  workers: number;
  hashrate: number;
  hashrateString: string;
}

export interface MinerStats {
  address: string;
  hashrate: number;
  hashrateString: string;
  shares: number;
  invalidShares: number;
  efficiency: number;
  workers: Record<string, Worker>;
  payments: Payment[];
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
  charts: {
    hashrate: ChartDataPoint[];
    shares: ChartDataPoint[];
  };
}

export interface Payment {
  time: number;
  amount: number;
  txHash: string;
  confirmations: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
}

export interface PoolConfig {
  enabled: boolean;
  coin: string;
  address: string;
  ports: Record<string, PoolPort>;
  paymentProcessing: {
    enabled: boolean;
    paymentInterval: number;
    minimumPayment: number;
  };
  miningConfigure?: {
    enabled: boolean;
    asicBoost: boolean;
    versionRolling: boolean;
  };
  stratumV2?: {
    enabled: boolean;
    port: number;
  };
}

export interface NotificationSettings {
  email?: string;
  discord?: string;
  telegram?: string;
  hashrateDrop: boolean;
  paymentConfirmed: boolean;
  workerOffline: boolean;
  threshold: number;
}

export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  accent: string;
}