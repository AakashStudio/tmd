"use client";

import React, { useState, useEffect } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";
import {
  MapPin,
  Calendar,
  Users,
  Plus,
  Lock,
  Sparkles,
  ShieldCheck,
  Home,
  Check,
  Clock,
  X,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  category: string;
  description: string;
  coverPhotoUrl: string | null;
  startDateTime: string;
  endDateTime: string;
  venue: string;
  address: string;
  isResidential: boolean;
  minAge: number;
  capacity: number;
  seatsLeft: number;
  feeInRupees: number;
  isPaid: boolean;
  entryFee: number;
  requireLinkedin: boolean;
  isLinkedinMandatory: boolean;
  attendanceMode: string;
  organizer: {
    id: string;
    name: string;
    photoUrl: string | null;
    isVerified: boolean;
  };
  attendeeCount: number;
  sampleAttendees: Array<{
    userId: string;
    name: string;
    photoUrl: string | null;
  }>;
  myAttendanceStatus: string | null;
  isOrganizer: boolean;
}

export default function MapPage() {
  const { entitlements } = useProfile();
  const isPro = Boolean(entitlements?.canAccessEvents);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedPinEvent, setSelectedPinEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State for creating events
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("House Party");
  const [newVenue, setNewVenue] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIsResidential, setNewIsResidential] = useState(false);
  const [newCapacity, setNewCapacity] = useState("20");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIsPaid, setNewIsPaid] = useState<boolean>(false);
  const [newEntryFee, setNewEntryFee] = useState<string>("299");
  const [newRequireLinkedin, setNewRequireLinkedin] = useState<boolean>(false);
  const [newIsLinkedinMandatory, setNewIsLinkedinMandatory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join Request Modal State
  const [requestModalEvent, setRequestModalEvent] = useState<EventItem | null>(null);
  const [requestLinkedinUrl, setRequestLinkedinUrl] = useState<string>("");
  const [requestNote, setRequestNote] = useState<string>("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Organizer Manage Requests Modal State
  const [manageModalEvent, setManageModalEvent] = useState<EventItem | null>(null);
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [managePendingAttendees, setManagePendingAttendees] = useState<Array<{
    id: string;
    userId: string;
    name: string;
    age?: number;
    city?: string;
    photoUrl: string | null;
    linkedinUrl: string | null;
    note: string | null;
    joinedAt: string;
  }>>([]);
  const [manageApprovedAttendees, setManageApprovedAttendees] = useState<Array<{
    id: string;
    userId: string;
    name: string;
    age?: number;
    city?: string;
    photoUrl: string | null;
    linkedinUrl: string | null;
    note: string | null;
    joinedAt: string;
  }>>([]);
  const [reviewingAttendeeId, setReviewingAttendeeId] = useState<string | null>(null);

  const categories = [
    "ALL",
    "House Party",
    "Standup",
    "Dinner",
    "Sports",
    "Music",
    "Networking",
  ];

  const fetchEvents = async () => {
    if (!isPro) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const url =
        selectedCategory === "ALL"
          ? "/api/events"
          : `/api/events?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isPro, selectedCategory]);

  const loadManageAttendees = async (eventId: string) => {
    setManageLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setManagePendingAttendees(data.event?.pendingAttendees || []);
        setManageApprovedAttendees(data.event?.approvedAttendees || []);
      }
    } catch (e) {
      console.error("Failed to load attendees", e);
    } finally {
      setManageLoading(false);
    }
  };

  const handleReviewAttendee = async (eventId: string, attendeeId: string, action: "APPROVE" | "REJECT") => {
    setReviewingAttendeeId(attendeeId);
    try {
      const res = await fetch(`/api/events/${eventId}/review-attendee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update attendee status");
      }
      await loadManageAttendees(eventId);
      await fetchEvents();
    } catch (err: any) {
      alert(err.message || "Failed to review attendee");
    } finally {
      setReviewingAttendeeId(null);
    }
  };

  const handleJoinRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalEvent) return;

    if (requestModalEvent.requireLinkedin && requestModalEvent.isLinkedinMandatory) {
      if (!requestLinkedinUrl.trim()) {
        setRequestError("LinkedIn profile URL is mandatory for this event.");
        return;
      }
      const urlRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/i;
      if (!urlRegex.test(requestLinkedinUrl.trim())) {
        setRequestError("Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname).");
        return;
      }
    }

    setIsSubmittingRequest(true);
    setRequestError(null);
    try {
      const res = await fetch(`/api/events/${requestModalEvent.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: requestLinkedinUrl.trim(),
          note: requestNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send join request");
      }
      alert(data.message || "Your join request has been submitted to the organizer!");
      setRequestModalEvent(null);
      setRequestLinkedinUrl("");
      setRequestNote("");
      await fetchEvents();
    } catch (err: any) {
      setRequestError(err.message || "Failed to submit request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newAddress || !newStart || !newEnd || !newDesc) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFee = newIsPaid ? parseInt(newEntryFee, 10) || 0 : 0;
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          description: newDesc,
          venue: newVenue,
          address: newAddress,
          isResidential: newIsResidential,
          capacity: parseInt(newCapacity, 10) || 20,
          startDateTime: new Date(newStart).toISOString(),
          endDateTime: new Date(newEnd).toISOString(),
          attendanceMode: "REQUEST_APPROVAL",
          minAge: 18,
          isPaid: newIsPaid,
          entryFee: parsedFee,
          feeInPaise: parsedFee * 100,
          requireLinkedin: newRequireLinkedin,
          isLinkedinMandatory: newRequireLinkedin && newIsLinkedinMandatory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      alert("Event created successfully!");
      setShowCreateModal(false);
      // Reset form
      setNewTitle("");
      setNewVenue("");
      setNewAddress("");
      setNewDesc("");
      setNewIsPaid(false);
      setNewEntryFee("299");
      setNewRequireLinkedin(false);
      setNewIsLinkedinMandatory(false);
      await fetchEvents();
    } catch (err: any) {
      alert(err.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Non-PRO Gate Screen
  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white pb-24 max-w-md mx-auto px-5 py-6 flex flex-col justify-center">
        <div className="space-y-4 text-center">
          <div className="relative w-16 h-16 mx-auto rounded-lg bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-400 p-0.5 shadow-xl shadow-rose-600/30">
            <div className="w-full h-full rounded-lg bg-zinc-950 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-rose-500 animate-bounce" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> TMD PRO Differentiator
            </div>
            <h1 className="text-2xl font-black tracking-tight">Events Map</h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Meet real people in real life. Curated house parties, standup comedy nights, weekend brunches, and rooftop mixers in your city.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2 text-left w-full pt-1">
            <Card className="p-3 bg-zinc-900/60 border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0 text-sm font-bold">
                🎉
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Exclusive Local Events</span>
                <span className="text-zinc-400">Discover and join verified singles gatherings.</span>
              </div>
            </Card>

            <Card className="p-3 bg-zinc-900/60 border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400 shrink-0 text-sm font-bold">
                🛡️
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Residential Privacy Guard</span>
                <span className="text-zinc-400">Exact home locations revealed only after organizer approval.</span>
              </div>
            </Card>

            <Card className="p-3 bg-zinc-900/60 border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 text-sm font-bold">
                👑
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Host Your Own Events</span>
                <span className="text-zinc-400">Create private or open meetups and approve guest lists.</span>
              </div>
            </Card>
          </div>
        </div>

        <div className="pt-5 space-y-2">
          <Link
            href="/plan"
            className="w-full py-3 px-4 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:opacity-95 shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
          >
            Upgrade to TMD PRO (₹499) to Unlock →
          </Link>
          <p className="text-[11px] text-center text-zinc-500">
            Includes unlimited swipes, all Who Liked You, rewind, and zero ads.
          </p>
        </div>

        <BottomNav />
      </div>
    );
  }

  // 2. Full PRO Events Hub
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-24 max-w-md mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-5 py-3 border-b border-[#1e1e26] flex items-center justify-between sticky top-0 bg-[#0a0a0c]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">Events Map</h1>
            <span className="text-[10px] text-zinc-400">Curated Singles Dates</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="py-1.5 px-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-rose-600/20"
        >
          <Plus className="w-3.5 h-3.5" /> Host Event
        </button>
      </header>

      {/* Category Filter Chips */}
      <div className="px-5 py-2.5 flex gap-2 overflow-x-auto scrollbar-none border-b border-zinc-900 bg-zinc-950/60">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? "bg-rose-500 text-white shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* View Switcher Bar */}
      <div className="px-5 py-2 flex items-center justify-between border-b border-zinc-900 bg-[#0c0c10]">
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              viewMode === "map"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Map View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              viewMode === "list"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> List View
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{events.length} active events</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Locating events near you...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 text-zinc-400">
            <div className="w-16 h-16 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
              🗺️
            </div>
            <h3 className="font-bold text-white text-base">No Events in this Category Yet</h3>
            <p className="text-xs max-w-xs mx-auto">
              Be the first to host a meetup, house party, or activity for local singles!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition"
            >
              Create the First Event
            </button>
          </div>
        ) : viewMode === "map" ? (
          /* INTERACTIVE RADAR / MAP VIEW */
          <div className="space-y-3">
            <div className="relative w-full h-[460px] rounded-2xl bg-[#0d0e14] border border-zinc-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
              {/* Map Background Grid & Radar Rings */}
              <div
                className="absolute inset-0 pointer-events-none transition-transform duration-300"
                style={{
                  transform: `scale(${zoomLevel})`,
                  backgroundImage:
                    "radial-gradient(circle at center, rgba(244,63,94,0.06) 0, rgba(15,23,42,0) 65%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "100% 100%, 32px 32px, 32px 32px",
                }}
              >
                {/* Radar Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-rose-500/15" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-rose-500/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-rose-500/5" />
                
                {/* Center User Location Beacon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-lg animate-pulse" />
                    <div className="absolute -inset-2 rounded-full border border-rose-500/50 animate-ping" />
                  </div>
                </div>
              </div>

              {/* Map Floating Controls */}
              <div className="relative z-10 flex items-center justify-between pointer-events-auto">
                <div className="bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Interactive Map ({Math.round(zoomLevel * 100)}%)</span>
                </div>

                <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0))}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Event Pins on Canvas */}
              <div
                className="absolute inset-0 pointer-events-auto transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {events.map((event, idx) => {
                  // Distribute pins across the map deterministically around the center
                  const total = events.length;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                  const radius = 30 + (idx % 2 === 0 ? 8 : -8); // percentage radius
                  const topPercent = 50 + radius * Math.sin(angle) * 0.75;
                  const leftPercent = 50 + radius * Math.cos(angle) * 0.85;

                  const isSelected = selectedPinEvent?.id === event.id;

                  return (
                    <div
                      key={event.id}
                      style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                      onClick={() => setSelectedPinEvent(event)}
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xl transition-all duration-200 ${
                          isSelected
                            ? "bg-white text-zinc-950 scale-110 ring-2 ring-rose-500 shadow-rose-500/50 z-30"
                            : "bg-zinc-900/90 text-zinc-200 border border-zinc-700/80 hover:bg-zinc-800 hover:border-rose-500"
                        }`}
                      >
                        <MapPin
                          className={`w-3 h-3 ${isSelected ? "text-rose-600" : "text-rose-400"}`}
                        />
                        <span className="truncate max-w-[85px]">{event.venue}</span>
                        {event.isPaid && event.entryFee > 0 ? (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                            ₹{event.entryFee}
                          </span>
                        ) : (
                          <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Instructions or Active Selection Hint */}
              <div className="relative z-10 text-[10px] text-zinc-400 text-center bg-black/60 backdrop-blur-sm py-1 rounded-lg border border-white/5">
                {selectedPinEvent
                  ? "Tap event card below for details & RSVP"
                  : "Tap any pin on the map to inspect venue & attend"}
              </div>
            </div>

            {/* Selected Pin Bottom Card */}
            {selectedPinEvent && (
              <Card className="overflow-hidden border-rose-500/50 bg-zinc-950 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-3">
                <div className="relative h-36 w-full bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      selectedPinEvent.coverPhotoUrl ||
                      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800"
                    }
                    alt={selectedPinEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold border border-white/20 text-[10px]">
                      {selectedPinEvent.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {selectedPinEvent.requireLinkedin && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-md text-white font-bold text-[9px] border border-blue-400/40">
                          {selectedPinEvent.isLinkedinMandatory ? "🔗 LinkedIn Req." : "🔗 LinkedIn"}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-white font-black text-[10px] shadow ${
                        selectedPinEvent.isPaid && selectedPinEvent.entryFee > 0
                          ? "bg-amber-600/90"
                          : "bg-emerald-600/90"
                      }`}>
                        {selectedPinEvent.isPaid && selectedPinEvent.entryFee > 0
                          ? `₹${selectedPinEvent.entryFee}`
                          : "Free"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPinEvent(null)}
                        className="p-1 rounded-full bg-black/60 text-zinc-300 hover:text-white ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-2 inset-x-3 text-white">
                    <h3 className="font-extrabold text-base leading-snug drop-shadow-md">
                      {selectedPinEvent.title}
                    </h3>
                  </div>
                </div>

                <div className="p-3 pt-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        {new Date(selectedPinEvent.startDateTime).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(selectedPinEvent.startDateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="font-bold text-amber-400">
                      {selectedPinEvent.isPaid && selectedPinEvent.entryFee > 0
                        ? `₹${selectedPinEvent.entryFee} Entry`
                        : "🟢 Free Entry"}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">{selectedPinEvent.venue}</span>
                      <span className="text-[11px] text-zinc-400">{selectedPinEvent.address}</span>
                    </div>
                  </div>

                  {selectedPinEvent.requireLinkedin && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                      <span>🔗</span>
                      <span>
                        {selectedPinEvent.isLinkedinMandatory
                          ? "LinkedIn Profile is MANDATORY to submit join request."
                          : "LinkedIn Profile requested by host."}
                      </span>
                    </div>
                  )}

                  {selectedPinEvent.isResidential && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <Home className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Residential privacy enabled: exact flat/house revealed after RSVP approval.
                      </span>
                    </div>
                  )}

                  <p className="text-zinc-400 text-[11px] line-clamp-2">
                    {selectedPinEvent.description}
                  </p>

                  <div className="pt-1">
                    {selectedPinEvent.isOrganizer ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManageModalEvent(selectedPinEvent);
                          loadManageAttendees(selectedPinEvent.id);
                        }}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-4 h-4" /> Manage Guest Requests 📋
                      </button>
                    ) : selectedPinEvent.myAttendanceStatus === "APPROVED" ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> You&apos;re Confirmed!
                      </div>
                    ) : selectedPinEvent.myAttendanceStatus === "REQUESTED" ? (
                      <div className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4" /> Request Submitted (Awaiting Approval)
                      </div>
                    ) : selectedPinEvent.seatsLeft === 0 ? (
                      <div className="w-full py-2 rounded-xl bg-zinc-900 text-zinc-500 font-bold text-xs text-center border border-zinc-800">
                        Event Full (Waitlist)
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRequestModalEvent(selectedPinEvent);
                          setRequestLinkedinUrl("");
                          setRequestNote("");
                          setRequestError(null);
                        }}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-600/30"
                      >
                        Request to Join 🎟️
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* DETAILED LIST VIEW */
          events.map((event) => {
            const isConfirmed = event.myAttendanceStatus === "APPROVED";
            const isPending = event.myAttendanceStatus === "REQUESTED";
            const isFull = event.seatsLeft === 0;

            return (
              <Card
                key={event.id}
                className="overflow-hidden border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition space-y-3"
              >
                {/* Event Image Banner */}
                <div className="relative h-44 w-full bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverPhotoUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold border border-white/20">
                      {event.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {event.requireLinkedin && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/80 backdrop-blur-md text-white font-bold text-[11px] border border-blue-400/40 shadow">
                          {event.isLinkedinMandatory ? "🔗 LinkedIn Req." : "🔗 LinkedIn"}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-white font-black shadow ${
                        event.isPaid && event.entryFee > 0
                          ? "bg-amber-600/90"
                          : "bg-emerald-600/90"
                      }`}>
                        {event.isPaid && event.entryFee > 0 ? `₹${event.entryFee}` : "Free Entry"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 inset-x-3 text-white">
                    <h3 className="font-extrabold text-lg leading-snug drop-shadow-md">
                      {event.title}
                    </h3>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 pt-1 space-y-3">
                  <div className="space-y-1.5 text-xs text-zinc-300">
                    {/* Time */}
                    <div className="flex items-center gap-2 text-zinc-300 font-medium">
                      <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>
                        {new Date(event.startDateTime).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(event.startDateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Venue & Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">{event.venue}</span>
                        <span className="text-[11px] text-zinc-400">{event.address}</span>
                      </div>
                    </div>

                    {/* LinkedIn Requirement Notice */}
                    {event.requireLinkedin && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                        <span>🔗</span>
                        <span>
                          {event.isLinkedinMandatory
                            ? "LinkedIn verification mandatory by host before approval."
                            : "LinkedIn profile requested by host."}
                        </span>
                      </div>
                    )}

                    {/* Residential Warning Notice */}
                    {event.isResidential && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        <span>Residential privacy enabled: exact flat/house revealed after RSVP approval.</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Organizer & Attendees Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.organizer.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={event.organizer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-zinc-400 text-[11px]">
                        Hosted by <span className="text-white font-semibold">{event.organizer.name}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{event.attendeeCount} / {event.capacity} Attending</span>
                    </div>
                  </div>

                  {/* Join Action Button */}
                  <div className="pt-1">
                    {event.isOrganizer ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManageModalEvent(event);
                          loadManageAttendees(event.id);
                        }}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-4 h-4" /> Manage Guest Requests 📋
                      </button>
                    ) : isConfirmed ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> You&apos;re Confirmed!
                      </div>
                    ) : isPending ? (
                      <div className="w-full py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4" /> Request Submitted (Awaiting Approval)
                      </div>
                    ) : isFull ? (
                      <div className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-500 font-bold text-xs text-center border border-zinc-800">
                        Event Full (Waitlist)
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRequestModalEvent(event);
                          setRequestLinkedinUrl("");
                          setRequestNote("");
                          setRequestError(null);
                        }}
                        className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-600/30"
                      >
                        Request to Join 🎟️
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>

      {/* Join Request Modal */}
      {requestModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-rose-500/40 p-6 space-y-4 shadow-2xl relative my-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Request to Join</h2>
                <p className="text-xs text-zinc-400 line-clamp-1">{requestModalEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequestModalEvent(null);
                  setRequestError(null);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Host:</span>
                <span className="font-semibold text-white">{requestModalEvent.organizer.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Entry:</span>
                <span className="font-bold text-amber-400">
                  {requestModalEvent.isPaid && requestModalEvent.entryFee > 0
                    ? `₹${requestModalEvent.entryFee}`
                    : "Free"}
                </span>
              </div>
            </div>

            {requestError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                {requestError}
              </div>
            )}

            <form onSubmit={handleJoinRequestSubmit} className="space-y-3 text-xs">
              {requestModalEvent.requireLinkedin && (
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">
                    LinkedIn Profile Link{" "}
                    {requestModalEvent.isLinkedinMandatory ? (
                      <span className="text-rose-400 font-bold">* (Mandatory)</span>
                    ) : (
                      <span className="text-zinc-500">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="url"
                    required={requestModalEvent.isLinkedinMandatory}
                    value={requestLinkedinUrl}
                    onChange={(e) => setRequestLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/yourname"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs"
                  />
                  {requestModalEvent.isLinkedinMandatory && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      The host requires a valid LinkedIn profile before reviewing your request.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">
                  Note to Host <span className="text-zinc-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Say hi or introduce yourself to the host..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmittingRequest ? "Sending Request..." : "Submit Request to Host 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Requests Modal for Event Host */}
      {manageModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-purple-500/40 p-6 space-y-4 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Guest List & Requests</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
                    Host Dashboard
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 truncate max-w-[240px]">{manageModalEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setManageModalEvent(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Pending Requests Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Pending Requests ({managePendingAttendees.length})
                  </h3>
                </div>

                {manageLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-500">Loading requests...</div>
                ) : managePendingAttendees.length === 0 ? (
                  <div className="py-4 px-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-500">
                    No pending requests at this time.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {managePendingAttendees.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                              <img
                                src={applicant.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                                alt={applicant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{applicant.name}</div>
                              <div className="text-[11px] text-zinc-400">
                                {applicant.age ? `${applicant.age} yrs` : ""} {applicant.city ? `• ${applicant.city}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        {applicant.linkedinUrl && (
                          <div>
                            <a
                              href={applicant.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-medium transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View LinkedIn Profile
                            </a>
                          </div>
                        )}

                        {applicant.note && (
                          <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-300 italic">
                            &quot;{applicant.note}&quot;
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                          <button
                            type="button"
                            disabled={reviewingAttendeeId === applicant.id}
                            onClick={() => handleReviewAttendee(manageModalEvent.id, applicant.id, "APPROVE")}
                            className="flex-1 py-1.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept & Confirm
                          </button>
                          <button
                            type="button"
                            disabled={reviewingAttendeeId === applicant.id}
                            onClick={() => handleReviewAttendee(manageModalEvent.id, applicant.id, "REJECT")}
                            className="py-1.5 px-3 rounded-xl font-medium text-xs text-zinc-400 bg-zinc-800 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmed Attendees Section */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Check className="w-3.5 h-3.5" /> Confirmed Attendees ({manageApprovedAttendees.length} / {manageModalEvent.capacity})
                </h3>

                {manageApprovedAttendees.length === 0 ? (
                  <div className="py-3 px-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-500">
                    No confirmed attendees yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manageApprovedAttendees.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            <img
                              src={att.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                              alt={att.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-white block leading-tight">{att.name}</span>
                            <span className="text-[10px] text-zinc-400">
                              {att.city || "Guest"}
                            </span>
                          </div>
                        </div>

                        {att.linkedinUrl && (
                          <a
                            href={att.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            LinkedIn <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-rose-500/40 p-6 space-y-4 shadow-2xl relative my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Host a Singles Event</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Friday Rooftop Cocktails & Mingling"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="House Party">House Party</option>
                  <option value="Standup">Standup</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Sports">Sports</option>
                  <option value="Music">Music</option>
                  <option value="Networking">Networking</option>
                  <option value="Meetup">Meetup</option>
                </select>
              </div>

              {/* Free vs Paid Event Selection */}
              <div className="space-y-2">
                <label className="text-zinc-400 block font-medium">Event Pricing *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIsPaid(false)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition border ${
                      !newIsPaid
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    🟢 Free Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIsPaid(true)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition border ${
                      newIsPaid
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    💰 Paid Event
                  </button>
                </div>

                {newIsPaid && (
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-amber-500/30 space-y-1.5 animate-in fade-in">
                    <label className="text-amber-400 block text-xs font-semibold">Entry Fee (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        required={newIsPaid}
                        value={newEntryFee}
                        onChange={(e) => setNewEntryFee(e.target.value)}
                        placeholder="e.g. 299"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Entry fee will be shown directly on your event card.
                    </p>
                  </div>
                )}
              </div>

              {/* LinkedIn Verification Requirement */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-blue-500/30 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="requireLinkedin"
                    checked={newRequireLinkedin}
                    onChange={(e) => {
                      setNewRequireLinkedin(e.target.checked);
                      if (!e.target.checked) setNewIsLinkedinMandatory(false);
                    }}
                    className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="requireLinkedin" className="text-white font-medium block">
                      Require LinkedIn Profile Link
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Collect LinkedIn profile from attendees to verify background.
                    </p>
                  </div>
                </div>

                {newRequireLinkedin && (
                  <div className="pl-6 pt-1 border-t border-zinc-800/80 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="isLinkedinMandatory"
                        checked={newIsLinkedinMandatory}
                        onChange={(e) => setNewIsLinkedinMandatory(e.target.checked)}
                        className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-rose-500"
                      />
                      <div>
                        <label htmlFor="isLinkedinMandatory" className="text-rose-400 font-semibold block text-xs">
                          Mark as Mandatory (Required)
                        </label>
                        <p className="text-[10px] text-zinc-400">
                          Bina LinkedIn link ke applicant request nahi bhej payega.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. The Rooftop Lounge"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 102 Arera Hills, Bhopal"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="residential"
                  checked={newIsResidential}
                  onChange={(e) => setNewIsResidential(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="residential" className="text-zinc-300">
                  This is a residential address (Enable address masking)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Capacity</label>
                <input
                  type="number"
                  min="2"
                  max="500"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Host Approval Notice */}
              <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-300">
                <span className="text-base">🛡️</span>
                <span>
                  Host Approval Only: User request bhej sakega. Aap decide karenge kisko approve karna hai aur kisko decline.
                </span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's the vibe? Any dress code or icebreakers?"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Publishing Event..." : "Publish Event 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
