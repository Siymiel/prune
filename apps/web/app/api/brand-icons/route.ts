import { NextResponse } from "next/server";
import { getAllBrandIconUrls } from "@/lib/brandfetch";

export const revalidate = 86400;

export async function GET() {
  const icons = await getAllBrandIconUrls();
  return NextResponse.json(icons);
}
