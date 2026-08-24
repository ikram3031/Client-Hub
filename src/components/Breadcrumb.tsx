"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

// Global Breadcrumb navigation bar component for high-clarity site hierarchy
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 py-2.5 px-4 mb-6 rounded-xl theme-bg-secondary border theme-border text-xs font-mono select-none overflow-x-auto shadow-xs">
      <div className="flex items-center gap-1 theme-text-muted shrink-0">
        <Home className="w-3.5 h-3.5" />
      </div>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const IconComponent = item.icon;

        return (
          <div key={index} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="w-3 h-3 theme-text-muted opacity-50 shrink-0" />
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="flex items-center gap-1 font-medium theme-text-secondary hover:theme-accent transition-colors cursor-pointer"
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            ) : (
              <span
                className={`flex items-center gap-1 font-semibold ${
                  isLast ? "theme-text-primary theme-accent font-bold" : "theme-text-secondary"
                }`}
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
