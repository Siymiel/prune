import { redirect } from "next/navigation"

export default async function KBIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/knowledge/${id}/documents`)
}
