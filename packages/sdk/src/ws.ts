export type StreamMsg<T=any> = { topic:string; data:T; ts:number };
export function connect(topic: string, onMsg: (m:StreamMsg)=>void) {
  const url = `${process.env.NEXT_PUBLIC_WS_URL}/api/stream/${topic}`.replace(/^http/,"ws");
  const ws = new WebSocket(url);
  ws.onmessage = (ev) => { try { onMsg(JSON.parse(ev.data)); } catch {} };
  return () => ws.close();
}
