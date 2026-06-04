import { redirect } from "next/navigation"

export default async function EnvironmentIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/environments/${id}/variables`)
}
