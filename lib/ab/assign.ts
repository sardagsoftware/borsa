import UAParser from "ua-parser-js";
import { nanoid } from "nanoid";

export type Variant = "A" | "B";

/**
 * Choose A/B test variant based on user agent and device characteristics
 * Variant A = Calm theme, Variant B = Elevated theme
 * Mobile users get slightly more B (elevated) for better engagement
 */
export function chooseVariant(headers: Headers): Variant {
  const userAgent = headers.get("user-agent") || "";
  const ua = new UAParser(userAgent).getResult();
  
  // Create deterministic but pseudo-random bias
  // Mobile users get more elevated theme (55% vs 50%)
  const isMobile = ua.device.type === "mobile" || ua.device.type === "tablet";
  const bias = isMobile ? 0.55 : 0.5;
  
  // Generate pseudo-random number based on user agent hash
  const hash = nanoid().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomValue = (Math.abs(hash) % 100) / 100;
  
  return randomValue < bias ? "B" : "A";
}

/**
 * Get device and geographic context for enhanced A/B assignment
 */
export function getDeviceContext(headers: Headers): {
  device: string;
  browser: string;
  os: string;
  isMobile: boolean;
} {
  const userAgent = headers.get("user-agent") || "";
  const ua = new UAParser(userAgent).getResult();
  
  return {
    device: ua.device.type || "desktop",
    browser: `${ua.browser.name} ${ua.browser.version}`.trim(),
    os: `${ua.os.name} ${ua.os.version}`.trim(),
    isMobile: ua.device.type === "mobile" || ua.device.type === "tablet"
  };
}

/**
 * Map A/B variant to theme regime
 * A = Calm (soothing, relaxed experience)
 * B = Elevated (more energetic, engaging experience)
 */
export function variantToRegime(variant: Variant): "calm" | "elevated" {
  return variant === "A" ? "calm" : "elevated";
}

/**
 * Check if current market conditions should override A/B test with Shock theme
 */
export function shouldOverrideWithShock(marketVolatility?: number): boolean {
  // If volatility is above 0.8 (80%), force shock theme regardless of A/B
  return marketVolatility !== undefined && marketVolatility > 0.8;
}
