import { TooltipProvider } from "@/components/ui/tooltip";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
        {children}
      </div>
    </TooltipProvider>
  );
}