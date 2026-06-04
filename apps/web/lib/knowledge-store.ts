"use client"

import { create } from "zustand"

export interface KBDocument {
  id: string
  name: string
  sizeBytes: number
  status: "indexed" | "error" | "pending"
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string
  connection: string | null
  documents: KBDocument[]
  createdAt: Date
  updatedAt: Date
}

interface KnowledgeStore {
  bases: KnowledgeBase[]
  addBase: (name: string) => KnowledgeBase
  removeBase: (id: string) => void
  addDocument: (kbId: string, file: File) => void
  removeDocument: (kbId: string, docId: string) => void
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  bases: [],
  addBase: (name) => {
    const kb: KnowledgeBase = {
      id: crypto.randomUUID(),
      name,
      description: `Document knowledge base for '${name}'`,
      connection: null,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((s) => ({ bases: [kb, ...s.bases] }))
    return kb
  },
  removeBase: (id) => set((s) => ({ bases: s.bases.filter((b) => b.id !== id) })),
  addDocument: (kbId, file) => {
    const doc: KBDocument = {
      id: crypto.randomUUID(),
      name: file.name,
      sizeBytes: file.size,
      status: "pending",
    }
    set((s) => ({
      bases: s.bases.map((b) =>
        b.id === kbId ? { ...b, documents: [...b.documents, doc], updatedAt: new Date() } : b,
      ),
    }))
  },
  removeDocument: (kbId, docId) =>
    set((s) => ({
      bases: s.bases.map((b) =>
        b.id === kbId ? { ...b, documents: b.documents.filter((d) => d.id !== docId) } : b,
      ),
    })),
}))
