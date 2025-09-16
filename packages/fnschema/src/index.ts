export type PlaceOrderArgs = {
  symbol: string; side: "BUY"|"SELL"; type: "LIMIT"|"MARKET"|"STOP";
  qty: number; price?: number; tp?: number; sl?: number; reduceOnly?: boolean
};

export type FnSchema =
  | { name:"placeOrder"; args: PlaceOrderArgs }
  | { name:"tokenizeAsset"; args:{ type:"realestate"|"bond"|"commodity"|"art"; valueUsd:number; metadataUrl:string } }
  | { name:"getRWARegistry"; args:{ id?:string; type?:string } }
  | { name:"depositVault"; args:{ vaultId:string; amount:number } }
  | { name:"withdrawVault"; args:{ vaultId:string; shares:number } }
  | { name:"getVaultPerformance"; args:{ vaultId:string } }
  | { name:"getGreeks"; args:{ symbol:string; expiry:string; strike:number; type:"CALL"|"PUT" } }
  | { name:"runHedgeBot"; args:{ mode:"simulation"|"paper"|"real"; riskPolicyId?:string } }
  | { name:"getBridgeRisk"; args:{ from:string; to:string; amountUsd:number } }
  | { name:"routeIntentV2"; args:{
      symbol:string; side:"BUY"|"SELL"; qty:number; type:"LIMIT"|"MARKET";
      maxImpactBps?:number; minLiquidityScore?:number; preferPrivateFlow?:boolean
    } }
  | { name:"explainDecision"; args:{ intentId:string } };
