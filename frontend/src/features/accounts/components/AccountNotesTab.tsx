import React, { useState } from 'react';
import { MessageSquarePlus, Send, MessageCircle } from 'lucide-react';
import { useAccountNotes, useAddAccountNote } from '../hooks/useAccounts';
import { LoadingSkeleton, EmptyState, ErrorState } from './WidgetState';

interface AccountNotesTabProps {
  accountId: string;
}

export const AccountNotesTab: React.FC<AccountNotesTabProps> = ({ accountId }) => {
  const { data: notes, isLoading, isError, error, refetch } = useAccountNotes(accountId);
  const addNoteMutation = useAddAccountNote(accountId);
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    addNoteMutation.mutate(
      { text: newNoteText.trim() },
      {
        onSuccess: () => {
          setNewNoteText('');
        },
      }
    );
  };

  const formatDateDisplay = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
    } catch {
      // Fallback
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Note Box */}
      <form
        onSubmit={handleAddNote}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-4 rounded-xl border shadow-xs"
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageSquarePlus className="w-4 h-4 text-teal-700" />
          <span style={{ color: 'var(--text)' }} className="text-xs font-bold uppercase tracking-wider">
            Add Activity Note
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Record meeting outcomes, partner calls, or strategic feedback..."
            rows={2}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--text)',
            }}
            className="flex-1 p-2.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
          />
          <button
            type="submit"
            disabled={!newNoteText.trim() || addNoteMutation.isPending}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="self-end sm:self-stretch px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-95 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            {addNoteMutation.isPending ? 'Saving...' : 'Post Note'}
          </button>
        </div>
      </form>

      {/* Notes Feed */}
      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Failed to load notes for this account.'}
          onRetry={() => refetch()}
        />
      ) : !notes || notes.length === 0 ? (
        <EmptyState
          title="No notes recorded yet"
          description="Use the box above to log meetings, partnership discussions, or execution updates."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              className="p-4 rounded-xl border shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                <span style={{ color: 'var(--text)' }} className="text-xs font-bold flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                  {formatDateDisplay(note.createdDate)} — {note.authorName}
                </span>
                <span style={{ color: 'var(--text-secondary)' }} className="text-[11px]">
                  {note.createdDate}
                </span>
              </div>
              <p style={{ color: 'var(--text)' }} className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
