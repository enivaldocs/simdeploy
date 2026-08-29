import { prisma } from "@autocloud/db";
import { AdminTable, Stat } from "@/components/admin-ui";
import { requireStaff } from "@/lib/auth/staff";
import { timeAgo } from "@/lib/format";

export default async function AdminWebhooksPage() {
  await requireStaff("webhooks");
  const [events, processed, failed] = await Promise.all([
    prisma.webhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 100 }),
    prisma.webhookEvent.count({ where: { status: "PROCESSED" } }),
    prisma.webhookEvent.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-xl font-medium">Webhooks</h1>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat
          label="Received (total)"
          value={String(events.length >= 100 ? "100+" : events.length)}
        />
        <Stat label="Processed" value={String(processed)} />
        <Stat label="Failed" value={String(failed)} />
      </div>
      <AdminTable
        headers={["Provider", "Event", "Type", "Status", "Attempts", "Received", "Error"]}
        empty={events.length === 0}
      >
        {events.map((event) => (
          <tr key={event.id} className="border-b border-edge-soft last:border-0">
            <td className="px-4 py-2.5 font-mono text-xs">{event.provider}</td>
            <td className="px-4 py-2.5 font-mono text-xs">{event.eventId.slice(0, 18)}…</td>
            <td className="px-4 py-2.5 font-mono text-xs">{event.eventType}</td>
            <td className="px-4 py-2.5 text-xs">
              <span
                className={
                  event.status === "PROCESSED"
                    ? "text-ok"
                    : event.status === "FAILED"
                      ? "text-err"
                      : "text-ink-dim"
                }
              >
                {event.status}
              </span>
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">{event.attempts}</td>
            <td className="px-4 py-2.5 text-xs text-ink-faint">{timeAgo(event.receivedAt)}</td>
            <td className="max-w-xs truncate px-4 py-2.5 text-xs text-err">{event.error ?? ""}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
