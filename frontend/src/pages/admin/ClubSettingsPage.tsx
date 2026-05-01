// pages/admin/ClubSettingsPage.tsx
// Accessible to: super_admin, secretary, event_manager (of this club)
// Route: /admin/clubs/:clubId/settings

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Globe, Link, Camera,
  Image, Tag, AlignLeft, CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { Spinner } from '../../components/ui';
import { useClub } from '../../hooks/useClubs';
import { clubService } from '../../services/clubService';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

// ── Category options (must match Prisma ClubCategory enum) ───────────────────
const CATEGORY_OPTIONS = [
  { value: 'technical',       label: 'Technical' },
  { value: 'cultural',        label: 'Cultural' },
  { value: 'sports',          label: 'Sports' },
  { value: 'social',          label: 'Social' },
  { value: 'academic',        label: 'Academic' },
  { value: 'entrepreneurship',label: 'Entrepreneurship' },
  { value: 'arts',            label: 'Arts' },
  { value: 'volunteer',       label: 'Volunteer' },
  { value: 'other',           label: 'Other' },
];

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-gray-300 transition-shadow';

// ── Main page ─────────────────────────────────────────────────────────────────
const ClubSettingsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { club, loading } = useClub(clubId ?? '');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [logoUrl,     setLogoUrl]     = useState('');
  const [bannerUrl,   setBannerUrl]   = useState('');
  const [websiteUrl,  setWebsiteUrl]  = useState('');
  const [instagramUrl,setInstagramUrl]= useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl,  setTwitterUrl]  = useState('');
  const [tags,        setTags]        = useState('');       // comma-separated
  const [skillAreas,  setSkillAreas]  = useState('');      // comma-separated

  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  // ── Populate form once club loads ───────────────────────────────────────────
  useEffect(() => {
    if (!club) return;
    setName(club.name ?? '');
    setDescription(club.description ?? '');
    setCategory(club.category ?? '');
    setLogoUrl(club.logoUrl ?? '');
    setBannerUrl(club.bannerUrl ?? '');
    setWebsiteUrl(club.socialLinks?.website ?? '');
    setInstagramUrl(club.socialLinks?.instagram ?? '');
    setLinkedinUrl(club.socialLinks?.linkedin ?? '');
    setTags((club.tags ?? []).join(', '));
    setSkillAreas((club.skillAreas ?? []).join(', '));
  }, [club]);

  // ── Access guard — secretary/event_manager only for their own club ──────────
  const isSuperAdmin = user?.role === 'super_admin';
  const canEdit =
    isSuperAdmin ||
    user?.role === 'secretary' ||
    user?.role === 'event_manager';

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!clubId) return;
    if (!name.trim()) { toast.error('Club name is required.'); return; }

    setSaving(true);
    setSaved(false);
    try {
      await clubService.update(clubId, {
        name:          name.trim(),
        description:   description.trim() || undefined,
        category:      category as never,
        logo_url:      logoUrl.trim()      || undefined,
        banner_url:    bannerUrl.trim()    || undefined,
        website_url:   websiteUrl.trim()   || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        linkedin_url:  linkedinUrl.trim()  || undefined,
        twitter_url:   twitterUrl.trim()   || undefined,
        tags:          tags.split(',').map((t) => t.trim()).filter(Boolean),
        skill_areas:   skillAreas.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSaved(true);
      toast.success('Club settings saved!');
      // Brief checkmark then reset
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">You don't have permission to edit this club.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Club Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update profile, banner, category, social links, and tags.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60',
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ── Section: Basic Info ─────────────────────────────────────────────── */}
      <Card className="space-y-5 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <AlignLeft size={14} /> Basic Info
        </h2>

        <Field label="Club Name *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI Research Club"
            className={inputCls}
          />
        </Field>

        <Field label="Description" hint="Shown on the club detail page and discovery feed.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell students what your club is about…"
            rows={4}
            className={cn(inputCls, 'resize-none')}
          />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
      </Card>

      {/* ── Section: Visuals ────────────────────────────────────────────────── */}
      <Card className="space-y-5 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Image size={14} /> Visuals
        </h2>

        <Field label="Logo URL" hint="Direct image URL — square format recommended (200×200).">
          <div className="flex gap-3">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className={cn(inputCls, 'flex-1')}
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>
        </Field>

        <Field label="Banner URL" hint="Shown at the top of the club detail page — 1200×400 recommended.">
          <input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/banner.png"
            className={inputCls}
          />
          {bannerUrl && (
            <div className="mt-2 rounded-xl overflow-hidden h-24 bg-gray-100">
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </Field>
      </Card>

      {/* ── Section: Social Links ────────────────────────────────────────────── */}
      <Card className="space-y-5 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Globe size={14} /> Social Links
        </h2>

        <Field label="Website">
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourclub.edu"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </Field>

        <Field label="Instagram">
          <div className="relative">
            <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourclub"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </Field>

        <Field label="LinkedIn">
          <div className="relative">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/company/yourclub"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </Field>

        <Field label="Twitter / X">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">𝕏</span>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/yourclub"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </Field>
      </Card>

      {/* ── Section: Discovery Tags ──────────────────────────────────────────── */}
      <Card className="space-y-5 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Tag size={14} /> Discovery & Skills
        </h2>

        <Field
          label="Tags"
          hint="Comma-separated. Used for search and discovery. e.g. machine-learning, research, hackathon"
        >
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="machine-learning, research, python"
            className={inputCls}
          />
          {tags && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Field>

        <Field
          label="Skill Areas"
          hint="Comma-separated. Helps students find clubs that match their interests. e.g. AI/ML, Web Dev, Design"
        >
          <input
            type="text"
            value={skillAreas}
            onChange={(e) => setSkillAreas(e.target.value)}
            placeholder="AI/ML, Data Science, Research"
            className={inputCls}
          />
          {skillAreas && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skillAreas.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Field>
      </Card>

      {/* Bottom save button — convenience duplicate */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60',
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ClubSettingsPage;