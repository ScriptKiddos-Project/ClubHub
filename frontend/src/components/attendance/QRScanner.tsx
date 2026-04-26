import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export const QRScanner: React.FC<Props> = ({ onScan, onError }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(onScan, onError ?? console.warn);
    return () => { scanner.clear().catch(console.error); };
  }, [onScan, onError]);

  return (
    <div className="w-full">
      <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
      <p className="text-xs text-center text-gray-400 mt-2">
        Point your camera at the event QR code
      </p>
    </div>
  );
};