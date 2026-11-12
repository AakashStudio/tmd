"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  Plus,
  Minus,
  QrCode,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

export interface EventBookingItem {
  id: string;
  title: string;
  category: string;
  venue: string;
  address: string;
  startDateTime: string;
  endDateTime: string;
  coverPhotoUrl: string | null;
  seatsLeft: number;
  malePassPrice?: number;
  femalePassPrice?: number;
  couplePassPrice?: number;
  generalPassPrice?: number;
  fnbCoverIncluded?: string | null;
  convenienceFee?: number;
  myTicket?: {
    id: string;
    ticketCode: string;
    ticketType: string;
    quantity: number;
    totalAmountInRupees?: number;
    checkedIn?: boolean;
  } | null;
}

interface EventTicketBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventBookingItem;
  userProfile?: {
    name?: string;
    phone?: string;
  };
  onBookingComplete?: () => void;
}

type PassType = "MALE_PASS" | "FEMALE_PASS" | "COUPLE_PASS" | "GENERAL_PASS";

export const EventTicketBookingModal: React.FC<EventTicketBookingModalProps> = ({
  isOpen,
  onClose,
  event,
  userProfile,
  onBookingComplete,
}) => {
  const [selectedPass, setSelectedPass] = useState<PassType>("MALE_PASS");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm">("gpay");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedTicket, setConfirmedTicket] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AstroTalk-style Direct UPI Overlay
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);

  const MERCHANT_VPA = "thematchdate@okaxis";
  const MERCHANT_NAME = "The Match Date";

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  };

  useEffect(() => {
    if (event?.myTicket) {
      setConfirmedTicket({
        ticketCode: event.myTicket.ticketCode,
        ticketType: event.myTicket.ticketType,
        quantity: event.myTicket.quantity,
        attendeeName: userProfile?.name || "Guest",
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          event.myTicket.ticketCode
        )}`,
      });
    } else {
      setConfirmedTicket(null);
    }
  }, [event, userProfile?.name]);

  if (!isOpen) return null;

  // Pass pricing options
  const passTiers = [
    {
      type: "MALE_PASS" as PassType,
      name: "Male Entry Pass",
      subtitle: "Single male entry",
      price: event.malePassPrice || 499,
      badge: "Popular",
    },
    {
      type: "FEMALE_PASS" as PassType,
      name: "Female Entry Pass",
      subtitle: "Single female entry",
      price: event.femalePassPrice || 199,
      badge: "Special 60% Off",
    },
    {
      type: "COUPLE_PASS" as PassType,
      name: "Couple / 2 Friends Pass",
      subtitle: "Entry for 2 people",
      price: event.couplePassPrice || 799,
      badge: "Best Value",
    },
    {
      type: "GENERAL_PASS" as PassType,
      name: "General Admission",
      subtitle: "Standard entry pass",
      price: event.generalPassPrice || 399,
      badge: null,
    },
  ];

  const currentPass = passTiers.find((p) => p.type === selectedPass) || passTiers[0];
  const baseTicketAmount = currentPass.price * quantity;
  const convenienceFee = event.convenienceFee || 39;
  const totalPayable = baseTicketAmount + convenienceFee;

  // 1. Trigger UPI App Intent & Open Confirmation Modal
  const handleProceedToPayment = () => {
    const txnRef = `tmd_tkt_${Date.now()}`;
    const txnNote = `TMD Pass: ${event.title.slice(0, 25)}`;
    const baseUpiParams = `pa=${encodeURIComponent(MERCHANT_VPA)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${totalPayable}&cu=INR&tn=${encodeURIComponent(txnNote)}&tr=${encodeURIComponent(txnRef)}`;

    if (isMobile()) {
      let appUrl = `upi://pay?${baseUpiParams}`;
      if (selectedUpiApp === "gpay") {
        appUrl = `tez://upi/pay?${baseUpiParams}`;
      } else if (selectedUpiApp === "phonepe") {
        appUrl = `phonepe://pay?${baseUpiParams}`;
      } else if (selectedUpiApp === "paytm") {
        appUrl = `paytmmp://pay?${baseUpiParams}`;
      }

      try {
        window.location.href = appUrl;
      } catch (e) {
        // Continue to overlay
      }
    }

    setShowUpiModal(true);
  };

  // 2. Finalize Booking & Generate Digital Ticket
  const executeBooking = async (utr?: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const res = await fetch(`/api/events/${event.id}/book-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketType: selectedPass,
          quantity,
          attendeeName: userProfile?.name || "Guest",
          attendeePhone: userProfile?.phone || "",
          paymentMethod: selectedUpiApp.toUpperCase(),
          utrNumber: utr || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book ticket");
      }

      setShowUpiModal(false);
      setConfirmedTicket(data.ticket);
      if (onBookingComplete) onBookingComplete();
    } catch (err: any) {
      setErrorMessage(err.message || "Payment could not be processed");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 select-none animate-in fade-in">
      <div className="w-full sm:max-w-md h-[94vh] sm:h-auto sm:max-h-[92vh] bg-[#0c0c10] text-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border border-white/10">
        {/* Header */}
        <div className="px-5 py-4 bg-[#121217] flex items-center justify-between border-b border-zinc-800/80 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#FFC629] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">Book Event Passes</h2>
              <p className="text-[10px] text-zinc-400">Official TMD Ticketing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {/* CONFIRMED DIGITAL TICKET PASS VIEW */}
          {confirmedTicket ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest inline-block">
                  ✓ Booking Confirmed
                </span>
                <h3 className="text-lg font-black text-white">You're on the Guest List! 🎉</h3>
                <p className="text-xs text-zinc-400">
                  Show this QR pass at the cafe door for direct check-in.
                </p>
              </div>

              {/* Digital Golden Boarding Pass */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#1c1c24] via-[#121216] to-[#0a0a0d] border border-amber-500/40 p-5 shadow-2xl overflow-hidden">
                {/* Decorative cutouts */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#0c0c10] border-r border-amber-500/30 -translate-y-1/2" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#0c0c10] border-l border-amber-500/30 -translate-y-1/2" />

                {/* Event Title & Category */}
                <div className="space-y-1 border-b border-dashed border-zinc-800 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#FFC629] uppercase tracking-wider">
                      {event.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">
                      {confirmedTicket.ticketCode}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white leading-tight">{event.title}</h4>
                </div>

                {/* Venue & Date Details */}
                <div className="grid grid-cols-2 gap-3 py-3 border-b border-dashed border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">When</span>
                    <span className="font-bold text-zinc-200">
                      {formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Where</span>
                    <span className="font-bold text-zinc-200 truncate block">{event.venue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Pass Type</span>
                    <span className="font-bold text-amber-400">
                      {confirmedTicket.quantity}x {confirmedTicket.ticketType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Guest Name</span>
                    <span className="font-bold text-zinc-200 truncate block">
                      {confirmedTicket.attendeeName}
                    </span>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="pt-4 flex flex-col items-center justify-center">
                  <div className="p-3 rounded-2xl bg-white shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={confirmedTicket.qrCodeUrl}
                      alt="Ticket QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 mt-2 tracking-widest">
                    {confirmedTicket.ticketCode}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Scan at door for instant entry</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFC629] to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  Done & View on Map ✨
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Event Mini Overview Card */}
              <div className="p-3.5 rounded-2xl bg-[#14141a] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#FFC629] text-[10px] font-black uppercase">
                    {event.category}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {event.seatsLeft} seats left
                  </span>
                </div>

                <h3 className="text-sm font-black text-white">{event.title}</h3>

                <div className="space-y-1 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">
                      {event.venue} — {event.address}
                    </span>
                  </div>
                </div>

                {event.fnbCoverIncluded && (
                  <div className="mt-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{event.fnbCoverIncluded}</span>
                  </div>
                )}
              </div>

              {/* Select Ticket Pass Section (BookMyShow Style) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                  1. Select Pass Type
                </h4>

                <div className="space-y-2">
                  {passTiers.map((tier) => (
                    <div
                      key={tier.type}
                      onClick={() => setSelectedPass(tier.type)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedPass === tier.type
                          ? "bg-gradient-to-r from-amber-500/15 to-transparent border-[#FFC629] shadow-md ring-1 ring-[#FFC629]"
                          : "bg-[#14141a] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{tier.name}</span>
                          {tier.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block">{tier.subtitle}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-black text-white">
                          ₹{tier.price}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedPass === tier.type
                              ? "border-[#FFC629] bg-[#FFC629]"
                              : "border-zinc-600 bg-zinc-900"
                          }`}
                        >
                          {selectedPass === tier.type && (
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="p-3.5 rounded-2xl bg-[#14141a] border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Number of Passes</span>
                  <span className="text-[10px] text-zinc-400">Max 5 passes per booking</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-black text-base text-white w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                    disabled={quantity >= 5}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* UPI Payment Options */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                  2. Pay via UPI (Instant Confirmation)
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUpiApp("gpay")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                      selectedUpiApp === "gpay"
                        ? "bg-amber-500/15 border-amber-400"
                        : "bg-[#14141a] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">GPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUpiApp("phonepe")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                      selectedUpiApp === "phonepe"
                        ? "bg-amber-500/15 border-amber-400"
                        : "bg-[#14141a] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">PhonePe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUpiApp("paytm")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                      selectedUpiApp === "paytm"
                        ? "bg-amber-500/15 border-amber-400"
                        : "bg-[#14141a] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">Paytm</span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown Card (BookMyShow Style) */}
              <div className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>
                    Ticket Price ({quantity}x {currentPass.name})
                  </span>
                  <span className="font-mono font-bold text-white">₹{baseTicketAmount}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span>Convenience Fee (TMD)</span>
                  </span>
                  <span className="font-mono font-bold text-white">₹{convenienceFee}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-black text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-base font-extrabold text-[#FFC629]">
                    ₹{totalPayable}
                  </span>
                </div>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Safe Payment • Instant Entry Pass Guarantee</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Proceed Button */}
        {!confirmedTicket && (
          <div className="p-4 bg-[#121217] border-t border-zinc-800/90 shrink-0">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isProcessing || event.seatsLeft <= 0}
              className="w-full py-3.5 rounded-2xl bg-[#F5D020] hover:bg-[#F2C70E] active:scale-[0.99] text-black font-black text-sm tracking-tight transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Processing Ticket Booking...</span>
                </>
              ) : (
                <span>
                  Book Now • ₹{totalPayable}
                </span>
              )}
            </button>
          </div>
        )}

        {/* AstroTalk-Style Direct UPI Payment Overlay */}
        {showUpiModal && (
          <div className="absolute inset-0 z-30 bg-[#0c0c10] flex flex-col p-5 overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block">Total Amount</span>
                <span className="font-mono text-base font-black text-[#FFC629]">₹{totalPayable}</span>
              </div>
            </div>

            <div className="py-4 space-y-4 flex-1">
              <div className="text-center space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30">
                  TMD Official Merchant UPI
                </span>
                <h3 className="text-sm font-extrabold text-white">Complete Payment to Confirm Passes</h3>
                <p className="text-[11px] text-zinc-400">{quantity}x {currentPass.name} • {event.title}</p>
              </div>

              {/* Dynamic QR Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl max-w-[200px] mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${totalPayable}&cu=INR&tn=${encodeURIComponent(`TMD Pass: ${event.title.slice(0, 20)}`)}`
                  )}`}
                  alt="TMD Event Pass UPI QR"
                  className="w-40 h-40 object-contain"
                />
                <span className="text-[10px] font-black text-black pt-1">Scan with Any UPI App</span>
              </div>

              {/* Payee UPI ID with Copy button */}
              <div className="p-3 rounded-xl bg-[#161622] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Payee UPI ID (TMD)</span>
                  <span className="font-mono text-xs font-bold text-white">{MERCHANT_VPA}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(MERCHANT_VPA);
                    setCopiedVpa(true);
                    setTimeout(() => setCopiedVpa(false), 2500);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FFC629]/15 text-[#FFC629] hover:bg-[#FFC629]/25 text-xs font-bold flex items-center gap-1 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedVpa ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {/* Optional 12-digit UTR Input */}
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                  UPI Ref / UTR Number <span className="text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 4312XXXXXXXX (12 digits)"
                  className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-white/10 text-white font-mono text-xs placeholder-zinc-500 focus:outline-none focus:border-[#FFC629]"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={() => executeBooking(utrNumber)}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFC629] to-[#F59E0B] text-black font-black text-sm transition shadow-lg shadow-[#FFC629]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying &amp; Generating Pass...</span>
                  </>
                ) : (
                  <span>✓ I Have Paid • Confirm Booking</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
