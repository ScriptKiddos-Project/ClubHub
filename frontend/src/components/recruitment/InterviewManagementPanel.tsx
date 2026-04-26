import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  formData: Record<string, string>;
  user: { id: string; name: string; email: string; department: string };
  interviews: Interview[];
}

interface Interview {
  id: string;
  slotTime: string;
  result?: string;
}

export const InterviewManagementPanel = ({ clubId }: { clubId: string }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [slotTime, setSlotTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'shortlisted'>('all');

  useEffect(() => {
    api.get(`/clubs/${clubId}/applications`).then((res) => {
      setApplications(res.data.data);
      setLoading(false);
    });
  }, [clubId]);

  const updateStatus = async (appId: string, status: 'shortlisted' | 'rejected') => {
    await api.patch(`/clubs/${clubId}/applications/${appId}`, { status });
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
  };

  const scheduleInterview = async (app: Application) => {
    if (!slotTime) return;
    const res = await api.post(`/clubs/${clubId}/interviews`, {
      applicationId: app.id,
      candidateId: app.user.id,
      slotTime,
    });
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, interviews: [...a.interviews, res.data.data] }
          : a
      )
    );
    setSelectedApp(null);
    setSlotTime('');
  };

  const updateInterviewResult = async (interviewId: string, result: 'accepted' | 'rejected') => {
    await api.patch(`/interviews/${interviewId}/result`, { result });
    setApplications((prev) =>
      prev.map((a) => ({
        ...a,
        interviews: a.interviews.map((i) =>
          i.id === interviewId ? { ...i, result } : i
        ),
      }))
    );
  };

  const filtered = tab === 'shortlisted'
    ? applications.filter((a) => a.status === 'shortlisted')
    : applications;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600',
      shortlisted: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-600',
      accepted: 'bg-green-100 text-green-700',
    };
    return `text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || ''}`;
  };

  if (loading) return <div className="p-6 text-gray-400">Loading applications...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recruitment & Interviews</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'shortlisted'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? `All (${applications.length})` : `Shortlisted (${applications.filter((a) => a.status === 'shortlisted').length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((app) => (
          <div key={app.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{app.user.name}</p>
                <p className="text-sm text-gray-500">{app.user.email} · {app.user.department}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={statusBadge(app.status)}>{app.status}</span>
            </div>

            {/* Form responses */}
            <div className="mt-3 space-y-1">
              {Object.entries(app.formData).map(([key, val]) => (
                <p key={key} className="text-xs text-gray-600">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                  {val}
                </p>
              ))}
            </div>

            {/* Interview slots */}
            {app.interviews.length > 0 && (
              <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2 space-y-2">
                {app.interviews.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between">
                    <p className="text-xs text-blue-800">
                      🗓 {new Date(iv.slotTime).toLocaleString()}
                    </p>
                    {iv.result ? (
                      <span className={statusBadge(iv.result)}>{iv.result}</span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateInterviewResult(iv.id, 'accepted')}
                          className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateInterviewResult(iv.id, 'rejected')}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {app.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(app.id, 'shortlisted')}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'rejected')}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </>
              )}
              {app.status === 'shortlisted' && (
                <button
                  onClick={() => setSelectedApp(app)}
                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  🗓 Schedule Interview
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">No applications found.</p>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-4">
              Schedule Interview — {selectedApp.user.name}
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => scheduleInterview(selectedApp)}
                disabled={!slotTime}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                Confirm & Send Invite
              </button>
              <button
                onClick={() => { setSelectedApp(null); setSlotTime(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              A calendar (.ics) invite will be emailed to the candidate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};