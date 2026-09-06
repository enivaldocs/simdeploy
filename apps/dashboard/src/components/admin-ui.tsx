import { formatMinor } from "@simdeploy/finance";

/** Componentes de exibição do admin. Sem dado real → "No data", nunca fake. */

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 font-mono text-xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/** Formata um mapa {currency: minor} — "R$ 0.00" quando vazio na moeda base. */
export function moneyByCurrency(map: Record<string, number>, emptyLabel = "R$ 0.00"): string {
  const entries = Object.entries(map).filter(([, v]) => v !== 0);
  if (entries.length === 0) return emptyLabel;
  return entries.map(([currency, minor]) => formatMinor(minor, currency)).join(" + ");
}

export function noData(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) return "No data";
  return `${value}${suffix}`;
}

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
}) {
  if (empty) {
    return (
      <div className="rounded-lg border border-edge bg-panel p-5 text-sm text-ink-faint">
        No data
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-edge">
      <table className="w-full bg-panel text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-xs text-ink-faint">
            {headers.map((header) => (
              <th key={header} className="px-4 py-2.5 font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
