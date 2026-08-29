import { getSession } from "@/lib/auth/session";
import { listApiTokens } from "@/lib/services/tokens";
import { TokensPanel } from "./tokens-panel";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;
  const tokens = await listApiTokens(session.organization.id);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-xl font-medium">Settings</h1>
      <p className="mb-8 text-sm text-ink-dim">
        API tokens para CLI, MCP e agentes. Tokens têm scopes e podem ser revogados a qualquer
        momento.
      </p>
      <TokensPanel tokens={tokens} />
    </div>
  );
}
