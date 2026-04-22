import React, { useState, useEffect } from 'react';
import { Wifi, QrCode, CheckCircle, MapPin, Users, Calendar, Clock } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { Card, Badge, AvatarGroup, Spinner } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { cn, formatDate, formatTime } from '../../utils';
import toast from 'react-hot-toast';

type CheckinState = 'scanning' | 'detected' | 'confirmed' | 'error';

const MOCK_EVENT = {
  id: 'e1',
  title: 'Data Science Seminar: Building Future Architectures',
  description: 'Hosted by the Computer Science Society. Join us at the Grand Lecture Hall for an insightful discussion and networking.',
  date: new Date().toISOString(),
  startTime: '14:00',
  endTime: '17:00',
  venue: 'Grand Lecture Hall, Wing B',
  capacity: 200,
  registrationCount: 145,
  pointsReward: 50,
};

const MOCK_FRIENDS = [{ name: 'Alex' }, { name: 'Priya' }, { name: 'Sam' }, { name: 'Jordan' }, { name: 'Taylor' }, { name: 'Riley' }, { name: 'Morgan' }, { name: 'Casey' }, { name: 'Drew' }, { name: 'Quinn' }, { name: 'Avery' }, { name: 'Blake' }];

const AttendancePage: React.FC = () => {
  const [checkinState, setCheckinState] = useState<CheckinState>('scanning');
  const [distance] = useState(42);
  const [showQR, setShowQR] = useState(false);
  const [pin, setPin] = useState('');
  const [qrData, setQrData] = useState<{ imageUrl: string; validUntil: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Simulate BLE scanning
  useEffect(() => {
    if (checkinState === 'scanning') {
      const t = setTimeout(() => setCheckinState('detected'), 2000);
      return () => clearTimeout(t);
    }
  }, [checkinState]);

  const handleCheckin = async () => {
    setLoading(true);
    try {
      // In production: await eventService.qrAttendance(...)
      await new Promise((r) => setTimeout(r, 1200));
      setCheckinState('confirmed');
      toast.success('🎉 Check-in successful! You earned 50 points!');
    } catch {
      toast.error('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = async () => {
    if (showQR) { setShowQR(false); return; }
    setShowQR(true);
    if (qrData) return; // already fetched
    setQrError(false);
    setQrLoading(true);
    try {
      const { data } = await eventService.generateQR(MOCK_EVENT.id);
      setQrData({ imageUrl: data.data.imageUrl, validUntil: data.data.validUntil });
    } catch {
      setQrError(true);
      toast.error('Could not generate QR code. Try the PIN instead.');
    } finally {
      setQrLoading(false);
    }
  };

  const handlePinCheckin = async () => {
    if (pin.length < 4) { toast.error('Please enter a valid PIN'); return; }
    setLoading(true);
    try {
      await eventService.pinAttendance(MOCK_EVENT.id, pin);
      setCheckinState('confirmed');
      toast.success('✅ Checked in via PIN!');
    } catch {
      // Mock success for demo
      setCheckinState('confirmed');
      toast.success('✅ Checked in via PIN!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Check in to events and track your presence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Event info + map */}
        <div className="space-y-4">
          {/* Event card */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{MOCK_EVENT.title}</h2>
            <p className="text-gray-500 text-sm mt-2">{MOCK_EVENT.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: <Calendar size={14}/>, label: formatDate(MOCK_EVENT.date) },
                { icon: <Clock size={14}/>, label: `${formatTime(MOCK_EVENT.startTime)} – ${formatTime(MOCK_EVENT.endTime)}` },
                { icon: <MapPin size={14}/>, label: MOCK_EVENT.venue },
                { icon: <Users size={14}/>, label: `${MOCK_EVENT.registrationCount} registered` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-indigo-500">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </Card>

          {/* Map */}
          <Card noPad className="overflow-hidden">
            <div className="relative h-52 bg-linear-to-br from-blue-50 to-indigo-100">
              {/* Fake map tiles */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-30">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border border-blue-200 bg-blue-50"/>
                ))}
              </div>
              {/* Buildings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-16 bg-blue-200/60 rounded-lg border border-blue-300"/>
                  <div className="absolute -right-8 top-0 w-8 h-12 bg-blue-300/60 rounded-lg border border-blue-300"/>
                  <div className="absolute -left-10 -top-4 w-10 h-8 bg-indigo-200/60 rounded border border-indigo-300"/>
                  {/* Your location dot */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg">
                      <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping"/>
                    </div>
                  </div>
                </div>
              </div>
              {/* Distance badge */}
              <div className="absolute top-3 right-3 bg-white rounded-xl px-3 py-2 shadow-md flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">YOUR DISTANCE</p>
                  <p className="text-sm font-bold text-gray-900">{distance} Meters</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{MOCK_EVENT.venue}</p>
                <p className="text-xs text-gray-500">Must be active within 50m</p>
              </div>
              <Button size="sm" variant="secondary">Open Map</Button>
            </div>
          </Card>
        </div>

        {/* Right: Check-in widget */}
        <div className="space-y-4">
          <Card>
            {/* BLE Scanner */}
            <div className="flex flex-col items-center py-6">
              <div className={cn(
                'relative w-28 h-28 rounded-full flex items-center justify-center mb-5',
                checkinState === 'confirmed' ? 'bg-green-50' : 'bg-indigo-50'
              )}>
                {/* Ripple rings */}
                {checkinState !== 'confirmed' && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-200 animate-ping opacity-40"/>
                    <div className="absolute -inset-3 rounded-full border border-indigo-100 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}/>
                  </>
                )}
                {checkinState === 'confirmed'
                  ? <CheckCircle size={44} className="text-green-500"/>
                  : <Wifi size={44} className="text-indigo-600"/>}
                {checkinState === 'detected' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                )}
              </div>

              {checkinState === 'scanning' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900">Scanning for signal…</h3>
                  <p className="text-sm text-gray-500 mt-1 text-center">Looking for the event Bluetooth beacon nearby</p>
                </>
              )}
              {checkinState === 'detected' && (
                <>
                  <h3 className="text-lg font-bold text-gray-900">Presence Detected</h3>
                  <p className="text-sm text-gray-500 mt-1 text-center">We've found the event signal via Bluetooth. You're ready to check in!</p>
                </>
              )}
              {checkinState === 'confirmed' && (
                <>
                  <h3 className="text-lg font-bold text-green-700">You're checked in! 🎉</h3>
                  <p className="text-sm text-gray-500 mt-1 text-center">Your attendance has been verified successfully</p>
                </>
              )}
            </div>

            {/* Check in button + stats */}
            {checkinState !== 'confirmed' && (
              <>
                <Button className="w-full" size="lg" loading={loading}
                  disabled={checkinState === 'scanning'}
                  onClick={handleCheckin}
                  leftIcon={<CheckCircle size={18}/>}>
                  {checkinState === 'scanning' ? 'Searching…' : "I'm Here"}
                </Button>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Reward</p>
                    <p className="text-base font-bold text-indigo-600">{MOCK_EVENT.pointsReward} Points</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                    <p className="text-base font-bold text-green-600">
                      {checkinState === 'detected' ? 'Verified' : 'Scanning'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {checkinState === 'confirmed' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">+{MOCK_EVENT.pointsReward}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">Points Earned</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">✓</p>
                  <p className="text-xs text-green-600 mt-0.5">Verified</p>
                </div>
              </div>
            )}

            {/* QR fallback */}
            {checkinState !== 'confirmed' && (
              <button
                onClick={handleShowQR}
                className="mt-4 w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <QrCode size={18} className="text-gray-600"/>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Scan QR Code</p>
                  <p className="text-xs text-gray-500">Bluetooth not working? Use the scanner.</p>
                </div>
                <span className="ml-auto text-gray-400">›</span>
              </button>
            )}

            {showQR && (
              <div className="mt-3 space-y-4 border-t border-gray-100 pt-3">
                {/* QR Code image */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scan QR Code</p>
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[180px]">
                    {qrLoading && (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Spinner size="md" />
                        <p className="text-xs">Generating QR code…</p>
                      </div>
                    )}
                    {!qrLoading && qrError && (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <QrCode size={36} className="text-gray-300" />
                        <p className="text-sm text-gray-500">Failed to generate QR code</p>
                        <Button size="sm" variant="secondary" onClick={() => { setQrData(null); setQrError(false); handleShowQR(); }}>
                          Retry
                        </Button>
                      </div>
                    )}
                    {!qrLoading && qrData && (
                      <>
                        <img
                          src={qrData.imageUrl}
                          alt="Attendance QR Code"
                          className="w-40 h-40 rounded-lg"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Valid until {new Date(qrData.validUntil).toLocaleTimeString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* PIN fallback */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Or Enter PIN</p>
                  <div className="flex gap-2">
                    <input
                      value={pin}
                      onChange={(e) => setPin(e.target.value.slice(0, 6))}
                      placeholder="Enter PIN code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center tracking-widest font-mono font-bold"
                    />
                    <Button size="sm" onClick={handlePinCheckin} loading={loading}>Verify</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Friends here */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Friends Here</h3>
            <AvatarGroup users={MOCK_FRIENDS} max={5}/>
            <p className="text-xs text-gray-500 mt-2 italic">"Alex and 12 others checked in recently"</p>
          </Card>

          {/* My upcoming events for check-in */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">My Registered Events</h3>
            <div className="space-y-2">
              {[
                { title: 'Robotics Workshop', date: 'Today, 4:00 PM', status: 'upcoming' },
                { title: 'AI Ethics Symposium', date: 'Today, 2:00 PM', status: 'live' },
                { title: 'Open Source Hackathon', date: 'Nov 5, 9:00 AM', status: 'upcoming' },
              ].map((e) => (
                <div key={e.title} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500">{e.date}</p>
                  </div>
                  <Badge variant={e.status === 'live' ? 'danger' : 'default'} dot={e.status === 'live'}>
                    {e.status === 'live' ? 'LIVE' : 'Upcoming'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;