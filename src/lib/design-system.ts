/**
 * ============================================================================
 * TMD - AURA GOLD DESIGN SYSTEM
 * Official Design System & UI Tokens for TMD (The Match Date)
 * ============================================================================
 * 
 * Aesthetic: Premium Bumble Gold & High-Contrast Obsidian Dark Mode
 * Primary Tone: Vibrant Amber & Rich Bumble Gold
 * Canvas: Deep Obsidian (#08080b)
 * Surface: Onyx Charcoal (#121217) & Elevated Slate (#1a1a24)
 * Radii: Ergonomic Mobile Smooth Rounded Pills & Cards
 */

export const AURA_TOKENS = {
  name: "TMD Aura Gold Design System",
  version: "1.0.0",

  colors: {
    // Primary Gold Palette
    primary: {
      bumble: "#FFC629",       // Signature Bumble Yellow / Gold
      amber: "#F59E0B",        // Warm Golden Amber
      metallic: "#D4AF37",     // Deep Metallic Gold
      light: "#FFE382",        // Soft Highlight Gold
      glow: "rgba(255, 198, 41, 0.35)",
    },

    // Gradients
    gradients: {
      goldPrimary: "bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B]",
      goldMetallic: "bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#FFC629]",
      goldSubtle: "bg-gradient-to-r from-[#F59E0B]/20 via-[#FFC629]/20 to-[#F59E0B]/20",
      goldBorder: "border border-amber-400/50",
    },

    // Background Canvas & Surfaces
    background: {
      canvas: "#08080b",       // Ultra-dark Obsidian screen base
      surface: "#121217",      // Primary card container
      surfaceElevated: "#1a1a24", // Raised sheet / floating drawer / modals
      surfaceActive: "#242432", // Tap & hover feedback
      surfaceInput: "#0f0f14",  // Form inputs & text fields
    },

    // Borders
    border: {
      subtle: "#1e1e28",
      card: "#242432",
      active: "#FFC629",
      goldGlow: "border-amber-400/40",
    },

    // Typography & Contrast
    text: {
      primary: "#FFFFFF",      // Maximum contrast white
      secondary: "#D1D1D8",    // Clean reading body
      muted: "#888896",        // Informational & captions
      gold: "#FFC629",         // Brand gold text
      goldDark: "#000000",     // Text on primary gold buttons (black for AAA contrast)
      error: "#EF4444",        // Alerts
      success: "#10B981",      // Verified & success
    },
  },

  // Component Classes (Tailwind standard string presets)
  components: {
    // Primary Action Button (Bumble Gold)
    buttonPrimary:
      "bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] hover:brightness-105 active:scale-95 text-black font-extrabold shadow-lg shadow-amber-500/20 transition rounded-full select-none",

    // Secondary Action Button (Dark Slate Pill)
    buttonSecondary:
      "bg-[#181822] hover:bg-[#22222e] border border-[#2c2c3a] text-white font-bold active:scale-95 transition rounded-full select-none",

    // Card Surface
    card:
      "bg-[#121217] border border-[#22222d] rounded-2xl shadow-md",

    // Active Selected Chip / Tag
    chipSelected:
      "bg-[#FFC629] text-black font-black border border-[#FFC629] shadow-md shadow-amber-500/25",

    // Unselected Chip / Tag
    chipUnselected:
      "bg-[#14141c] text-zinc-300 border border-[#22222f] hover:border-zinc-700",

    // Form Input
    input:
      "bg-[#0f0f14] border border-[#262634] text-white rounded-xl focus:outline-none focus:border-[#FFC629] focus:ring-1 focus:ring-[#FFC629]/40 placeholder:text-zinc-500 transition",
  },
} as const;

export type AuraTokens = typeof AURA_TOKENS;
