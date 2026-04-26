import { useState } from 'react';
import api from '../../services/api';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

// Default fields — in production these come from club config
const DEFAULT_FIELDS: Field[] = [
  { key: 'why_join', label: 'Why do you want to join this club?', type: 'textarea', required: true },
  { key: 'relevant_skills', label: 'Relevant skills or experience', type: 'textarea', required: true },
  { key: 'availability', label: 'Availability (hours per week)', type: 'select', options: ['1-3', '4-6', '7-10', '10+'], required: true },
  { key: 'portfolio_link', label: 'Portfolio / LinkedIn (optional)', type: 'text' },
];

export const RecruitmentApplicationForm = ({
  clubId,
  clubName,
  onSuccess,
}: {
  clubId: string;
  clubName: string;
  onSuccess?: () => void;
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const missing = DEFAULT_FIELDS.filter(
      (f) => f.required && !formData[f.key]?.trim()
    );
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post(`/clubs/${clubId}/applications`, { formData });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-800">Application Submitted!</h3>
        <p className="text-sm text-gray-500 mt-2">
          We'll notify you about updates for <strong>{clubName}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Apply to {clubName}</h2>
      <p className="text-sm text-gray-500 mb-6">Fill in the form below to submit your application.</p>

      <div className="space-y-5">
        {DEFAULT_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
};