// pages/student/ProfilePagePhase3.tsx
// Full achievements profile: points summary, volunteer hours, badges grid,
// certificates list, and one-click resume PDF export.

import React, { useState } from 'react';
import {
  Star, Clock, Award, Shield, Download, FileText,
  ChevronRight, Loader2, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Card, Avatar, Badge, Skeleton } from '../../components/ui';
import { useAchievements, useResumeExport } from '../../hooks/usePhase3';
import BadgesShowcase from '../../components/profile/BadgesShowcase';
import CertificateList from '../../components/profile/CertificateList';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import { LinkedInShareButton } from '../../components/analytics/LinkedInShareButton';

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'badges' | 'certificates';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',     label: 'Overview',      icon: <TrendingUp size={14} /> },
  { key: 'badges',       label: 'Badges',         icon: <Shield size={14} /> },
  { key: 'certificates', label: 'Certificates',   icon: <Award size={14} /> },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
const AchievementStat: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}> = ({ icon, value, label, sub, color, bgColor, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      'bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3',
      onClick && 'cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all duration-200'
    )}
  >
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', bgColor, color)}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {onClick && (
      <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium mt-auto">
        View breakdown <ChevronRight size={12} />
      </div>
    )}
  </div>
);

// ── Recent activity mini list ─────────────────────────────────────────────────
const RecentCerts: React.FC<{
  certs: { eventTitle: string; aictePoints: number; issuedAt: string }[];
}> = ({ certs }) => {
  if (certs.length === 0) return null;
  return (
    <Card>
      <p className="text-sm font-bold text-gray-900 mb-3">Recent Certificates</p>
      <div className="space-y-2">
        {certs.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Award size={14} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{c.eventTitle}</p>
              <p className="text-[11px] text-gray-400">
                {new Date(c.issuedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <Badge variant="primary">+{c.aictePoints} pts</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const ProfilePagePhase3: React.FC = () => {
  const { user } = useAuthStore();
  const { data, loading, error } = useAchievements();
  const { exportResume, loading: exportLoading } = useResumeExport();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      // Fixed: removed duplicate py-6 / py-20 conflict → use py-20 only
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-sm">{error ?? 'Failed to load profile.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Hero card */}
      <Card className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Avatar
          src={user?.avatarUrl}
          name={user?.name ?? 'Student'}
          size="xl"
          className="ring-4 ring-indigo-100 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-gray-900">{user?.name ?? 'My Profile'}</h1>
          <p className="text-sm text-gray-500">
            {user?.department ?? 'Department'} · {user?.enrollmentYear}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="primary" dot>{data.earnedBadges.length} Badges</Badge>
            <Badge variant="success" dot>{data.certificates.length} Certificates</Badge>
            <Badge variant="info" dot>{data.totalPoints.toLocaleString()} Points</Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {/* Resume export */}
          <button
            onClick={exportResume}
            disabled={exportLoading}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              exportLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 active:scale-95'
            )}
          >
            {exportLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <Download size={14} />}
            {exportLoading ? 'Generating…' : 'Export Resume'}
          </button>

          {/* LinkedIn share for resume/achievement — always available from hero */}
          <LinkedInShareButton type="resume" label="Share on LinkedIn" />
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AchievementStat
          icon={<Star size={20} />}
          value={data.totalPoints.toLocaleString()}
          label="AICTE Points"
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          onClick={() => navigate('/points')}
        />
        <AchievementStat
          icon={<Clock size={20} />}
          value={`${data.totalHours}h`}
          label="Volunteer Hours"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <AchievementStat
          icon={<Shield size={20} />}
          value={data.earnedBadges.length}
          label="Badges Earned"
          sub={`${data.lockedBadges.length} in progress`}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          onClick={() => setTab('badges')}
        />
        <AchievementStat
          icon={<Award size={20} />}
          value={data.certificates.length}
          label="Certificates"
          color="text-purple-600"
          bgColor="bg-purple-50"
          onClick={() => setTab('certificates')}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <RecentCerts certs={data.certificates} />

          {/* Next milestone teaser */}
          {data.lockedBadges[0] && (
            <Card>
              <p className="text-sm font-bold text-gray-900 mb-3">Next Milestone</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl opacity-40 grayscale">{data.lockedBadges[0].icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{data.lockedBadges[0].name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{data.lockedBadges[0].description}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{data.lockedBadges[0].progressLabel}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${data.lockedBadges[0].progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Points link card */}
          <button
            onClick={() => navigate('/points')}
            className="w-full flex items-center justify-between px-5 py-4 bg-linear-to-r from-indigo-500 to-purple-600 rounded-2xl text-white hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} />
              <div className="text-left">
                <p className="text-sm font-bold">View Full Points History</p>
                <p className="text-xs text-indigo-200">AICTE multipliers · per event breakdown</p>
              </div>
            </div>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {tab === 'badges' && (
        <Card>
          <BadgesShowcase earned={data.earnedBadges} locked={data.lockedBadges} />
        </Card>
      )}

      {tab === 'certificates' && (
        <div className="space-y-3">
          {/* Per-certificate LinkedIn share buttons rendered inside the list */}
          {data.certificates.map((cert) => (
            <Card key={cert.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Award size={16} className="text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{cert.eventTitle}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {' · '}+{cert.aictePoints} pts
                  </p>
                </div>
              </div>
              <LinkedInShareButton
                type="certificate"
                certificateId={cert.id}
                label="Share"
              />
            </Card>
          ))}

          {/* CertificateList still renders the full list below */}
          <CertificateList certificates={data.certificates} />
        </div>
      )}
    </div>
  );
};

export default ProfilePagePhase3;