import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

type ShareType = 'certificate' | 'badge' | 'resume';

interface LinkedInShareButtonProps {
  type: 'certificate';
  certificateId: string;
  label?: string;
}

interface LinkedInAchievementShareButtonProps {
  type: ShareType;
  label?: string;
}

type Props = LinkedInShareButtonProps | LinkedInAchievementShareButtonProps;

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function LinkedInShareButton(props: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      let url: string;

      if (props.type === 'certificate') {
        const res = await api.get<{ success: boolean; data: { shareUrl: string } }>(
          `/share/linkedin/certificate/${(props as LinkedInShareButtonProps).certificateId}`
        );
        url = res.data.data.shareUrl;
      } else {
        const res = await api.get<{ success: boolean; data: { shareUrl: string } }>(
          `/share/linkedin/achievement/${props.type}`
        );
        url = res.data.data.shareUrl;
      }

      window.open(url, '_blank', 'width=600,height=560,noopener,noreferrer');
    } catch (error) {
      console.error('LinkedIn share failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg bg-[#0077B5] text-white px-4 py-2 text-sm font-semibold hover:bg-[#006399] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LinkedInIcon className="h-4 w-4" />
      )}
      {props.label ?? 'Share on LinkedIn'}
    </button>
  );
}