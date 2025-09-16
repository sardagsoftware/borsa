import type { NextApiRequest } from "next";
import { Server } from "ws";
export const config = { api: { bodyParser: false } };

let wss: Server | undefined;

export default function handler(req: NextApiRequest, res: any) {
  if (!wss) {
    // @ts-ignore
    wss = new Server({ noServer: true });
    // @ts-ignore
    req.socket.server.on("upgrade", (reqUpg:any, socket:any, head:any) => {
      if (!reqUpg.url?.startsWith("/api/stream/")) return;
      // @ts-ignore
      wss!.handleUpgrade(reqUpg, socket, head, (ws)=> wss!.emit("connection", ws, reqUpg));
    });
    // DEMO yayını: her 2 sn'de vault metriği
    setInterval(()=> {
      const msg = JSON.stringify({ topic:"vault", ts: Date.now(), data:{ tvl: 95.3 + Math.random(), apy: 5.2 + Math.random()/5 }});
      wss!.clients.forEach(c=> c.readyState===1 && c.send(msg));
    }, 2000);
  }
  res.end();
}
