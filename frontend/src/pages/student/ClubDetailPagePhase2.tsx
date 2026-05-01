// pages/student/ClubDetailPagePhase2.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  Globe,
  ExternalLink,
  TrendingUp,
  Settings,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
// import { useClub } from "../../hooks/useClubs";
import { useEvents } from "../../hooks/useEvents";
import { useClubRanking } from "../../hooks/usePhase2";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Avatar, Spinner, EmptyState } from "../../components/ui";
import { EventCard } from "../../components/events/EventCard";
import { RankingBadge } from "../../components/rankings/RankingBadge";
import { RankingBreakdownModal } from "../../components/rankings/RankingBreakdownModal";
import { SuggestionBox } from "../../components/clubs/SuggestionBox";
import { fetchMyApplication } from "../../services/phase4Service";
import type { MyApplicationStatus } from "../../services/phase4Service";
import { cn, categoryColor } from "../../utils";
import type { Club } from "../../types";
import { useClub, useClubMembers } from "../../hooks/useClubs";

const MOCK_CLUB: Club = {
  id: "1",
  name: "AI Research Club",
  slug: "ai-research",
  category: "technology",
  description:
    "Focused on cutting-edge AI research, neural architecture exploration, and real-world machine learning applications. We host weekly paper readings, monthly project showcases, and the annual DeepLink Hackathon.",
  memberCount: 52,
  status: "approved",
  isJoined: false,
  upcomingEventCount: 3,
  socialLinks: {
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    website: "https://airesearch.campus.edu",
  },
  rankingScore: 94,
  createdAt: new Date().toISOString(),
};

// Replace the commented-out MOCK_MEMBERS with this shaped version:
const MOCK_MEMBERS = [
  {
    id: "m1",
    role: "secretary",
    user: {
      name: "Marcus Thorne",
      department: "Computer Science",
      avatarUrl: null,
    },
  },
  {
    id: "m2",
    role: "event_manager",
    user: { name: "Priya Sharma", department: "Data Science", avatarUrl: null },
  },
  {
    id: "m3",
    role: "member",
    user: { name: "Alex Rivera", department: "AI & ML", avatarUrl: null },
  },
  {
    id: "m4",
    role: "member",
    user: { name: "Sarah Miller", department: "Mathematics", avatarUrl: null },
  },
  {
    id: "m5",
    role: "member",
    user: { name: "James Wu", department: "Software Eng", avatarUrl: null },
  },
];

const categoryLabel: Record<string, string> = {
  technology: "Technology",
  arts_culture: "Arts & Culture",
  sports: "Sports",
  academic: "Academic",
  social: "Social",
  career_prep: "Career Prep",
  development: "Development",
  creative_arts: "Creative Arts",
};

// ── Application status button ─────────────────────────────────────────────────

const ApplicationStatusButton: React.FC<{
  myApp: MyApplicationStatus | null;
  loadingApp: boolean;
  onApply: () => void;
}> = ({ myApp, loadingApp, onApply }) => {
  if (loadingApp) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold"
      >
        <Loader2 size={14} className="animate-spin" /> Checking…
      </button>
    );
  }

  if (!myApp) {
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={onApply}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
      >
        <ClipboardList size={14} /> Apply
      </Button>
    );
  }

  const statusConfig: Record<
    string,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    pending: {
      icon: <Clock size={14} />,
      label: "Application Pending",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    shortlisted: {
      icon: <CheckCircle size={14} />,
      label: "Shortlisted 🎉",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    accepted: {
      icon: <CheckCircle size={14} />,
      label: "Accepted ✓",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    rejected: {
      icon: <XCircle size={14} />,
      label: "Not Selected",
      className: "bg-red-50 text-red-600 border border-red-200",
    },
  };

  const cfg = statusConfig[myApp.status] ?? statusConfig.pending;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold",
        cfg.className,
      )}
    >
      {cfg.icon} {cfg.label}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

type TabKey = "about" | "events" | "members" | "suggestions";

const ClubDetailPagePhase2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { club: fetchedClub, loading } = useClub(id ?? "");
  const club = fetchedClub ?? MOCK_CLUB;

  const { events, registerForEvent } = useEvents({
    clubId: id,
    autoFetch: !!id,
  });
  const {
    breakdown,
    history,
    loading: rankingLoading,
  } = useClubRanking(id ?? "");

  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [myApp, setMyApp] = useState<MyApplicationStatus | null>(null);
  const [loadingApp, setLoadingApp] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  const canManage =
    isSuperAdmin ||
    ((user?.role === "secretary" || user?.role === "event_manager") &&
      (club.userRole === "secretary" || club.userRole === "event_manager"));

  const isStudent = !isSuperAdmin && !club.isJoined;

  // Analytics is visible to: super_admin (all clubs) OR any member of this
  // specific club (member / secretary / event_manager / club_admin).
  // club.isJoined = true means the current user has a membership row for this club.
  const canViewAnalytics = isSuperAdmin || !!club.isJoined;
  const clubId = id ?? club.id;

  const { members, loading: membersLoading } = useClubMembers(clubId);

  useEffect(() => {
    if (!clubId || !isStudent) return;
    let cancelled = false;
    setLoadingApp(true);
    fetchMyApplication(clubId).then((app) => {
      if (cancelled) return;
      setMyApp(app);
      setLoadingApp(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clubId, isStudent]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "about", label: "About" },
    {
      key: "events",
      label: `Events (${events.length || (club.upcomingEventCount ?? 0)})`,
    },
    { key: "members", label: "Members" },
    { key: "suggestions", label: "Suggestions" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Back to Clubs
      </button>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-indigo-600 to-purple-700 h-40">
        {club.bannerUrl && (
          <img
            src={club.bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
        <span
          className={cn(
            "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold",
            categoryColor(club.category),
          )}
        >
          {categoryLabel[club.category] ?? club.category}
        </span>
      </div>

      {/* Club header card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-2xl -mt-10 shrink-0 ml-4 sm:ml-0">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            ) : (
              club.name[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{club.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Users size={13} /> {club.memberCount} members
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={13} /> {club.upcomingEventCount ?? 0}{" "}
                    upcoming events
                  </span>
                  {breakdown && (
                    <button
                      onClick={() => setShowRankingModal(true)}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <RankingBadge
                        tier={breakdown.tier}
                        rank={breakdown.rank}
                        size="sm"
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {breakdown && (
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    <TrendingUp size={14} />
                    <span className="hidden sm:inline">Ranking</span>
                  </button>
                )}

                {canManage && (
                  <>
                    <button
                      onClick={() =>
                        navigate(`/admin/clubs/${clubId}/settings`)
                      }
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Club Settings"
                    >
                      <Settings size={15} className="text-gray-500" />
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/admin/clubs/${clubId}/recruitment`)
                      }
                      className="flex items-center gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
                    >
                      <ClipboardList size={14} />
                      <span className="hidden sm:inline">Recruitment</span>
                    </Button>
                  </>
                )}

                {canViewAnalytics && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/clubs/${club.id}/analytics`)}
                    variant="outline"
                  >
                    View Analytics
                  </Button>
                )}

                {isStudent && (
                  <ApplicationStatusButton
                    myApp={myApp}
                    loadingApp={loadingApp}
                    onApply={() => navigate(`/clubs/${clubId}/apply`)}
                  />
                )}
              </div>
            </div>

            {club.socialLinks && (
              <div className="flex items-center gap-3 mt-3">
                {club.socialLinks.website && (
                  <a
                    href={club.socialLinks.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                  >
                    <Globe size={12} /> Website <ExternalLink size={10} />
                  </a>
                )}
                {club.socialLinks.instagram && (
                  <a
                    href={club.socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-pink-600 hover:underline"
                  >
                    Instagram
                  </a>
                )}
                {club.socialLinks.linkedin && (
                  <a
                    href={club.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
              activeTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "about" && (
        <Card>
          <h2 className="text-base font-bold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {club.description}
          </p>

          {breakdown && (
            <div className="mt-5 p-4 bg-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                  <TrendingUp size={14} /> Club Performance
                </h3>
                <button
                  onClick={() => setShowRankingModal(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Full breakdown →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Overall Score",
                    value: breakdown.totalScore.toFixed(1),
                  },
                  { label: "Rank", value: `#${breakdown.rank}` },
                  {
                    label: "Tier",
                    value:
                      breakdown.tier.charAt(0).toUpperCase() +
                      breakdown.tier.slice(1),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl font-black text-indigo-600">
                      {value}
                    </div>
                    <div className="text-xs text-indigo-500 mt-0.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recruitment CTA — students only */}
          {isStudent && (
            <div
              className={cn(
                "mt-5 flex items-center justify-between gap-4 p-4 rounded-xl border",
                myApp
                  ? "bg-gray-50 border-gray-200"
                  : "bg-emerald-50 border-emerald-100",
              )}
            >
              <div>
                {myApp ? (
                  <>
                    <p className="text-sm font-bold text-gray-700">
                      Your application is in!
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Status:{" "}
                      <span className="font-semibold capitalize">
                        {myApp.status}
                      </span>{" "}
                      — we'll notify you of any updates.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-emerald-800">
                      Interested in joining the core team?
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Apply to become an active member of {club.name}.
                    </p>
                  </>
                )}
              </div>
              {!myApp && !loadingApp && (
                <button
                  onClick={() => navigate(`/clubs/${clubId}/apply`)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  <ClipboardList size={14} /> Apply Now
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {activeTab === "events" && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="This club hasn't scheduled any events yet."
              icon={<Calendar size={24} />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={registerForEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <Card>
          <h2 className="text-base font-bold text-gray-900 mb-4">Core Team</h2>

          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="space-y-3">
              {(members.length > 0 ? members : MOCK_MEMBERS).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar
                    name={member.user.name}
                    src={member.user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.user.department ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant="primary"
                    className="text-xs shrink-0 capitalize"
                  >
                    {member.role.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {members.length} member{members.length !== 1 ? "s" : ""} ·
                Manage applicants & interviews
              </p>
              <button
                onClick={() => navigate(`/admin/clubs/${clubId}/recruitment`)}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
              >
                <ClipboardList size={13} /> Open Recruitment Dashboard →
              </button>
            </div>
          )}
        </Card>
      )}

      {activeTab === "suggestions" && (
        <Card>
          <SuggestionBox clubId={id ?? club.id} />
        </Card>
      )}

      <RankingBreakdownModal
        open={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        breakdown={breakdown}
        history={history}
        clubName={club.name}
        loading={rankingLoading}
      />
    </div>
  );
};

export default ClubDetailPagePhase2;
