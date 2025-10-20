export type AlertType = "VOL_BREAKOUT" | "PRICE_SR_BREAK" | "MA_PULLBACK" | "MULTI_STRATEGY";
export type AlertDirection = "UP" | "DOWN";

export type BreakoutAlert = {
  id: string;
  symbol: string;
  tf: string;
  time: number;
  type: AlertType;
  direction: AlertDirection;
  zScore?: number;
  price: number;
  message: string;
  // MA Pullback specific fields
  interval?: string;
  strength?: string | number;  // Can be string or number
  timestamp?: number;
};
