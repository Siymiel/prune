"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NewSkillDialog, type SkillFormData } from "@/components/skills/new-skill-dialog"
import { SkillCard, type Skill } from "@/components/skills/skill-card"

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleCreate(data: SkillFormData) {
    const skill: Skill = { id: crypto.randomUUID(), ...data, updatedAt: new Date() }
    setSkills((prev) => [skill, ...prev])
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id))
  }

  function handleEdit(updated: Skill) {
    setSkills((prev) => prev.map((s) => (s.id === updated.id ? { ...updated, updatedAt: new Date() } : s)))
  }

  return (
    <TooltipProvider>
      <NewSkillDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="text-[15px] font-semibold">Prompt Library</h1>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center -mt-36">
              <p className="text-[18px] font-medium text-gray-500">No prompts yet</p>
              <p className="text-[15px] font-[450] text-muted-foreground">
                Get started by creating your first prompt for your organization.
              </p>
              <Button size="sm" className="gap-1.5 mt-1 py-2 text-[14px] font-[450]" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Prompt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-8xl">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
