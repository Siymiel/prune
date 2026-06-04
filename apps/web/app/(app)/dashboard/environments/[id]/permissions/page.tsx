"use client"

import { use, useState } from "react"
import { Plus, MoreHorizontal, UserCircle, Mail, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEnvironmentStore } from "@/lib/environment-store"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [15, 30, 100]

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Editor: "bg-blue-100 text-blue-700",
  Viewer: "bg-gray-100 text-gray-600",
}

export default function PermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const env = useEnvironmentStore((s) => s.environments.find((e) => e.id === id))

  const [memberInput, setMemberInput] = useState("")
  const [roleInput, setRoleInput] = useState("")
  const [memberError, setMemberError] = useState(false)
  const [roleError, setRoleError] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)

  if (!env) return null

  const pageCount = Math.max(1, Math.ceil(env.members.length / pageSize))
  const paginated = env.members.slice(page * pageSize, (page + 1) * pageSize)

  function handleAdd() {
    const hasM = memberInput.trim().length > 0
    const hasR = roleInput.length > 0
    setMemberError(!hasM)
    setRoleError(!hasR)
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-5 gap-5">
      {/* Invite Member card */}
      <div className="rounded-xl border border-prune-borderGray p-5 flex flex-col gap-4">
        <div>
          <p className="text-[14px] font-semibold">Invite Member</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Invite existing members from the organization to the environment.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_200px_auto] gap-3 items-start">
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-muted-foreground">Members</p>
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md border text-[13px] text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors",
                memberError && "border-destructive"
              )}
              onClick={() => {
                setMemberInput("placeholder")
                setMemberError(false)
              }}
            >
              <span>{memberInput && memberInput !== "placeholder" ? memberInput : "Select users, groups, or roles..."}</span>
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
              </svg>
            </div>
            {memberError && (
              <p className="text-[11px] text-destructive">Select at least one user, group, or role</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-muted-foreground">Role</p>
            <Select
              value={roleInput}
              onValueChange={(v) => { setRoleInput(v); setRoleError(false) }}
            >
              <SelectTrigger
                className={cn("h-9 text-[13px]", roleError && "border-destructive")}
              >
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="text-[13px]">
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            {roleError && (
              <p className="text-[11px] text-destructive">Select a role</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-muted-foreground opacity-0">Add</p>
            <Button size="sm" className="h-9 gap-1.5 text-[13px]" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-prune-borderGray flex flex-col overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="h-3.5 w-3.5" />
                    Member
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Role
                  </div>
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((member) => (
                <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-[450]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[11px] font-[500] px-2 py-0.5 rounded-full",
                        ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-600"
                      )}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-[13px]">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[13px]">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ‹ Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              Next ›
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setPage(0) }}
                className={cn(
                  "px-2.5 py-1 rounded text-[12px] transition-colors",
                  pageSize === size
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {size === 15 ? "15 rows" : size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
