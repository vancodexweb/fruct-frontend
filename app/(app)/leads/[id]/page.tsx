import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session.server";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { getLead } from "@/lib/api/leads";
import { listManagers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/core";
import { LeadDetailView } from "./LeadDetailView";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const isOwner = user?.role === "OWNER";

  let lead;
  try {
    lead = await getLead(serverApiFetch, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const managers = isOwner ? await listManagers(serverApiFetch) : [];

  return <LeadDetailView leadId={id} initialLead={lead} managers={managers} isOwner={isOwner} />;
}
