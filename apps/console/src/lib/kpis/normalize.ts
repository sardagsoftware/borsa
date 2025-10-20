type Any = Record<string, any>;
export function normalizeKpis(k:Any|null){
  const z = k||{};
  return {
    crash_free: z.crash_free ?? z.crashFree ?? null,
    p95_gpu_ms: z.p95_gpu ?? z.p95Gpu ?? null,
    p95_cpu_ms: z.p95_cpu ?? z.p95Cpu ?? null,
    server_latency: z.server_latency ?? z.latency ?? null,
    retention: z.retention ?? { d1:null, d7:null, d30:null },
    inflation: z.inflation ?? z.inflation_index ?? null,
    ts: z.timestamp ?? null
  };
}
