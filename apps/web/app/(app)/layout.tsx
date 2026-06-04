import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AuthGuard } from "@/components/auth/auth-guard"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
