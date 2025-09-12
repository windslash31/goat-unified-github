import { create } from "zustand";

export const useModalStore = create((set) => ({
  modal: null,
  data: null,
  isOpen: false,

  openModal: (modal, data = null) => set({ modal, data, isOpen: true }),
  closeModal: () => set({ modal: null, data: null, isOpen: false }),
}));