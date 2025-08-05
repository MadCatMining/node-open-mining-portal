import React from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '@/components/Dashboard/StatsCard';
import HashrateChart from '@/components/Charts/HashrateChart';
import { useStore } from '@/store/useStore';

const Dashboard: React.FC = () => {
  const { stats, isLoading, error } = useStore();

  const formatHashrate = (hashrate: number): string => {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
    let unitIndex = 0;
    let value = hashrate;

    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const getTotalBlocks = () => {
    if (!stats?.pools) return 0;
    return Object.values(stats.pools).reduce(
      (total, pool) => total + pool.blocks.confirmed + pool.blocks.pending,
      0
    );
  };

  const getTotalPaid = () => {
    if (!stats?.pools) return 0;
    return Object.values(stats.pools).reduce(
      (total, pool) => total + (pool.poolStats.totalPaid || 0),
      0
    );
  };

  const getActiveAlgos = () => {
    if (!stats?.algos) return 0;
    return Object.keys(stats.algos).length;
  };

  // Generate sample chart data (replace with real data from API)
  const generateChartData = () => {
    const now = Date.now() / 1000;
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const time = now - (i * 3600); // hourly data
      const entry: any = { time };
      
      if (stats?.pools) {
        Object.keys(stats.pools).forEach(poolName => {
          entry[poolName] = stats.pools[poolName].hashrate * (0.8 + Math.random() * 0.4);
        });
      }
      
      data.push(entry);
    }
    return data;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mining Pool Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time overview of your mining operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Total Hashrate"
          value={stats ? formatHashrate(stats.global.hashrate) : '0 H/s'}
          icon={ChartBarIcon}
          color="blue"
          loading={isLoading}
        />
        <StatsCard
          title="Active Miners"
          value={stats?.global.workers || 0}
          icon={UserGroupIcon}
          color="green"
          loading={isLoading}
        />
        <StatsCard
          title="Total Blocks"
          value={getTotalBlocks()}
          icon={CubeIcon}
          color="purple"
          loading={isLoading}
        />
        <StatsCard
          title="Active Pools"
          value={stats ? Object.keys(stats.pools).length : 0}
          icon={ServerIcon}
          color="yellow"
          loading={isLoading}
        />
        <StatsCard
          title="Algorithms"
          value={getActiveAlgos()}
          icon={ClockIcon}
          color="red"
          loading={isLoading}
        />
        <StatsCard
          title="Total Paid"
          value={`${getTotalPaid().toFixed(4)} BTC`}
          icon={CurrencyDollarIcon}
          color="green"
          loading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hashrate Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pool Hashrate (24h)
          </h3>
          {stats && (
            <HashrateChart
              data={generateChartData()}
              pools={Object.keys(stats.pools)}
              height={300}
            />
          )}
        </motion.div>

        {/* Pool Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pool Status
          </h3>
          <div className="space-y-4">
            {stats && Object.entries(stats.pools).map(([name, pool]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${pool.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pool.name} ({pool.symbol})
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {pool.algorithm}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatHashrate(pool.hashrate)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {pool.workerCount} miners
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Blocks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Blocks
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Height
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Sample data - replace with real block data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  Litecoin
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  2,845,123
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Confirmed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  12.5 LTC
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  2 hours ago
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;