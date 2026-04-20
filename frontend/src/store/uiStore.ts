import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  activeEventId: string | null;
  activeClubId: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (name: string, eventId?: string, clubId?: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  activeEventId: null,
  activeClubId: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (name, eventId, clubId) =>
    set({ activeModal: name, activeEventId: eventId ?? null, activeClubId: clubId ?? null }),

  closeModal: () =>
    set({ activeModal: null, activeEventId: null, activeClubId: null }),
}));
