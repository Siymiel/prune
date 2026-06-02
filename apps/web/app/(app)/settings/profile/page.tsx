"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Copy, Check, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function ProfileSettingsPage() {
  const { user } = useAuthStore()

  const email = user?.email ?? ""
  const userId = user?.id ?? ""
  const provider = (user?.app_metadata?.provider as string) ?? ""
  const isGoogleAuth = provider === "google"

  const defaultName =
    (user?.user_metadata?.full_name as string) ?? email.split("@")[0] ?? ""

  const [fullName, setFullName] = useState(defaultName)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initials = email.slice(0, 2).toUpperCase() || "?"

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-10 px-10 space-y-4">
      {/* Profile picture */}
      <section className="border rounded-lg p-6">
        <h2 className="text-[15px] font-semibold mb-0.5">Profile picture</h2>
        <p className="text-[13px] text-muted-foreground mb-5">
          Manage your profile picture
        </p>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-[13px]">
              <Pencil className="h-3.5 w-3.5" />
              Change picture
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[13px] text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              Remove picture
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            PNG, JPEG under 2MB
          </span>
        </div>
      </section>

      {/* Basic profile details */}
      <section className="border rounded-lg divide-y">
        <div className="px-6 py-5">
          <h2 className="text-[15px] font-semibold mb-0.5">
            Basic profile details
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Manage your basic profile details
          </p>
        </div>

        {/* Full name */}
        <div className="px-6 py-4 flex items-center gap-6">
          <div className="w-48 shrink-0">
            <div className="text-[13px] font-medium">Full name</div>
            <div className="text-[12px] text-muted-foreground">
              This is your full name as it will appear on your profile.
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-8 text-[13px] max-w-xs"
            />
            <Button
              size="sm"
              className="h-8 text-[13px]"
              onClick={handleSave}
            >
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {/* Email */}
        <div className="px-6 py-4 flex items-center gap-6">
          <div className="w-48 shrink-0">
            <div className="text-[13px] font-medium">Email address</div>
            <div className="text-[12px] text-muted-foreground">
              This is your profile email.
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[13px] text-muted-foreground">{email}</span>
          </div>
        </div>

        {/* User ID */}
        <div className="px-6 py-4 flex items-center gap-6">
          <div className="w-48 shrink-0">
            <div className="text-[13px] font-medium">User ID</div>
            <div className="text-[12px] text-muted-foreground">
              This is your unique user identifier.
            </div>
          </div>
          <div className="flex-1 flex items-center justify-between gap-2">
            <span className="text-[13px] text-muted-foreground font-mono truncate">
              {userId}
            </span>
            <button
              onClick={handleCopyId}
              className={cn(
                "shrink-0 h-7 w-7 flex items-center justify-center rounded-md border transition-colors",
                copied
                  ? "border-green-500 text-green-600"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section className="border rounded-lg divide-y">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold mb-0.5">
              Change your password
            </h2>
            <p className="text-[13px] text-muted-foreground">
              You can change your current password for your account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[13px] shrink-0"
            disabled={isGoogleAuth}
          >
            Change password
          </Button>
        </div>
        {isGoogleAuth && (
          <div className="px-6 py-3 flex items-start gap-2 bg-muted/40">
            <span className="text-muted-foreground mt-0.5">ⓘ</span>
            <div>
              <div className="text-[13px] font-medium">
                Unable to change password
              </div>
              <div className="text-[12px] text-muted-foreground">
                Changing password is not allowed for users having Google
                account.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Delete account */}
      <section className="border rounded-lg px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold mb-0.5">Delete account</h2>
          <p className="text-[13px] text-muted-foreground">
            This action is irreversible, and all information associated with
            your account will be deleted.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="text-[13px] shrink-0"
        >
          Delete my account
        </Button>
      </section>
    </div>
  )
}
