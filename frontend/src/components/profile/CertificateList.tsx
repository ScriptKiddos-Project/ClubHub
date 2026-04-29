// components/profile/CertificateList.tsx
// Lists all earned certificates with download + share options.

import React, { useState } from 'react';
import { Award, Download, Share2, Loader2, FileText } from 'lucide-react';
import { cn } from '../../utils';
import { downloadCertificate } from '../../services/phase3Service';
import type { Certificate } from '../../types/phase3';
import toast from 'react-hot-toast';

// ── Single certificate card ───────────────────────────────────────────────────
const CertCard: React.FC<{ cert: Certificate }> = ({ cert }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await downloadCertificate(cert.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${cert.eventTitle.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Download failed. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = `🎓 I earned a certificate for attending "${cert.eventTitle}" organized by ${cert.clubName}!\n\n${cert.aictePoints} AICTE points · ${cert.volunteerHours}h volunteer hours\n\n#ClubHub #AICTE`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My ClubHub Certificate', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Share text copied to clipboard!');
    }
  };

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
          <Award size={22} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">{cert.eventTitle}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{cert.clubName}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              ⭐ {cert.aictePoints} pts
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              ⏱ {cert.volunteerHours}h
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download PDF"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
              downloading
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            )}
          >
            {downloading
              ? <Loader2 size={14} className="animate-spin" />
              : <Download size={14} />
            }
          </button>
          <button
            onClick={handleShare}
            title="Share"
            className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── List component ────────────────────────────────────────────────────────────
interface CertificateListProps {
  certificates: Certificate[];
}

const CertificateList: React.FC<CertificateListProps> = ({ certificates }) => {
  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-3">
          <FileText size={24} />
        </div>
        <p className="text-sm font-semibold text-gray-500">No certificates yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Attend events and complete your attendance to earn certificates automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {certificates.map((cert) => (
        <CertCard key={cert.id} cert={cert} />
      ))}
    </div>
  );
};

export default CertificateList;
