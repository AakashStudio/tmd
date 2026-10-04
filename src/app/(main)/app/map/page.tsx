'use client';

import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Plus, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage?: string;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  venueName: string;
  address: string;
  latitude: number;
  longitude: number;
  eventType: string;
  capacity: number;
  entryFee: number | null;
  attendanceMode: string;
  organizerName: string;
  organizerVerified: boolean;
  attendeeCount: number;
  status: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'house_party', label: 'House Party' },
  { value: 'standup', label: 'Comedy' },
  { value: 'music', label: 'Live Music' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'sports', label: 'Fitness' },
];

const categoryLabels: Record<string, string> = {
  house_party: 'House Party',
  standup: 'Comedy',
  music: 'Live Music',
  sports: 'Fitness',
  dinner: 'Dinner',
  networking: 'Networking',
  workshop: 'Workshop',
  game_night: 'Game Night',
  meetup: 'Meetup',
  other: 'Other',
};

const MAP_COORDS = [
  { x: 38, y: 35 },
  { x: 62, y: 48 },
  { x: 45, y: 65 },
  { x: 70, y: 25 },
  { x: 25, y: 72 },
  { x: 55, y: 80 },
];

export default function MapPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'house_party',
    eventDate: '',
    startTime: '20:00',
    venueName: '',
    address: '',
    capacity: '30',
    entryFee: '0',
    attendanceMode: 'open',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all'
        ? '/api/events'
        : `/api/events?category=${selectedCategory}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 403 && data.data?.locked) {
        setIsLocked(true);
      } else if (data.success && Array.isArray(data.data)) {
        setIsLocked(false);
        setEvents(data.data);
        if (data.data.length > 0 && !selectedEvent) {
          setSelectedEvent(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    setJoining(true);
    try {
      const res = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Successfully joined event!');
        loadEvents();
      } else {
        alert(data.error || 'Failed to join');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          category: createForm.category,
          eventDate: createForm.eventDate,
          startTime: createForm.startTime,
          venueName: createForm.venueName.trim(),
          address: createForm.address.trim(),
          capacity: parseInt(createForm.capacity) || 20,
          entryFeeInr: parseInt(createForm.entryFee) || 0,
          attendanceMode: createForm.attendanceMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateEvent(false);
        loadEvents();
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Locked Pro Gate State
  if (isLocked) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 text-center select-none bg-[#08080A]">
        <div className="w-16 h-16 rounded-full bg-[#1A1A22] border border-[#2D2D38] flex items-center justify-center mb-4 shadow-xl shadow-[#FF1493]/20">
          <Lock size={28} className="text-[#FF1493]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#FF1493]/15 text-[#FF1493] text-xs font-bold mb-3">
          <Sparkles size={13} /> ₹499 Pro Exclusive
        </div>
        <h2 className="tmd-h1 text-white mb-2">Events Map is Locked</h2>
        <p className="tmd-body text-[#A1A1AA] max-w-xs mb-8 leading-relaxed">
          TMD Events Map lets Pro members join and host exclusive rooftop house parties, comedy gigs, and singles mixers.
        </p>

        <Button
          onClick={() => window.location.href = '/app/plan'}
          size="lg"
          className="gap-2 shadow-lg shadow-[#FF1493]/25"
        >
          <span>Upgrade to Pro — ₹499</span>
          <ArrowRight size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col select-none overflow-hidden bg-[#08080A]">
      {/* Top Header */}
      <header className="px-4 py-2.5 bg-[#0E0E12] border-b border-[#1E1E26] z-30 flex items-center justify-between">
        <div>
          <h1 className="tmd-h3 text-white">Events Map</h1>
          <p className="tmd-caption text-[#A1A1AA]">Exclusive mixers & nightlife</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Toggle */}
          <div className="flex bg-[#121216] p-0.5 rounded-[6px] border border-[#1E1E26]">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#FF1493] text-white shadow-sm' : 'text-[#71717A] hover:text-white'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#FF1493] text-white shadow-sm' : 'text-[#71717A] hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateEvent(true)}
            className="h-8 px-2.5 bg-[#1A1A22] border border-[#2D2D38] hover:border-[#FF1493] text-white text-xs font-bold rounded-[6px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[#FF1493]" />
            <span>Host</span>
          </button>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="px-3 py-2 border-b border-[#1E1E26] bg-[#0E0E12]">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'bg-[#121216] text-[#A1A1AA] border border-[#1E1E26] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode 1: Vector Night-Map Canvas */}
      {viewMode === 'map' && (
        <div className="flex-1 relative overflow-hidden bg-[#060608] flex flex-col justify-between">
          <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#121216" strokeWidth="1" />
                </pattern>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF1493" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <circle cx="50%" cy="45%" r="180" fill="url(#mapGlow)" />

              <path d="M -20 180 Q 150 120 450 220" stroke="#1E1E26" strokeWidth="3" fill="none" />
              <path d="M 120 -20 Q 200 250 180 600" stroke="#1E1E26" strokeWidth="4" fill="none" />
              <path d="M 320 -20 Q 280 300 360 600" stroke="#1A1A22" strokeWidth="3" fill="none" />
              <path d="M -20 380 Q 200 420 450 340" stroke="#1E1E26" strokeWidth="3" fill="none" />

              <circle cx="50%" cy="45%" r="80" stroke="#FF1493" strokeOpacity="0.15" strokeDasharray="4 4" fill="none" />
              <circle cx="50%" cy="45%" r="160" stroke="#FF1493" strokeOpacity="0.1" strokeDasharray="6 6" fill="none" />
            </svg>

            {/* Glowing Map Pins */}
            {events.map((evt, idx) => {
              const coord = MAP_COORDS[idx % MAP_COORDS.length];
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                >
                  {isSelected && (
                    <span className="absolute -inset-2 rounded-full bg-[#FF1493]/30 animate-ping pointer-events-none" />
                  )}

                  <div
                    className={`px-2.5 py-1 rounded-[6px] border flex items-center gap-1.5 shadow-xl transition-all ${
                      isSelected
                        ? 'bg-[#FF1493] border-[#FF4D6D] text-white scale-110 shadow-[#FF1493]/40'
                        : 'bg-[#121216] border-[#2D2D38] text-white hover:border-[#FF1493]'
                    }`}
                  >
                    <MapPin size={12} className={isSelected ? 'text-white' : 'text-[#FF4D6D]'} />
                    <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                      {evt.title.length > 14 ? `${evt.title.slice(0, 14)}...` : evt.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div />

          {/* Selected Event Bottom Card Preview */}
          {selectedEvent && (
            <div className="z-20 p-3 animate-slide-up">
              <div className="bg-[#121216] border border-[#1E1E26] rounded-[8px] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-16 h-16 rounded-[6px] overflow-hidden bg-[#1A1A22] flex-shrink-0 relative">
                    <img
                      src={selectedEvent.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#FF1493] text-white px-1 rounded-[3px]">
                      {selectedEvent.entryFee ? `₹${selectedEvent.entryFee}` : 'FREE'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] text-[#FF4D6D] font-bold uppercase tracking-wider mb-0.5">
                      <span>{categoryLabels[selectedEvent.category] || selectedEvent.category}</span>
                      <span>•</span>
                      <span>{formatDate(selectedEvent.eventDate)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate leading-snug">
                      {selectedEvent.title}
                    </h3>

                    <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-[#71717A] flex-shrink-0" /> {selectedEvent.venueName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-[#16161C] border-t border-[#1E1E26]">
                  <span className="text-[11px] text-[#A1A1AA] flex items-center gap-1">
                    <Users size={12} className="text-[#FF4D6D]" /> {selectedEvent.attendeeCount} / {selectedEvent.capacity} joined
                  </span>

                  <button
                    type="button"
                    onClick={() => handleJoinEvent(selectedEvent.id)}
                    disabled={joining}
                    className="h-7 px-3 bg-[#FF1493] hover:bg-[#E0007E] text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                  >
                    {joining ? 'Joining...' : 'Join Event'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Event Feed List */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events in this area"
              description="Be the first to host a party, mixer, or meetup in your city."
              actionLabel="Host an Event"
              onAction={() => setShowCreateEvent(true)}
            />
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#121216] border border-[#1E1E26] rounded-[8px] overflow-hidden shadow-md space-y-3 p-3.5"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-[6px] overflow-hidden bg-[#1A1A22] flex-shrink-0 relative">
                    <img
                      src={evt.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#FF1493] text-white px-1.5 py-0.2 rounded-[3px]">
                      {evt.entryFee ? `₹${evt.entryFee}` : 'FREE'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="tmd-metadata text-[#FF4D6D] block">
                      {categoryLabels[evt.category] || evt.category} • {formatDate(evt.eventDate)}
                    </span>
                    <h3 className="tmd-h3 text-white truncate mt-0.5">{evt.title}</h3>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1">{evt.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1E1E26] text-xs">
                  <span className="text-[#A1A1AA] flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-[#71717A] flex-shrink-0" /> {evt.venueName}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleJoinEvent(evt.id)}
                    disabled={joining}
                    className="px-3 py-1 bg-[#FF1493] text-white font-bold rounded-[6px] hover:bg-[#E0007E] transition-colors cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Host Event Bottom Sheet */}
      <BottomSheet isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} title="Host Nightlife Event">
        <form onSubmit={handleCreateEvent} className="space-y-3 pb-4">
          <Input
            label="Event Title"
            placeholder="e.g. Rooftop Sunset Mixer"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full h-11 px-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#FF1493]"
              >
                {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Date"
              type="date"
              value={createForm.eventDate}
              onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Venue Name"
              placeholder="e.g. Skyline Lounge"
              value={createForm.venueName}
              onChange={(e) => setCreateForm({ ...createForm, venueName: e.target.value })}
              required
            />
            <Input
              label="Capacity"
              type="number"
              value={createForm.capacity}
              onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
              required
            />
          </div>

          <Input
            label="Full Address / City"
            placeholder="Street address or location details"
            value={createForm.address}
            onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="What to expect, dress code, vibe..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-3 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white text-xs placeholder-[#71717A] focus:outline-none focus:border-[#FF1493] resize-none"
              required
            />
          </div>

          <Button type="submit" loading={creating} fullWidth size="lg">
            Publish Event
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
