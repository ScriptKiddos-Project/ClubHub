import React, { useState } from 'react';
import { Download, Star, Flame, Shield, Globe, Mic, Users, Code, Heart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, Badge, Avatar, ProgressBar } from '../../components/ui';
import { cn } from '../../utils';

const MOCK_EXPERIENCE = [
  {
    id: '1', title: 'President, AI Research Club', organization: 'AI Research Club',
    startDate: 'AUG 2023', endDate: undefined, isCurrent: true,
    description: 'Spearheaded a 50+ member organization focused on neural architecture research. Orchestrated the annual "DeepLink" Hackathon with $5k prize pool.',
    tags: ['Leadership', 'Event Mgmt'],
  },
  {
    id: '2', title: 'Lead Developer, Campus OS Project', organization: 'Campus OS',
    startDate: 'JAN 2023', endDate: 'AUG 2023', isCurrent: false,
    description: 'Developed the core navigation API for the student portal. Reduced load times by 40% using optimized caching strategies.',
    tags: ['Full Stack', 'Open Source'],
  },
  {
    id: '3', title: 'Volleyball Team Captain', organization: 'Sports Department',
    startDate: '2022', endDate: '2023', isCurrent: false,
    description: 'Led the varsity team to regional finals. Coordinated weekly training sessions and community outreach programs.',
    tags: ['Teamwork', 'Athletics'],
  },
];

const MOCK_SKILLS = [
  { name: 'Architecture', percentage: 94 },
  { name: 'Leadership', percentage: 88 },
  { name: 'Public Speaking', percentage: 76 },
];

const MOCK_BADGES = [
  { id: '1', name: 'Founder', icon: <Shield size={18}/>, color: 'text-purple-600 bg-purple-100' },
  { id: '2', name: 'Coder', icon: <Code size={18}/>, color: 'text-blue-600 bg-blue-100' },
  { id: '3', name: 'Leader', icon: <Star size={18}/>, color: 'text-amber-600 bg-amber-100' },
  { id: '4', name: 'Helper', icon: <Heart size={18}/>, color: 'text-red-600 bg-red-100' },
  { id: '5', name: 'Global', icon: <Globe size={18}/>, color: 'text-green-600 bg-green-100' },
  { id: '6', name: 'Voice', icon: <Mic size={18}/>, color: 'text-indigo-600 bg-indigo-100' },
];

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('experience');

  const name = user?.name ?? 'Marcus Thorne';
  const dept = user?.department ?? 'Computer Science';
  const gpa = user?.gpa ?? 3.92;
  const points = user?.totalPoints ?? 2450;
  const streak = user?.streak ?? 12;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatarUrl} name={name} size="xl"/>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 rounded-full text-white text-xs font-bold flex items-center gap-1">
              <Star size={10} fill="white"/> ELITE
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 mt-1">Senior {dept} • GPA {gpa}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold">
                <span className="text-base">📍</span> {points.toLocaleString()} Points
              </span>
              <span className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold">
                <Flame size={14}/> {streak} Streak
              </span>
            </div>
          </div>
        </div>
        <Button leftIcon={<Download size={15}/>} variant="outline">Export to PDF</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Experience */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users size={16} className="text-indigo-600"/>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Experience</h2>
          </div>
          <div className="space-y-5">
            {MOCK_EXPERIENCE.map((exp, i) => (
              <div key={exp.id} className={cn('relative pl-5', i < MOCK_EXPERIENCE.length - 1 && 'pb-5 border-b border-gray-50')}>
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-indigo-600"/>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {exp.startDate} — {exp.isCurrent ? 'PRESENT' : exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{exp.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {exp.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Skill Matrix */}
          <Card className="bg-gray-900 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-400">⚡</span>
              <h3 className="font-bold text-white">Skill Matrix</h3>
            </div>
            <div className="space-y-3">
              {MOCK_SKILLS.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="uppercase tracking-wide">{skill.name}</span>
                    <span className="text-white font-bold">{skill.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="h-full bg-indigo-400 rounded-full transition-all duration-700" style={{ width: `${skill.percentage}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-indigo-600"/>
              <h3 className="font-bold text-gray-900">Badges</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MOCK_BADGES.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-1.5">
                  <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', badge.color)}>
                    {badge.icon}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Next milestone */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Next Milestone</p>
            <h3 className="font-bold text-gray-900 text-base">Silver Key Academic Honor Society</h3>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <span>📅</span> Nov 15, 2024
            </p>
            <div className="mt-3">
              <ProgressBar value={75} color="bg-indigo-600"/>
              <p className="text-xs text-gray-500 mt-1">75% complete</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
