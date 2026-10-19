import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Layers } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useAccountsByCategory } from '../hooks/useAccountsByCategory';

const BUSINESS_LINE_COLORS: Record<string, string> = {
  'Healthcare': 'var(--business-healthcare)',
  'Financial Advisory': 'var(--business-financial)',
  'Networking & Partnerships': 'var(--business-networking)',
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    category: string;
    count: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs shadow-md">
        <p className="font-semibold text-[var(--text)]">{item.payload.category}</p>
        <p className="mt-1 text-[var(--text-secondary)]">
          Accounts: <span className="font-bold text-[var(--text)]">{item.value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AccountsByCategoryChart: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useAccountsByCategory();

  const total = data?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const isEmpty = !isLoading && !isError && total === 0;

  return (
    <WidgetContainer
      title="Accounts by Category"
      subtitle="Portfolio volume across consulting practice lines"
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Layers className="h-3.5 w-3.5 text-[var(--link)]" />
          <span>{total} Accounts</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No category distribution data available."
      onRetry={() => refetch()}
      className="h-[360px] flex flex-col"
    >
      <div className="flex-1 min-h-0 flex flex-col justify-between">
        <div className="h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="var(--border)"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: 'var(--text)', fontSize: 11 }}
                stroke="var(--border)"
                width={150}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                radius={[0, 6, 6, 0]}
                barSize={20}
              >
                {data?.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={BUSINESS_LINE_COLORS[entry.category] || 'var(--business-financial)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetContainer>
  );
};
