import React, { useState } from 'react';
import { MessageSquarePlus, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '../../utils';
import { useSuggestions } from '../../hooks/usePhase2';
import { useAuthStore } from '../../store/authStore';
import type { Suggestion, SuggestionStatus } from '../../types/phase2';

const statusConfig: Record<SuggestionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-600', icon: <Clock size={12} /> },
  under_consideration: { label: 'Under Consideration', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
  planned: { label: 'Planned', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
};

interface SuggestionBoxProps {
  clubId: string;
}

const SuggestionCard: React.FC<{
  suggestion: Suggestion;
  canManage: boolean;
  onStatusUpdate: (id: string, status: SuggestionStatus, note?: string) => void;
}> = ({ suggestion, canManage, onStatusUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [note, setNote] = useState(suggestion.adminNote ?? '');
  const sc = statusConfig[suggestion.status];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{suggestion.title}</h4>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', sc.color)}>
              {sc.icon}{sc.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {suggestion.user?.name ?? 'Anonymous'} · {new Date(suggestion.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="p-1 hover:bg-gray-50 rounded-lg"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1">
          <p className="text-sm text-gray-700">{suggestion.body}</p>
          {suggestion.adminNote && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              <span className="font-semibold">Admin note: </span>{suggestion.adminNote}
            </div>
          )}

          {canManage && (
            <div className="pt-1">
              {!editingStatus ? (
                <button
                  onClick={() => setEditingStatus(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Update Status
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(statusConfig) as SuggestionStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusUpdate(suggestion.id, s, note);
                          setEditingStatus(false);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          suggestion.status === s
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300',
                        )}
                      >
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add admin note (optional)"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SuggestionBox: React.FC<SuggestionBoxProps> = ({ clubId }) => {
  const { user } = useAuthStore();
  const { suggestions, loading, submit, updateStatus } = useSuggestions(clubId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage =
    user?.role === 'super_admin' ||
    user?.role === 'secretary' ||
    user?.role === 'event_manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    await submit(title.trim(), body.trim());
    setTitle('');
    setBody('');
    setShowForm(false);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquarePlus size={18} className="text-indigo-500" />
          Suggestion Box
          <span className="text-xs font-normal text-gray-400">({suggestions.length})</span>
        </h3>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="text-xs text-indigo-600 font-medium hover:underline"
        >
          {showForm ? 'Cancel' : '+ New Suggestion'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Suggestion title"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your suggestion in detail..."
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No suggestions yet. Be the first to share an idea!
        </p>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              canManage={canManage}
              onStatusUpdate={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
