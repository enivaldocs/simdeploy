import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const API_ROUTES = [
  ["GET /api/v1/me", "validates token; returns organization and scopes"],
  ["GET | POST /api/v1/projects", "list / create project {name}"],
  ["GET | DELETE /api/v1/projects/:id", "detail / delete project"],
  ["POST /api/v1/projects/:id/analyze", "registers analysis; returns cost + planned route"],
  ["GET | POST /api/v1/projects/:id/deployments", "list / deploy (multipart meta + artifact)"],
  ["GET /api/v1/deployments/:id", "status + pipeline events"],
  ["GET /api/v1/deployments/:id/logs", "structured logs (?format=text for plain text)"],
  ["GET | POST /api/v1/projects/:id/env", "list keys / set variable"],
  ["POST /api/v1/cost/estimate", "standalone cost estimate"],
] as const;

export default function AgentDocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold">Built for coding agents</h1>
          <p className="mt-2 text-ink-dim">
            Tudo que o dashboard faz existe em CLI não interativa, API e MCP. Este é o guia mínimo
            para Claude Code, Codex, Cursor e outros agentes. Versão machine-readable:{" "}
            <a href="/llms.txt" className="font-mono text-accent hover:underline">
              /llms.txt
            </a>
          </p>
        </header>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-medium">Deploy an existing application</h2>
          <pre className="overflow-x-auto rounded-lg border border-edge bg-panel p-4 font-mono text-sm leading-relaxed text-ink-dim">
            {`# 1. Install the CLI
npm i -g simdeploy

# 2. Authenticate (token created at /dashboard/settings)
simdeploy login --token sd_live_...

# 3. Analyze (offline, no side effects)
simdeploy analyze --json

# 4. Non-interactive deploy — essential for agents
simdeploy deploy --yes

# 5. Verify (exit code != 0 on failure)
simdeploy status --json
simdeploy logs`}
          </pre>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-medium">Golden rules</h2>
          <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-ink-dim">
            <li>
              Sempre <span className="font-mono text-ink">--yes</span> em automação; sem ele a CLI
              pede confirmação.
            </li>
            <li>
              Sempre <span className="font-mono text-ink">--json</span> quando for interpretar a
              saída.
            </li>
            <li>Builds run on the local machine; only the output goes to SimDeploy.</li>
            <li>
              Estados de deployment: CREATED, ANALYZING, QUEUED, BUILDING, DEPLOYING, READY e as
              falhas tipadas ANALYSIS_FAILED, BUILD_FAILED, DEPLOY_FAILED.
            </li>
            <li>Displayed costs are projections from price tables, never a real bill.</li>
          </ul>
        </section>

        <section className="mb-10" id="api">
          <h2 className="mb-3 text-xl font-medium">API v1</h2>
          <p className="mb-3 text-sm text-ink-dim">
            Auth: <span className="font-mono text-ink">Authorization: Bearer sd_live_...</span> —
            erros retornam{" "}
            <span className="font-mono text-ink">{`{"error":{"code","message"}}`}</span>.
          </p>
          <div className="overflow-hidden rounded-lg border border-edge">
            <table className="w-full bg-panel text-sm">
              <tbody>
                {API_ROUTES.map(([route, description]) => (
                  <tr key={route} className="border-b border-edge-soft last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs">{route}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-dim">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-medium">MCP</h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-dim">
            Servidor stdio <span className="font-mono text-ink">simdeploy-mcp</span> com as
            ferramentas analyze_project, estimate_cost, create_project, deploy_project,
            list_projects, get_project, get_deployment e get_logs. A autenticação reusa a da CLI.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-edge bg-panel p-4 font-mono text-sm text-ink-dim">
            {`{
  "mcpServers": {
    "simdeploy": { "command": "simdeploy-mcp" }
  }
}`}
          </pre>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
