import { create } from 'zustand';

// Global UI state that has nothing to do with the server: only the mobile sidebar drawer for now.
export const useUiStore = create((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
