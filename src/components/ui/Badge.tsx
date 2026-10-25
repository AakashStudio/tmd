import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "pro" | "verified" | "neutral" | "danger";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantClasses = {
    primary: "bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/35 font-bold",
    pro: "bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#FFC629] text-black font-black shadow-sm",
    verified: "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30",
    neutral: "bg-[#181822] text-[#9e9ea8] border border-[#262634]",
    danger: "bg-red-500/15 text-red-400 border border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
