import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils';
import type { EventFilters } from '../../types/phase2';

const SKILL_AREAS = [
  'Machine Learning', 'Web Development', 'Leadership', 'Public Speaking',
  'Design', 'Data Analysis', 'Marketing', 'Research', 'Entrepreneurship',
  'Communication', 'Photography', 'Music', 'Finance',
];

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'social', label: 'Social' },
  { value: 'competition', label: 'Competition' },
  { value: 'webinar', label: 'Webinar' },
];

const VOL_HOURS_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1+ hr' },
  { value: 2, label: '2+ hrs' },
  { value: 3, label: '3+ hrs' },
  { value: 5, label: '5+ hrs' },
];

interface AdvancedEventFiltersProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  onReset: () => void;
}

export const AdvancedEventFilters: React.FC<AdvancedEventFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [showSkills, setShowSkills] = useState(false);

  const toggleSkillArea = (skill: string) => {
    const current = filters.skillAreas ?? [];
    onChange({
      ...filters,
      skillAreas: current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill],
    });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags ?? [];
    onChange({
      ...filters,
      tags: current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    });
  };

  const activeCount =
    (filters.eventType ? 1 : 0) +
    (filters.skillAreas?.length ?? 0) +
    (filters.tags?.length ?? 0) +
    (filters.volunteerHoursMin ?? 0 > 0 ? 1 : 0) +
    (filters.isFeatured ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Filter size={14} className="text-indigo-500" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* Featured toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={cn(
              'w-9 h-5 rounded-full transition-colors relative',
              filters.isFeatured ? 'bg-indigo-600' : 'bg-gray-200',
            )}
            onClick={() => onChange({ ...filters, isFeatured: !filters.isFeatured })}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                filters.isFeatured && 'translate-x-4',
              )}
            />
          </div>
          <span className="text-sm text-gray-700">Featured only</span>
        </label>
      </div>

      {/* Event type */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Event Type
        </p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                onChange({ ...filters, eventType: filters.eventType === value ? undefined : value })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filters.eventType === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Volunteer hours */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Min Volunteer Hours
        </p>
        <div className="flex gap-2 flex-wrap">
          {VOL_HOURS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                onChange({ ...filters, volunteerHoursMin: value === 0 ? undefined : value })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                (filters.volunteerHoursMin ?? 0) === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill areas */}
      <div>
        <button
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
          onClick={() => setShowSkills((p) => !p)}
        >
          <span>Skill Areas {filters.skillAreas?.length ? `(${filters.skillAreas.length})` : ''}</span>
          {showSkills ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showSkills && (
          <div className="flex flex-wrap gap-2">
            {SKILL_AREAS.map((skill) => {
              const active = filters.skillAreas?.includes(skill) ?? false;
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkillArea(skill)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                    active
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600',
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        )}
        {/* Active skill chips */}
        {!showSkills && (filters.skillAreas?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {filters.skillAreas!.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
              >
                {skill}
                <button onClick={() => toggleSkillArea(skill)}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active tags */}
      {(filters.tags?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Active Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filters.tags!.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
              >
                #{tag}
                <button onClick={() => toggleTag(tag)}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tag chip for event cards – clicking adds to filters ──────────────────────

interface EventTagChipsProps {
  tags: string[];
  skillAreas?: string[];
  onTagClick?: (tag: string) => void;
  onSkillClick?: (skill: string) => void;
}

export const EventTagChips: React.FC<EventTagChipsProps> = ({
  tags,
  skillAreas = [],
  onTagClick,
  onSkillClick,
}) => (
  <div className="flex flex-wrap gap-1.5">
    {tags.map((tag) => (
      <button
        key={tag}
        onClick={() => onTagClick?.(tag)}
        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
      >
        #{tag}
      </button>
    ))}
    {skillAreas.map((skill) => (
      <button
        key={skill}
        onClick={() => onSkillClick?.(skill)}
        className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
      >
        {skill}
      </button>
    ))}
  </div>
);
