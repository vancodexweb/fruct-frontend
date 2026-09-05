import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listScripts } from "@/lib/api/scripts";
import { ScriptsView } from "./ScriptsView";

export default async function ScriptsPage() {
  const scripts = await listScripts(serverApiFetch, {});

  return <ScriptsView initialScripts={scripts} />;
}
