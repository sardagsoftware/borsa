export const ENV = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  WS_URL:   process.env.NEXT_PUBLIC_WS_URL   || "http://localhost:3000",
  MODE:     process.env.NEXT_PUBLIC_MODE     ?? "demo" // "demo" | "prod"
};
export const isDemo = () => ENV.MODE !== "prod";
