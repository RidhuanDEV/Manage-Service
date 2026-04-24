"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface NeoDropdownProps {
  label: React.ReactNode;
  items: DropdownItem[];
}

export function NeoDropdown({ label, items }: NeoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--color-surface)",
          border: "2px solid #000",
          boxShadow: isOpen ? "2px 2px 0px #000" : "4px 4px 0px #000",
          transform: isOpen ? "translate(2px, 2px)" : "none",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
          transition: "transform 80ms, box-shadow 80ms",
        }}
      >
        {label}
        <ChevronDown size={16} strokeWidth={3} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            background: "var(--color-surface)",
            border: "3px solid #000",
            boxShadow: "6px 6px 0px #000",
            minWidth: "200px",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "transparent",
                border: "none",
                borderBottom: index < items.length - 1 ? "2px solid #000" : "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: item.danger ? "var(--color-danger)" : "var(--color-dark)",
                transition: "background-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                if (item.danger) {
                  e.currentTarget.style.backgroundColor = "var(--color-danger)";
                  e.currentTarget.style.color = "#fff";
                } else {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = item.danger ? "var(--color-danger)" : "var(--color-dark)";
              }}
            >
              {item.icon && <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
