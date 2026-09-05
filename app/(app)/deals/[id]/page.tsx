import { notFound } from "next/navigation";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { getDeal } from "@/lib/api/deals";
import { ApiError } from "@/lib/api/core";
import { DealDetailView } from "./DealDetailView";

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;

  let deal;
  try {
    deal = await getDeal(serverApiFetch, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <DealDetailView dealId={id} initialDeal={deal} />;
}
