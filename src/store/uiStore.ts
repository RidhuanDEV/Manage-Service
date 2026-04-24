"use client";

import { create } from "zustand";

// ---------------------------------------------------------------------------
// UI State — hanya untuk state UI murni (bukan session/data)
// Session diambil dari Auth.js useSession()
// ---------------------------------------------------------------------------

type UIStore = {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Filter laporan aktif (admin/dashboard)
  activeFilters: {
    role: string;
    status: string;
    search: string;
    date_from: string;
    date_to: string;
  };
  setFilter: (key: keyof UIStore["activeFilters"], value: string) => void;
  resetFilters: () => void;

  // Modal konfirmasi global
  modal: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };
  openModal: (title: string, message: string, onConfirm: () => void) => void;
  closeModal: () => void;
};

const DEFAULT_FILTERS = {
  role: "",
  status: "",
  search: "",
  date_from: "",
  date_to: "",
};

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Filters
  activeFilters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),
  resetFilters: () => set({ activeFilters: { ...DEFAULT_FILTERS } }),

  // Modal
  modal: { isOpen: false, title: "", message: "", onConfirm: null },
  openModal: (title, message, onConfirm) =>
    set({ modal: { isOpen: true, title, message, onConfirm } }),
  closeModal: () =>
    set({ modal: { isOpen: false, title: "", message: "", onConfirm: null } }),
}));
