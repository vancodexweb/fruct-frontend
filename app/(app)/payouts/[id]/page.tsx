import { notFound } from "next/navigation";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { getPayout } from "@/lib/api/payouts";
import { listManagers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/core";
import { PayoutDetailView } from "./PayoutDetailView";

interface PayoutDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PayoutDetailPage({ params }: PayoutDetailPageProps) {
  const { id } = await params;

  let payout;
  try {
    payout = await getPayout(serverApiFetch, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const managers = await listManagers(serverApiFetch);

  return <PayoutDetailView payoutId={id} initialPayout={payout} managers={managers} />;
}
