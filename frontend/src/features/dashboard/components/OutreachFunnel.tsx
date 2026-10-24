import React from 'react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useOutreachFunnel } from '../hooks/useOutreachFunnel';
import { Filter } from 'lucide-react';

export const OutreachFunnel: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useOutreachFunnel();

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <WidgetContainer
      title="Outreach Funnel"
      subtitle="Executive pipeline from target discovery to active meetings"
      className="h-[430px] lg:h-[430px] flex flex-col"
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Filter className="h-3.5 w-3.5 text-[var(--link)]" />
          <span>Conversion Rates</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No outreach funnel data available for active filters."
      onRetry={() => refetch()}
    >
      <div className="flex-1 flex flex-col justify-around py-1">
        {data?.map((item) => {
          const isMeetings = item.stage === 'MEETINGS';
          const barColorClass = isMeetings
            ? 'bg-[var(--chart-funnel-meetings)]'
            : 'bg-[var(--chart-funnel)]';

          return (
            <div key={item.stage} className="group">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--text)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--table-header-bg)] px-2 py-0.5 text-xs font-bold text-[var(--text)]">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="w-10 text-right text-[11px] text-[var(--text-secondary)]">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--table-header-bg)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColorClass}`}
                  style={{ width: `${Math.max(item.percentage, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
};
