import { create } from "zustand";

export type LogLevel = "info" | "success" | "error" | "warn";

export type LogEntry = {
  id: string;
  at: number;
  level: LogLevel;
  source: string;
  message: string;
  detail?: string;
};

type LogState = {
  entries: LogEntry[];
  push: (e: Omit<LogEntry, "id" | "at">) => void;
  clear: () => void;
};

export const useLogs = create<LogState>()((set) => ({
  entries: [],
  push: (e) =>
    set((s) => ({
      entries: [
        ...s.entries.slice(-199),
        { ...e, id: Math.random().toString(36).slice(2, 10), at: Date.now() },
      ],
    })),
  clear: () => set({ entries: [] }),
}));

export function logEvent(entry: Omit<LogEntry, "id" | "at">) {
  useLogs.getState().push(entry);
}