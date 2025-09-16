export class UserFacingError extends Error { code?:string; constructor(m:string, code?:string){ super(m); this.code=code; } }
export const withCircuit = async <T>(fn:()=>Promise<T>, label:string, budgetMs=1500): Promise<T> => {
  const ctl = new AbortController(); const t = setTimeout(()=> ctl.abort(), budgetMs);
  try { return await fn(); }
  catch { throw new UserFacingError(`${label} şu an yoğun. Lütfen tekrar deneyin.`, "CIRCUIT"); }
  finally { clearTimeout(t); }
};
