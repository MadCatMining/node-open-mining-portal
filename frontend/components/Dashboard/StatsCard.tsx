import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  loading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-500 text-green-600 bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-500 text-red-600 bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  };

  const [bgColor, textColor, cardBg] = colorClasses[color].split(' ');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${cardBg}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className={`text-2xl font-bold ${textColor} dark:text-white`}>
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : change < 0 ? (
                <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span
                className={`text-sm font-medium ${
                  change > 0
                    ? 'text-green-600 dark:text-green-400'
                    : change < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;