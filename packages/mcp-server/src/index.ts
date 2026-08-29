import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProject, packArtifact } from "@autocloud/build-engine";
import { DEFAULT_PRICING_TABLES, estimateCosts } from "@autocloud/cost-engine";
import { analyzeProject } from "@autocloud/project-analyzer";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { api } from "./api.js";

/**
 * MCP server da AutoCloud. Ferramentas locais (analyze/estimate) funcionam
 * offline; as demais falam com a API usando o token da CLI.
 */
const server = new Server({ name: "autocloud", version: "0.1.0" }, { capabilities: { tools: {} } });

const projectDirProp = {
  type: "object" as const,
  properties: {
    projectDir: {
      type: "string",
      description: "Caminho absoluto do diretório do projeto",
    },
  },
  required: ["projectDir"],
};

const TOOLS = [
  {
    name: "analyze_project",
    description:
      "Analisa um projeto local (framework, rotas, banco, percentual estático) e estima o custo mensal de infraestrutura. Roda offline — nada é enviado.",
    inputSchema: projectDirProp,
  },
  {
    name: "estimate_cost",
    description:
      "Estimativa de custo por arquitetura/provider para um projeto local (projeção baseada em tabelas públicas de preço).",
    inputSchema: projectDirProp,
  },
  {
    name: "create_project",
    description: "Cria um projeto na AutoCloud.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nome do projeto" },
        gitRepoUrl: { type: "string", description: "URL do repositório (opcional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "deploy_project",
    description:
      "Faz o deploy de um projeto local na AutoCloud: analisa, builda localmente e publica. Retorna a URL pública ou o erro do pipeline.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectDir: { type: "string", description: "Caminho absoluto do diretório do projeto" },
        projectId: {
          type: "string",
          description: "Id do projeto AutoCloud (opcional — cria um novo se omitido)",
        },
      },
      required: ["projectDir"],
    },
  },
  {
    name: "list_projects",
    description: "Lista os projetos da organização na AutoCloud.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_project",
    description: "Detalhes de um projeto AutoCloud (status, domínio, custo estimado).",
    inputSchema: {
      type: "object" as const,
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  {
    name: "get_deployment",
    description: "Status e eventos de um deployment.",
    inputSchema: {
      type: "object" as const,
      properties: { deploymentId: { type: "string" } },
      required: ["deploymentId"],
    },
  },
  {
    name: "get_logs",
    description: "Logs de um deployment (para diagnosticar falhas de build/deploy).",
    inputSchema: {
      type: "object" as const,
      properties: { deploymentId: { type: "string" } },
      required: ["deploymentId"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = (request.params.arguments ?? {}) as Record<string, string>;
  try {
    switch (request.params.name) {
      case "analyze_project": {
        const analysis = analyzeProject(String(args.projectDir));
        return textResult({ analysis });
      }
      case "estimate_cost": {
        const analysis = analyzeProject(String(args.projectDir));
        const recommendation = estimateCosts(analysis, { tables: DEFAULT_PRICING_TABLES });
        return textResult({ recommendation });
      }
      case "create_project": {
        const result = await api("/api/v1/projects", {
          method: "POST",
          body: { name: args.name, gitRepoUrl: args.gitRepoUrl || undefined },
        });
        return textResult(result);
      }
      case "deploy_project": {
        const projectDir = String(args.projectDir);
        const analysis = analyzeProject(projectDir);

        let projectId = args.projectId;
        if (!projectId) {
          const created = await api<{ project: { id: string } }>("/api/v1/projects", {
            method: "POST",
            body: { name: projectDir.split("/").filter(Boolean).at(-1) ?? "project" },
          });
          projectId = created.project.id;
        }

        const buildResult = await buildProject({ rootDir: projectDir, analysis });
        const tmpDir = mkdtempSync(join(tmpdir(), "autocloud-mcp-"));
        try {
          const artifactPath = join(tmpDir, "artifact.tar.gz");
          await packArtifact(buildResult.outputDir, artifactPath);
          const form = new FormData();
          form.append(
            "meta",
            JSON.stringify({
              analysis,
              trigger: "api",
              strategy: "CHEAPEST",
              target: "production",
            }),
          );
          form.append(
            "artifact",
            new Blob([new Uint8Array(readFileSync(artifactPath))], { type: "application/gzip" }),
            "artifact.tar.gz",
          );
          const result = await api(`/api/v1/projects/${projectId}/deployments`, {
            method: "POST",
            formData: form,
          });
          return textResult(result);
        } finally {
          rmSync(tmpDir, { recursive: true, force: true });
        }
      }
      case "list_projects":
        return textResult(await api("/api/v1/projects"));
      case "get_project":
        return textResult(await api(`/api/v1/projects/${args.projectId}`));
      case "get_deployment":
        return textResult(await api(`/api/v1/deployments/${args.deploymentId}`));
      case "get_logs":
        return textResult(await api(`/api/v1/deployments/${args.deploymentId}/logs`));
      default:
        throw new Error(`Ferramenta desconhecida: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [
        { type: "text" as const, text: `Erro: ${error instanceof Error ? error.message : error}` },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
