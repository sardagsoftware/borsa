import crypto from "crypto";
export function sign(body: string, secret: string) {
  const ts = Math.floor(Date.now()/1000).toString();
  const nonce = crypto.randomBytes(8).toString("hex");
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${nonce}.${body}`).digest("hex");
  return { ts, nonce, sig };
}
