import { prisma } from "@autocloud/db";
import { routingDecisionSchema } from "@autocloud/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth/session";
import { formatDuration, formatUsd } from "@/lib/format";

export default async function DeploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;

  const deployment = await prisma.deployment.findFirst({
    where: { id, project: { organizationId: session.organization.id } },
    include: {
      project: true,
      events: { orderBy: { createdAt: "asc" } },
      logs: { orderBy: { timestamp: "asc" }, take: 1000 },
    },
  });
  if (!deployment) notFound();

  const planParse = routingDecisionSchema.safeParse(deployment.plan);
  const plan = planParse.success ? planParse.data : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/dashboard/projects" className="hover:text-ink">
          Projects
        </Link>{" "}
        /{" "}
        <Link href={`/dashboard/projects/${deployment.projectId}`} className="hover:text-ink">
          {deployment.project.name}
        </Link>{" "}
        / <span className="font-mono">{deployment.id.slice(-12)}</span>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-medium">
            Deployment <StatusBadge status={deployment.status} />
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-dim">
            <span>duration: {formatDuration(deployment.durationMs)}</span>
            <span>trigger: {deployment.trigger}</span>
            {deployment.commitSha ? (
              <span className="font-mono">{deployment.commitSha.slice(0, 7)}</span>
            ) : null}
            {deployment.url ? (
              <a
                href={deployment.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-accent hover:underline"
              >
                {deployment.url}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {deployment.error ? (
        <div className="mb-6 rounded-lg border border-err/40 bg-err/10 p-4 text-sm text-err">
          {deployment.error}
        </div>
      ) : null}

      {plan ? (
        <div className="mb-6 rounded-lg border border-edge bg-panel p-5">
          <h2 className="mb-3 text-sm font-medium text-ink-dim">Infrastructure plan (Autopilot)</h2>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink-faint">Provider</p>
              <p className="font-mono">{plan.provider}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Architecture</p>
              <p className="font-mono">{plan.architecture}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Region</p>
              <p className="font-mono">{plan.region}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Estimated cost</p>
              <p className="font-mono">{formatUsd(plan.estimate.monthlyUsd)}/mo</p>
              <p className="text-[10px] text-ink-faint">projeção</p>
            </div>
          </div>
          <ul className="mt-3 list-inside list-disc text-xs text-ink-faint">
            {plan.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-6 rounded-lg border border-edge bg-panel p-5">
        <h2 className="mb-3 text-sm font-medium text-ink-dim">Timeline</h2>
        <ol className="flex flex-col gap-2">
          {deployment.events.map((event) => (
            <li key={event.id} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-ink-faint">
                {event.createdAt.toISOString().slice(11, 19)}
              </span>
              <span className="font-mono text-xs">
                {event.fromStatus ? `${event.fromStatus} → ` : ""}
                {event.toStatus}
              </span>
              {event.message ? (
                <span className="truncate text-xs text-ink-faint">{event.message}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-edge bg-panel">
        <h2 className="border-b border-edge-soft px-5 py-3 text-sm font-medium text-ink-dim">
          Logs
        </h2>
        {deployment.logs.length === 0 ? (
          <p className="p-5 text-sm text-ink-faint">Sem logs.</p>
        ) : (
          <pre className="max-h-[480px] overflow-auto p-5 font-mono text-xs leading-relaxed">
            {deployment.logs
              .map(
                (log) =>
                  `${log.timestamp.toISOString().slice(11, 19)} ${log.stage.padEnd(7)} ${log.level === "error" ? "ERROR " : ""}${log.message}`,
              )
              .join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}
