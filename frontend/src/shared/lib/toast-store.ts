import { create } from "zustand";

export type ToastVariant = "error" | "success" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastStore = {
  items: ToastItem[];
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (toast) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    set((state) => ({
      items: [...state.items, { ...toast, id }],
    }));

    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));

export function showErrorToast(description: string, title = "Something went wrong") {
  return useToastStore.getState().push({
    title,
    description,
    variant: "error",
  });
}
