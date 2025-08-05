import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface HashrateChartProps {
  data: Array<{
    time: number;
    [key: string]: number;
  }>;
  pools?: string[];
  height?: number;
  showLegend?: boolean;
}

const HashrateChart: React.FC<HashrateChartProps> = ({
  data,
  pools = [],
  height = 300,
  showLegend = true,
}) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const formatHashrate = (value: number): string => {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
    let unitIndex = 0;
    let formattedValue = value;

    while (formattedValue >= 1000 && unitIndex < units.length - 1) {
      formattedValue /= 1000;
      unitIndex++;
    }

    return `${formattedValue.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatTime = (timestamp: number): string => {
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {format(new Date(label * 1000), 'MMM dd, HH:mm')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatHashrate(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tickFormatter={formatHashrate}
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          {pools.length > 0 ? (
            pools.map((pool, index) => (
              <Line
                key={pool}
                type="monotone"
                dataKey={pool}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey="hashrate"
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HashrateChart;