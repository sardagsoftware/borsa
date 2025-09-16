type FnCall = { name: string; args: any };

export class AilydianClient {
  constructor(private base = process.env.NEXT_PUBLIC_BASE_URL!) {}
  async call<T=any>(name: string, args: any, opt?: { signal?: AbortSignal }): Promise<T> {
    const res = await fetch(`${this.base}/api/functions/${name}`, {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify({ name, args } satisfies FnCall),
      signal: opt?.signal
    });
    if (!res.ok) {
      const j = await res.json().catch(()=> ({}));
      throw new Error(j?.message || `Fn ${name} failed (${res.status})`);
    }
    return res.json();
  }
}
export const client = new AilydianClient();
