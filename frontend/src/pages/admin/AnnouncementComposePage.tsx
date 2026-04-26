// pages/admin/AnnouncementComposePage.tsx
// Phase 4: Admin compose + history view for club announcements.
// Posts via REST (backend broadcasts via Socket.io to all club members).

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Megaphone, Send, Loader2, Pin } from 'lucide-react';
import { Card } from '../../components/ui';
import { fetchAnnouncements, postAnnouncement } from '../../services/phase4Service';
import type { Announcement } from '../../types/phase4';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

const AnnouncementComposePage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [history, setHistory] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    fetchAnnouncements(clubId)
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistory(sorted);
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const handlePost = async () => {
    if (!clubId || !title.trim() || !body.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setPosting(true);
    try {
      const ann = await postAnnouncement(clubId, { title: title.trim(), body: body.trim() });
      setHistory((prev) => [ann, ...prev]);
      setTitle('');
      setBody('');
      toast.success('Announcement posted! Members notified in real-time.');
    } catch {
      toast.error('Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Megaphone size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Post Announcement</h1>
          <p className="text-xs text-gray-500">Broadcasts to all club members in real-time</p>
        </div>
      </div>

      {/* Compose */}
      <Card className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Important update about next meeting"
            maxLength={120}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement here…"
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{body.length} chars</p>
        </div>
        <button
          onClick={handlePost}
          disabled={posting || !title.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold transition-colors"
        >
          {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {posting ? 'Posting…' : 'Post Announcement'}
        </button>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Past Announcements</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-indigo-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">
            No announcements posted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((ann) => (
              <Card key={ann.id} className={cn(ann.isPinned && 'border-indigo-200 bg-indigo-50/30')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <Pin size={12} className="text-indigo-500" />
                      )}
                      <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line line-clamp-3">{ann.body}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0">
                    {new Date(ann.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementComposePage;
