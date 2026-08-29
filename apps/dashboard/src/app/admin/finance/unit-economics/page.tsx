import { formatMinor } from "@autocloud/finance";
import { moneyByCurrency, Stat } from "@/components/admin-ui";
import { getUnitEconomics } from "@/lib/admin/metrics";
import { requireStaff } from "@/lib/auth/staff";

export default async function UnitEconomicsPage() {
  await requireStaff("finance");
  const ue = await getUnitEconomics();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-xl font-medium">Unit economics</h1>
      <p className="mb-8 text-xs text-ink-faint">
        Métricas sem base observada mostram "No data" — CAC, LTV/CAC, payback, NRR e GRR entram
        quando houver dados de aquisição paga e histórico de cohort suficiente.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="MRR" value={moneyByCurrency(ue.mrr)} />
        <Stat
          label="ARPU (monthly)"
          value={ue.arpu ? moneyByCurrency(ue.arpu) : "No data"}
          hint={`${ue.paidCustomers} pagantes`}
        />
        <Stat label="Churn (month)" value={ue.churnPct === null ? "No data" : `${ue.churnPct}%`} />
        <Stat
          label="LTV (simple)"
          value={ue.ltvMinor === null ? "No data" : formatMinor(ue.ltvMinor, "BRL")}
          hint="ARPU / churn mensal"
        />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Avg infra cost / customer"
          value={
            ue.avgCostPerCustomerMinor === null
              ? "No data"
              : formatMinor(ue.avgCostPerCustomerMinor, ue.costCurrency)
          }
          hint="custo ACTUAL do mês"
        />
        <Stat
          label="Avg infra cost / project"
          value={
            ue.avgCostPerProjectMinor === null
              ? "No data"
              : formatMinor(ue.avgCostPerProjectMinor, ue.costCurrency)
          }
        />
        <Stat label="CAC" value="No data" hint="requer gasto de aquisição registrado" />
        <Stat label="LTV/CAC" value="No data" hint="requer CAC" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Payback" value="No data" hint="requer CAC" />
        <Stat label="NRR" value="No data" hint="requer 2+ meses de cohort pagante" />
        <Stat label="GRR" value="No data" hint="requer 2+ meses de cohort pagante" />
      </div>
    </div>
  );
}
