import { displayStatus } from "@simdeploy/deployment-engine";
import type { DeploymentStatus } from "@simdeploy/shared";

const STYLES: Record<ReturnType<typeof displayStatus>, string> = {
  Ready: "text-ok border-ok/40 bg-ok/10",
  Failed: "text-err border-err/40 bg-err/10",
  Building: "text-warn border-warn/40 bg-warn/10",
  Deploying: "text-run border-run/40 bg-run/10",
  Analyzing: "text-info border-info/40 bg-info/10",
  Queued: "text-ink-dim border-edge bg-panel-2",
  Canceled: "text-ink-faint border-edge bg-panel-2",
};

export function StatusBadge({ status }: { status: DeploymentStatus }) {
  const label = displayStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs ${STYLES[label]}`}
    >
      {label}
    </span>
  );
}
