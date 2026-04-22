import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Zap, ChevronRight, ArrowLeft } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useClubs } from '../../hooks/useClubs';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Card, Badge } from '../../components/ui';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venue: z.string().min(3),
  capacity: z.coerce.number().min(1).max(10000),
  eventType: z.enum(['workshop','seminar','hackathon','social','competition','webinar']),
  pointsReward: z.coerce.number().min(0).max(500),
  volunteerHours: z.coerce.number().min(0).max(24),
  tags: z.string(),
  clubId: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const STEPS = ['DETAILS', 'LOGISTICS', 'TICKETING', 'AI INSIGHTS'];

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const { clubs } = useClubs();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { eventType: 'workshop', pointsReward: 50, volunteerHours: 2, capacity: 100 },
  });

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) setHeroPreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHeroPreview(URL.createObjectURL(file));
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try {
      await eventService.create({ ...data, tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      toast.success('Event created successfully!');
      navigate('/events');
    } catch {
      toast.error('Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={16}/> Back
      </button>

      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => setStep(i)} className={cn('flex flex-col items-center gap-1.5 transition-all', i <= step ? 'opacity-100' : 'opacity-40')}>
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all',
                i === step ? 'bg-indigo-600 border-indigo-600 text-white' : i < step ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-white border-gray-300 text-gray-400')}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs font-semibold', i === step ? 'text-indigo-600' : 'text-gray-400')}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-2 rounded', i < step ? 'bg-indigo-600' : 'bg-gray-200')}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Event Details</h2>
            <p className="text-sm text-gray-500 mb-5">Define the soul of your gathering. Be descriptive and engaging.</p>
            <div className="space-y-4">
              <Input label="Event Title" placeholder="The Future of Web3: Networking Mixer" error={errors.title?.message} {...register('title')}/>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hero Imagery</label>
                <div onDragOver={(e) => e.preventDefault()} onDrop={handleImageDrop}
                  className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer group"
                  onClick={() => document.getElementById('hero-input')?.click()}>
                  {heroPreview
                    ? <img src={heroPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg"/>
                    : <>
                        <Upload size={28} className="mx-auto text-gray-300 group-hover:text-indigo-400 transition-colors mb-2"/>
                        <p className="text-sm font-medium text-gray-500">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">High resolution 16:9 images work best (Max 10MB)</p>
                      </>}
                  <input id="hero-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
                </div>
              </div>
              <Textarea label="Description" rows={4} placeholder="Tell the campus why they shouldn't miss this..." error={errors.description?.message} {...register('description')}/>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Club" error={errors.clubId?.message}
                  options={[
                    { value:'',label:'Select club' },
                    ...clubs.map((club) => ({ value: club.id, label: club.name })),
                  ]}
                  {...register('clubId')}/>
                <Select label="Event Type" options={[
                  { value:'workshop',label:'Workshop' },{ value:'seminar',label:'Seminar' },
                  { value:'hackathon',label:'Hackathon' },{ value:'social',label:'Social' },
                  { value:'competition',label:'Competition' },{ value:'webinar',label:'Webinar' },
                ]} {...register('eventType')}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Date" type="date" error={errors.date?.message} {...register('date')}/>
                <Input label="Start Time" type="time" error={errors.startTime?.message} {...register('startTime')}/>
                <Input label="End Time" type="time" error={errors.endTime?.message} {...register('endTime')}/>
              </div>
              <Input label="Venue" placeholder="e.g. Grand Lecture Hall, Wing B" error={errors.venue?.message} {...register('venue')}/>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Capacity" type="number" error={errors.capacity?.message} {...register('capacity')}/>
                <Input label="Points Reward" type="number" error={errors.pointsReward?.message} {...register('pointsReward')}/>
                <Input label="Volunteer Hours" type="number" error={errors.volunteerHours?.message} {...register('volunteerHours')}/>
              </div>
              <Input label="Tags" placeholder="networking, career, web3" helperText="Comma-separated tags" {...register('tags')}/>
            </div>
          </Card>
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Save as Draft</Button>
            <Button type="submit" loading={loading} rightIcon={<ChevronRight size={16}/>}>Next: Logistics</Button>
          </div>
        </form>

        <div className="space-y-4">
          <Card className="border-indigo-100 bg-linear-to-b from-indigo-50/50 to-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center"><Zap size={14} className="text-white"/></div>
              <h3 className="font-bold text-gray-900">AI Strategy Hub</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">I've analyzed your club's past engagement and member schedules. Here are my top recommendations for peak attendance.</p>
            <div className="space-y-3">
              {[
                { match: 92, day: 'Next Thursday', time: '7:00 PM', note: 'Zero overlaps with major course exams and 84% of core members are free.', best: true },
                { match: 76, day: 'Friday', time: '5:30 PM', note: 'Great for casual mixers, though attendance usually drops by 15% after 7 PM.', best: false },
              ].map((s, i) => (
                <div key={i} className={cn('p-3 rounded-xl border', s.best ? 'border-indigo-200 bg-white' : 'border-gray-100 bg-gray-50')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{i === 0 ? 'Recommended Time' : 'Alternative'}</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', s.best ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600')}>{s.match}% Match</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{s.day}, {s.time}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Popular Tags for Insights</p>
              <div className="flex flex-wrap gap-1.5">
                {['#TechMixer', '#Workshop', '#Career'].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer transition-colors">{tag}</span>
                ))}
              </div>
            </div>
          </Card>
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden p-4">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-900/80 to-purple-900/80"/>
            <div className="relative z-10">
              <Badge variant="danger" className="mb-2">LIVE INSIGHT</Badge>
              <p className="text-white text-sm font-medium">34 students recently searched for "Networking Events" on campus.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
