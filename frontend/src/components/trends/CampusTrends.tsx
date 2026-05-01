import { useEffect, useState } from 'react';
import { Flame, Trophy, Star, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

interface TrendsData {
  trendingEvents: {
    id: string;
    title: string;
    date: string;
    club: string;
    clubLogo: string | null;
    registrations: number;
  }[];
  mostPopularClub: {
    id: string;
    name: string;
    memberCount: number;
    newMembersThisMonth: number;
  } | null;
  topPerformers: {
    rank: number;
    userId: string;
    name: string;
    department: string;
    totalPoints: number;
    avatar: string | null;
  }[];
}

export function CampusTrends() {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/trends')
      .then((res) => setTrends(res.data.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Campus Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!trends) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" /> Campus Trends
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Trending Events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Trending Events
          </h3>
          {trends.trendingEvents.length === 0 && (
            <p className="text-xs text-gray-400">No trending events right now</p>
          )}
          {trends.trendingEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-2 pb-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{event.title}</p>
                <p className="text-xs text-gray-500">{event.club} · {format(new Date(event.date), 'dd MMM')}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {event.registrations} joined
              </span>
            </div>
          ))}
        </div>

        {/* Club of the Month */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500" /> Club of the Month
          </h3>
          {trends.mostPopularClub ? (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                {trends.mostPopularClub.name[0]}
              </div>
              <p className="font-bold text-gray-900">{trends.mostPopularClub.name}</p>
              <p className="text-xs text-gray-500">{trends.mostPopularClub.newMembersThisMonth} new members this month</p>
              <p className="text-xs text-gray-400">{trends.mostPopularClub.memberCount} total members</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No data yet</p>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-500" /> Top Performers
          </h3>
          {trends.topPerformers.slice(0, 5).map((performer) => (
            <div key={performer.userId} className="flex items-center gap-2 py-1">
              <span className={`text-xs font-bold w-5 text-center ${
                performer.rank === 1 ? 'text-yellow-500' :
                performer.rank === 2 ? 'text-gray-400' :
                performer.rank === 3 ? 'text-amber-600' : 'text-gray-400'
              }`}>#{performer.rank}</span>
              <div className="h-7 w-7 rounded-xl bg-linear-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {performer.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{performer.name}</p>
                <p className="text-xs text-gray-500">{performer.department}</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 shrink-0">{performer.totalPoints} pts</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}