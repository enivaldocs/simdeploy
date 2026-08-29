/** Funil de conversão calculado sobre contagens reais de eventos. */

export interface FunnelStepInput {
  name: string;
  count: number;
}

export interface FunnelStep extends FunnelStepInput {
  /** Conversão em relação à etapa anterior (%); null na primeira etapa ou sem base. */
  stepConversionPct: number | null;
  /** Conversão em relação ao topo do funil (%); null sem base. */
  topConversionPct: number | null;
}

export function computeFunnel(steps: FunnelStepInput[]): FunnelStep[] {
  const top = steps[0]?.count ?? 0;
  return steps.map((step, index) => {
    const previous = index > 0 ? (steps[index - 1]?.count ?? 0) : null;
    return {
      ...step,
      stepConversionPct:
        previous !== null && previous > 0
          ? Math.round((step.count / previous) * 10000) / 100
          : null,
      topConversionPct: index > 0 && top > 0 ? Math.round((step.count / top) * 10000) / 100 : null,
    };
  });
}
