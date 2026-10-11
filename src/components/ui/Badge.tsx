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
    primary: "bg-[#ff1475]/15 text-[#ff1475] border border-[#ff1475]/35",
    pro: "bg-gradient-to-r from-[#ff1475] via-[#ff4088] to-[#ff6b8b] text-white font-black shadow-sm",
    verified: "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30",
    neutral: "bg-[#1e1e26] text-[#9e9ea8] border border-[#2a2a38]",
    danger: "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
