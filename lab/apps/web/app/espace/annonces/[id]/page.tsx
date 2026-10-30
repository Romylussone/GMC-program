"use client";
import { useParams } from "next/navigation";
import { PropertyForm } from "@/components/property-form";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <PropertyForm id={id} />;
}
