"use client"

import { create } from "zustand"

export interface EnvVariable {
  id: string
  key: string
  devValue: string
  stagingValue: string
  prodValue: string
  updatedBy: string
  updatedAt: Date
}

export interface EnvMember {
  id: string
  name: string
  email: string
  role: "Admin" | "Editor" | "Viewer"
}

export interface Environment {
  id: string
  name: string
  description: string
  variables: EnvVariable[]
  members: EnvMember[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  modifiedBy: string
}

interface EnvironmentStore {
  environments: Environment[]
  bannerDismissed: boolean
  dismissBanner: () => void
  addEnvironment: (name: string, description: string) => Environment
  removeEnvironment: (id: string) => void
  renameEnvironment: (id: string, name: string) => void
  updateEnvironment: (id: string, name: string, description: string) => void
  addVariable: (
    envId: string,
    data: Pick<EnvVariable, "key" | "devValue" | "stagingValue" | "prodValue">
  ) => void
  removeVariable: (envId: string, varId: string) => void
}

export const useEnvironmentStore = create<EnvironmentStore>((set) => ({
  environments: [],
  bannerDismissed: false,
  dismissBanner: () => set({ bannerDismissed: true }),
  addEnvironment: (name, description) => {
    const env: Environment = {
      id: crypto.randomUUID(),
      name,
      description,
      variables: [],
      members: [
        {
          id: "owner",
          name: "Samuel Kinuthia",
          email: "skinuthia77@gmail.com",
          role: "Admin",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "Samuel Kinuthia",
      modifiedBy: "Samuel Kinuthia",
    }
    set((s) => ({ environments: [env, ...s.environments] }))
    return env
  },
  removeEnvironment: (id) =>
    set((s) => ({ environments: s.environments.filter((e) => e.id !== id) })),
  renameEnvironment: (id, name) =>
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === id
          ? { ...e, name, updatedAt: new Date(), modifiedBy: "Samuel Kinuthia" }
          : e
      ),
    })),
  updateEnvironment: (id, name, description) =>
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === id
          ? { ...e, name, description, updatedAt: new Date(), modifiedBy: "Samuel Kinuthia" }
          : e
      ),
    })),
  addVariable: (envId, data) => {
    const variable: EnvVariable = {
      id: crypto.randomUUID(),
      ...data,
      updatedBy: "Samuel Kinuthia",
      updatedAt: new Date(),
    }
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === envId
          ? {
              ...e,
              variables: [...e.variables, variable],
              updatedAt: new Date(),
              modifiedBy: "Samuel Kinuthia",
            }
          : e
      ),
    }))
  },
  removeVariable: (envId, varId) =>
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === envId
          ? { ...e, variables: e.variables.filter((v) => v.id !== varId) }
          : e
      ),
    })),
}))
