"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkspaceVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
}

interface WorkspaceVariablesStore {
  variables: WorkspaceVariable[];
  addVariable: (key: string, value: string, description?: string) => void;
  updateVariable: (id: string, fields: Partial<Pick<WorkspaceVariable, "key" | "value" | "description">>) => void;
  removeVariable: (id: string) => void;
}

export const useWorkspaceVariablesStore = create<WorkspaceVariablesStore>()(
  persist(
    (set) => ({
      variables: [],
      addVariable: (key, value, description) =>
        set((s) => ({
          variables: [
            ...s.variables,
            { id: crypto.randomUUID(), key, value, description },
          ],
        })),
      updateVariable: (id, fields) =>
        set((s) => ({
          variables: s.variables.map((v) =>
            v.id === id ? { ...v, ...fields } : v
          ),
        })),
      removeVariable: (id) =>
        set((s) => ({ variables: s.variables.filter((v) => v.id !== id) })),
    }),
    { name: "prune-workspace-variables" }
  )
);
