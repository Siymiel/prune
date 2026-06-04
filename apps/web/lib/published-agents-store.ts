"use client"

import { create } from "zustand"

export interface PublishedAgent {
  id: string
  name: string
  description: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
  isHidden: boolean
  labelIds: string[]
  categoryId?: string
}

export interface AgentLabel {
  id: string
  name: string
}

export interface AgentCategory {
  id: string
  name: string
}

interface PublishedAgentsStore {
  agents: PublishedAgent[]
  labels: AgentLabel[]
  categories: AgentCategory[]
  addLabel: (name: string) => void
  removeLabel: (id: string) => void
  addCategory: (name: string) => void
  removeCategory: (id: string) => void
}

export const usePublishedAgentsStore = create<PublishedAgentsStore>((set) => ({
  agents: [],
  labels: [],
  categories: [],
  addLabel: (name) =>
    set((s) => ({ labels: [...s.labels, { id: crypto.randomUUID(), name }] })),
  removeLabel: (id) =>
    set((s) => ({ labels: s.labels.filter((l) => l.id !== id) })),
  addCategory: (name) =>
    set((s) => ({ categories: [...s.categories, { id: crypto.randomUUID(), name }] })),
  removeCategory: (id) =>
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
}))
