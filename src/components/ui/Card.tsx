import React from "react";

interface CardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, id, className = "", onClick }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-lg bg-[#14141a] border border-[#24242e] p-4 text-white shadow-md ${
        onClick ? "cursor-pointer hover:border-[#383848] transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
