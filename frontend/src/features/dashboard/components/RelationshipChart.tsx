import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Flame } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useDashboardCharts } from '../hooks/useDashboardCharts';

const STATUS_COLORS: Record<string, string> = {
  HOT: 'var(--chart-temp-hot)',
  WARM: 'var(--chart-temp-warm)',
  COLD: 'var(--chart-temp-cold)',
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    status: string;
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
        <p className="font-semibold text-[var(--text)]">{item.payload.status} Contacts</p>
        <p className="mt-1 text-[var(--text-secondary)]">
          Count: <span className="font-bold text-[var(--text)]">{item.value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const RelationshipChart: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useDashboardCharts();

  const chartData = data?.relationshipTemperature || [];
  const total = chartData.reduce((acc, curr) => acc + curr.count, 0);
  const isEmpty = !isLoading && !isError && total === 0;

  return (
    <WidgetContainer
      title="Relationship Temperature"
      subtitle="Contact engagement tier breakdown"
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Flame className="h-3.5 w-3.5 text-[var(--status-warning-text)]" />
          <span>{total} Total</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No relationship temperature data available."
      onRetry={() => refetch()}
      className="h-[360px] flex flex-col"
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-between">
        <div className="h-[210px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || 'var(--chart-temp-cold)'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex w-full items-center justify-around border-t border-[var(--border)] pt-3 pb-1 text-xs">
          {chartData.map((entry) => {
            const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
            return (
              <div key={entry.status} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[entry.status] || 'var(--chart-temp-cold)' }}
                  />
                  <span>{entry.status}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text)]">{entry.count}</span> ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
};
