import { getLead } from "@/lib/api/leads";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { ApiError } from "@/lib/api/core";
import type { Lead } from "@/types/leads";
import { NewDealForm } from "./NewDealForm";

interface NewDealPageProps {
  searchParams: Promise<{ leadId?: string }>;
}

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const { leadId } = await searchParams;

  let lockedLead: Lead | null = null;
  if (leadId) {
    try {
      lockedLead = await getLead(serverApiFetch, leadId);
    } catch (error) {
      // An invalid/removed leadId in the query string shouldn't hard-fail the
      // page — fall back to the normal unlocked search flow instead.
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error;
      }
    }
  }

  return <NewDealForm lockedLead={lockedLead} />;
}
