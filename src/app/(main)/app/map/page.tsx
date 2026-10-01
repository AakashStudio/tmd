'use client';

import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, Plus, Lock, Sparkles, CheckCircle2, Shield, ArrowRight, X, Layers, Compass, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';

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
  { value: 'music', label: 'Music' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'sports', label: 'Fitness' },
];

const categoryLabels: Record<string, string> = {
  house_party: 'House Party',
  standup: 'Standup',
  music: 'Live Music',
  sports: 'Sports',
  dinner: 'Dinner',
  networking: 'Networking',
  workshop: 'Workshop',
  game_night: 'Game Night',
  meetup: 'Meetup',
  other: 'Other',
};

// Map pin locations for realistic urban map coordinates
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

  // Locked Pro Gate State (Master Spec Section 28 & 38)
  if (isLocked) {
    return (
      <div className="h-[calc(100dvh-4rem)] flex flex-col justify-center items-center px-6 py-12 text-center select-none">
        <div className="w-16 h-16 rounded-[8px] bg-[#141414] border border-[#242424] flex items-center justify-center mb-4 shadow-xl shadow-[#E91E63]/20">
          <Lock size={30} className="text-[#E91E63]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#E91E63]/15 text-[#E91E63] text-xs font-bold mb-3">
          <Sparkles size={13} /> ₹499 Pro Exclusive
        </div>
        <h2 className="tmd-h1 text-white mb-2">Events Map is Locked</h2>
        <p className="tmd-body text-[#9E9E9E] max-w-xs mb-8 leading-relaxed">
          TMD Events Map lets Pro members join and host exclusive rooftop house parties, comedy gigs, and singles mixers.
        </p>

        <Button
          onClick={() => window.location.href = '/app/plan'}
          size="lg"
          className="gap-2 shadow-lg shadow-[#E91E63]/25"
        >
          <span>Upgrade to Pro — ₹499</span>
          <ArrowRight size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col select-none overflow-hidden bg-[#0A0A0A]">
      {/* Top Header */}
      <header className="px-4 py-2.5 border-b border-[#1A1A1A] bg-[#0E0E0E]/95 backdrop-blur-md z-30 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">Events Map</h1>
          <p className="text-[11px] text-[#888888]">Exclusive mixers & nightlife</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Toggle */}
          <div className="flex bg-[#161616] p-0.5 rounded-[6px] border border-[#242424]">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#E91E63] text-white shadow-sm' : 'text-[#888888] hover:text-white'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#E91E63] text-white shadow-sm' : 'text-[#888888] hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setShowCreateEvent(true)}
            className="h-8 px-2.5 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E91E63] text-white text-xs font-bold rounded-[6px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[#E91E63]" />
            <span>Host</span>
          </button>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="px-3 py-2 border-b border-[#181818] bg-[#0D0D0D]">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#E91E63] text-white shadow-sm'
                  : 'bg-[#141414] text-[#888888] border border-[#222222] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode 1: Interactive Vector Night-Map Canvas */}
      {viewMode === 'map' && (
        <div className="flex-1 relative overflow-hidden bg-[#070707] flex flex-col justify-between">
          {/* Stylized Vector Radar Map */}
          <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141414" strokeWidth="1" />
                </pattern>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E91E63" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <circle cx="50%" cy="45%" r="180" fill="url(#mapGlow)" />

              {/* Stylized Road Network Lines */}
              <path d="M -20 180 Q 150 120 450 220" stroke="#1C1C1C" strokeWidth="3" fill="none" />
              <path d="M 120 -20 Q 200 250 180 600" stroke="#1C1C1C" strokeWidth="4" fill="none" />
              <path d="M 320 -20 Q 280 300 360 600" stroke="#1A1A1A" strokeWidth="3" fill="none" />
              <path d="M -20 380 Q 200 420 450 340" stroke="#1C1C1C" strokeWidth="3" fill="none" />

              {/* Radial Radar Rings */}
              <circle cx="50%" cy="45%" r="80" stroke="#E91E63" strokeOpacity="0.15" strokeDasharray="4 4" fill="none" />
              <circle cx="50%" cy="45%" r="160" stroke="#E91E63" strokeOpacity="0.1" strokeDasharray="6 6" fill="none" />
            </svg>

            {/* Glowing Interactive Event Pins */}
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
                  {/* Pulse Ring */}
                  {isSelected && (
                    <span className="absolute -inset-2 rounded-[8px] bg-[#E91E63]/30 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Surface (Strict 8px radius) */}
                  <div
                    className={`px-2 py-1 rounded-[6px] border flex items-center gap-1.5 shadow-xl transition-all ${
                      isSelected
                        ? 'bg-[#E91E63] border-[#FF6F61] text-white scale-110 shadow-[#E91E63]/40'
                        : 'bg-[#141414] border-[#2A2A2A] text-white hover:border-[#E91E63]'
                    }`}
                  >
                    <MapPin size={12} className={isSelected ? 'text-white' : 'text-[#FF6F61]'} />
                    <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                      {evt.title.length > 14 ? `${evt.title.slice(0, 14)}...` : evt.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div />

          {/* Bottom Selected Event Preview Card */}
          {selectedEvent && (
            <div className="z-20 p-3 animate-slide-up">
              <div className="bg-[#121212] border border-[#242424] rounded-[8px] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-16 h-16 rounded-[6px] overflow-hidden bg-[#1E1E1E] flex-shrink-0 relative">
                    <img
                      src={selectedEvent.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-black bg-[#E91E63] text-white px-1 rounded-[3px]">
                      {selectedEvent.entryFee ? `₹${selectedEvent.entryFee}` : 'FREE'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] text-[#FF6F61] font-bold uppercase tracking-wider mb-0.5">
                      <span>{categoryLabels[selectedEvent.category] || selectedEvent.category}</span>
                      <span>•</span>
                      <span>{formatDate(selectedEvent.eventDate)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate leading-snug">
                      {selectedEvent.title}
                    </h3>

                    <p className="text-[11px] text-[#888888] truncate mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-[#666666] flex-shrink-0" /> {selectedEvent.venueName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-[#161616] border-t border-[#1E1E1E]">
                  <span className="text-[11px] text-[#888888] flex items-center gap-1">
                    <Users size={12} className="text-[#FF6F61]" /> {selectedEvent.attendeeCount} / {selectedEvent.capacity} joined
                  </span>

                  <button
                    onClick={() => handleJoinEvent(selectedEvent.id)}
                    disabled={joining}
                    className="h-7 px-3 bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                  >
                    {joining ? 'Joining...' : 'Join Event'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Structured List Feed */}
      {viewMode === 'list' && (
        <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-[#141414] rounded-[8px] animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3 bg-[#121212] border border-[#202020] rounded-[8px] p-6">
              <div className="w-12 h-12 rounded-[8px] bg-[#181818] border border-[#262626] flex items-center justify-center mx-auto text-[#616161]">
                <MapPin size={22} />
              </div>
              <h3 className="tmd-h3 text-white">No events in this category</h3>
              <p className="tmd-body-small text-[#9E9E9E] max-w-xs mx-auto">
                Be the first Pro member to host an event in your city.
              </p>
              <Button size="sm" onClick={() => setShowCreateEvent(true)}>
                Host an Event
              </Button>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-[#121212] rounded-[8px] overflow-hidden border border-[#222222] hover:border-[#383838] transition-all cursor-pointer shadow-lg group"
              >
                <div className="relative h-36 w-full bg-[#181818] overflow-hidden">
                  <img
                    src={event.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md border border-white/10 text-white px-2 py-0.5 rounded-[4px]">
                      {categoryLabels[event.category] || event.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-xs font-black bg-[#E91E63] text-white px-2 py-0.5 rounded-[4px] shadow-md">
                      {event.entryFee ? `₹${event.entryFee}` : 'Free'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="text-sm font-bold text-white drop-shadow-md truncate">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="p-3 space-y-1.5 text-xs text-[#9E9E9E]">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <Calendar size={12} className="text-[#FF6F61]" />
                      <span>{formatDate(event.eventDate)}</span>
                      <span className="text-[#555555]">•</span>
                      <span>{event.startTime}</span>
                    </div>
                    <span className="text-[#616161] flex items-center gap-1">
                      <Users size={11} /> {event.attendeeCount} / {event.capacity} seats
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1C1C1C]">
                    <span className="truncate text-[#888888] flex items-center gap-1">
                      <MapPin size={11} /> {event.venueName}
                    </span>
                    <span className="text-xs font-bold text-[#E91E63]">
                      Join →
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* Host Event Bottom Sheet (Master Spec Pro Feature) */}
      {showCreateEvent && (
        <BottomSheet isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} title="Host New Nightlife Event">
          <form onSubmit={handleCreateEvent} className="space-y-3.5 pb-4">
            <Input
              label="Event Title"
              placeholder="e.g. Bandra Rooftop Sunset Mixer"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#9E9E9E] mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full h-11 px-3 bg-[#141414] border border-[#242424] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#E91E63]"
              >
                <option value="house_party">House Party</option>
                <option value="standup">Standup Comedy</option>
                <option value="music">Live Music</option>
                <option value="dinner">Dinner Mixer</option>
                <option value="sports">Sports / Fitness</option>
                <option value="game_night">Game Night</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Date"
                type="date"
                value={createForm.eventDate}
                onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                required
              />
              <Input
                label="Time"
                type="time"
                value={createForm.startTime}
                onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                required
              />
            </div>

            <Input
              label="Venue Name"
              placeholder="e.g. Olive Bar & Kitchen"
              value={createForm.venueName}
              onChange={(e) => setCreateForm({ ...createForm, venueName: e.target.value })}
              required
            />

            <Input
              label="Full Address"
              placeholder="Locality, City"
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Max Capacity"
                type="number"
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                min="2"
                max="100"
                required
              />
              <Input
                label="Entry Fee (₹)"
                type="number"
                value={createForm.entryFee}
                onChange={(e) => setCreateForm({ ...createForm, entryFee: e.target.value })}
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9E9E9E] mb-1">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="What should guests expect?"
                rows={3}
                className="w-full px-3 py-2 bg-[#141414] border border-[#242424] rounded-[8px] text-white text-xs placeholder-[#555555] focus:outline-none focus:border-[#E91E63] resize-none"
                required
              />
            </div>

            <Button type="submit" loading={creating} fullWidth size="lg">
              Publish Event to Map
            </Button>
          </form>
        </BottomSheet>
      )}
    </div>
  );
}
