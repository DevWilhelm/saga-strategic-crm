import React, { useState, useMemo } from 'react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useFollowUps } from '../hooks/useFollowUps';
import type { FollowUpCategory, FollowUpDTO } from '../../../types/dashboard';
import { Calendar, User, Building, AlertCircle } from 'lucide-react';

const TABS: { id: FollowUpCategory; label: string }[] = [
  { id: 'OVERDUE', label: 'Overdue' },
  { id: 'TODAY', label: 'Today' },
  { id: 'THIS_WEEK', label: 'This week' },
];

export const FollowUpsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FollowUpCategory>('OVERDUE');
  const { data, isLoading, isError, error, refetch } = useFollowUps();

  const tabCounts = useMemo(() => {
    const counts: Record<FollowUpCategory, number> = {
      OVERDUE: 0,
      TODAY: 0,
      THIS_WEEK: 0,
    };
    if (data) {
      data.forEach((item) => {
        if (item.status_category in counts) {
          counts[item.status_category]++;
        }
      });
    }
    return counts;
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const items = data.filter((item) => item.status_category === activeTab);
    return items.sort((a, b) => {
      // Overdue: oldest first (earliest calendar date first)
      // Today / This week: soonest first (earliest calendar date first)
      if (a.due_date !== b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      return a.contact_name.localeCompare(b.contact_name);
    });
  }, [data, activeTab]);

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <WidgetContainer
      title="Follow-ups"
      subtitle="Scheduled interactions and critical next steps"
      className="h-[430px] lg:h-[430px] flex flex-col"
      headerAction={
        <div className="flex items-center gap-1 rounded-lg bg-[var(--table-header-bg)] p-1 text-xs font-semibold">
          {TABS.map((tab) => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;

            let activeClass: string;
            let badgeClass: string;

            if (tab.id === 'OVERDUE') {
              activeClass = isActive
                ? 'bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]';
              badgeClass = isActive
                ? 'bg-[var(--status-overdue-text)] text-white'
                : 'bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]';
            } else if (tab.id === 'TODAY') {
              activeClass = isActive
                ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]';
              badgeClass = isActive
                ? 'bg-[var(--status-warning-text)] text-white'
                : 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]';
            } else {
              activeClass = isActive
                ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]';
              badgeClass = isActive
                ? 'bg-[var(--status-info-text)] text-white'
                : 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]';
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all cursor-pointer ${activeClass}`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${badgeClass}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No follow-up items found."
      onRetry={() => refetch()}
    >
      <div className="mt-1 flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[var(--text-secondary)]">
            <Calendar className="h-8 w-8 stroke-1 opacity-60" />
            <p className="mt-2">No follow-ups due in "{TABS.find((t) => t.id === activeTab)?.label}".</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredItems.map((item: FollowUpDTO) => {
              const isOverdue = item.status_category === 'OVERDUE';
              const isToday = item.status_category === 'TODAY';

              const pillStyle = isOverdue
                ? 'bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)] border border-[var(--status-overdue-text)]/30'
                : isToday
                ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-text)]/30'
                : 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-text)]/30';

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 py-3 transition-colors hover:bg-[var(--background)]/60 sm:flex-row sm:items-center sm:justify-between px-2 rounded-lg"
                >
                  {/* Contact & Company */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tag-bg)] text-[var(--tag-text)]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="truncate text-sm font-semibold text-[var(--text)]">
                          {item.contact_name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[var(--link)]">
                          <Building className="h-3 w-3 opacity-70" />
                          <span className="truncate hover:underline cursor-pointer">{item.company_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Item */}
                    <p className="mt-1.5 pl-9 text-xs text-[var(--text-secondary)]">
                      {item.action}
                    </p>
                  </div>

                  {/* Due Date Badge */}
                  <div className="flex items-center gap-2 pl-9 sm:pl-0 sm:self-center">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${pillStyle}`}>
                      {isOverdue && <AlertCircle className="h-3 w-3" />}
                      <Calendar className="h-3 w-3 opacity-70" />
                      <span>{item.due_date}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
