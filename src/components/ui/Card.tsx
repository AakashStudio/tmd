import React from "react";

interface CardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, id, className = "", onClick }) => {
  const hasPadding = /(^|\s)p[xytbrl]?-/.test(className);
  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-2xl bg-[#121217] border border-[#22222d] ${
        hasPadding ? "" : "p-4"
      } text-white shadow-md ${
        onClick ? "cursor-pointer hover:border-amber-400/40 transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
