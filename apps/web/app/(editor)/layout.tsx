export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {children}
    </div>
  );
}
