export type PriceAlertCondition = "above" | "below" | "crosses_above" | "crosses_below";

export type PriceAlert = {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: PriceAlertCondition;
  createdAt: number;
  triggered: boolean;
  message?: string;
};

export type PriceAlertInput = Omit<PriceAlert, "id" | "createdAt" | "triggered">;
