// pages/student/RecruitmentApplicationPage.tsx
// Phase 4: Student-facing recruitment application form.
// Fetches the club's customizable form fields and submits answers.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';
import { Card } from '../../components/ui';
import { fetchRecruitmentForm, submitApplication } from '../../services/phase4Service';
import type { RecruitmentForm, ApplicationField } from '../../types/phase4';
import toast from 'react-hot-toast';

// ── Field renderer ────────────────────────────────────────────────────────────
const FieldInput: React.FC<{
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const base = cn(
    'w-full rounded-xl border px-4 py-3 text-sm text-gray-900 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
    error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
  );

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
          className={cn(base, 'resize-none')}
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">Select an option…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
          className={base}
        />
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const RecruitmentApplicationPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<RecruitmentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    fetchRecruitmentForm(clubId)
      .then((f) => {
        setForm(f);
        if (f) {
          const init: Record<string, string> = {};
          f.fields.forEach((field) => { init[field.id] = ''; });
          setAnswers(init);
        }
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Record<string, string> = {};
    form.fields.forEach((field) => {
      if (field.required && !answers[field.id]?.trim()) {
        errs[field.id] = 'This field is required.';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!form || !clubId || !validate()) return;
    setSubmitting(true);
    try {
      await submitApplication(clubId, { formId: form.id, answers });
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-700">No open recruitment</h2>
        <p className="text-sm text-gray-500 mt-1">
          This club isn't accepting applications right now.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-sm text-indigo-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Application Submitted!</h2>
        <p className="text-sm text-gray-500 mt-2">
          Your application to <span className="font-semibold">{form.clubName}</span> has been received.
          You'll be notified about the next steps.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Club
        </button>
      </div>
    );
  }

  const deadlinePassed = form.deadline && new Date(form.deadline) < new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Form header */}
      <Card>
        <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{form.description}</p>
        {form.deadline && (
          <div className={cn(
            'mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5',
            deadlinePassed
              ? 'bg-red-50 text-red-600'
              : 'bg-amber-50 text-amber-700'
          )}>
            {deadlinePassed ? '⛔ Deadline passed' : `⏰ Deadline: ${new Date(form.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
          </div>
        )}
      </Card>

      {/* Fields */}
      {!form.isOpen || deadlinePassed ? (
        <Card>
          <div className="text-center py-8">
            <AlertCircle size={32} className="mx-auto text-red-300 mb-2" />
            <p className="text-sm font-semibold text-red-600">Applications are closed</p>
          </div>
        </Card>
      ) : (
        <Card className="space-y-5">
          {form.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id] ?? ''}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [field.id]: v }))}
              error={errors[field.id]}
            />
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold transition-colors"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              : <><Send size={16} /> Submit Application</>
            }
          </button>
        </Card>
      )}
    </div>
  );
};

export default RecruitmentApplicationPage;
