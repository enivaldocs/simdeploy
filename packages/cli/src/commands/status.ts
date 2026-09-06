import type { DeploymentResponse, ProjectResponse } from "@simdeploy/shared";
import pc from "picocolors";
import { apiRequest } from "../api-client.js";
import { readProjectLink } from "../config.js";
import { fail, heading, printJson } from "../output.js";

async function latestDeployment(projectId: string): Promise<DeploymentResponse | null> {
  const { deployments } = await apiRequest<{ deployments: DeploymentResponse[] }>(
    `/api/v1/projects/${projectId}/deployments`,
  );
  return deployments[0] ?? null;
}

export async function statusCommand(options: { json?: boolean }): Promise<void> {
  const link = readProjectLink(process.cwd());
  if (!link) {
    fail("Diretório não vinculado a um projeto SimDeploy. Rode: simdeploy deploy");
    process.exitCode = 1;
    return;
  }
  const deployment = await latestDeployment(link.projectId);
  if (options.json) {
    printJson({ project: link, deployment });
    return;
  }
  heading();
  console.log(`Project: ${pc.bold(link.name)} (${link.slug})`);
  if (!deployment) {
    console.log("No deployments yet.");
    return;
  }
  console.log(`Last deployment: ${deployment.id}`);
  console.log(`Status: ${pc.bold(deployment.status)}`);
  if (deployment.url) console.log(`URL: ${pc.green(deployment.url)}`);
  if (deployment.error) console.log(`Error: ${pc.red(deployment.error)}`);
}

export async function logsCommand(options: { json?: boolean }): Promise<void> {
  const link = readProjectLink(process.cwd());
  if (!link) {
    fail("Diretório não vinculado a um projeto SimDeploy. Rode: simdeploy deploy");
    process.exitCode = 1;
    return;
  }
  const deployment = await latestDeployment(link.projectId);
  if (!deployment) {
    fail("Nenhum deployment encontrado.");
    process.exitCode = 1;
    return;
  }
  if (options.json) {
    const logs = await apiRequest<unknown>(`/api/v1/deployments/${deployment.id}/logs`);
    printJson(logs);
    return;
  }
  const text = await apiRequest<string>(`/api/v1/deployments/${deployment.id}/logs?format=text`);
  console.log(text);
}

export async function projectsCommand(options: { json?: boolean }): Promise<void> {
  const { projects } = await apiRequest<{ projects: ProjectResponse[] }>("/api/v1/projects");
  if (options.json) {
    printJson({ projects });
    return;
  }
  heading();
  if (projects.length === 0) {
    console.log("No projects. Run simdeploy deploy inside a project directory.");
    return;
  }
  for (const project of projects) {
    const status = project.latestDeployment?.status ?? "—";
    const cost =
      project.estimatedMonthlyUsd !== null
        ? `USD ${project.estimatedMonthlyUsd.toFixed(2)}/mo est.`
        : "";
    console.log(
      `${pc.bold(project.name.padEnd(24))} ${String(project.framework ?? "?").padEnd(10)} ${status.padEnd(14)} ${cost}`,
    );
    console.log(pc.dim(`  ${project.latestDeployment?.url ?? project.defaultDomain ?? ""}`));
  }
}
