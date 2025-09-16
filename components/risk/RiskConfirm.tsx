"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RiskConfirm({ onApproveAction, summary }:{ onApproveAction:()=>Promise<void>; summary: React.ReactNode }) {
  const [busy,setBusy] = useState(false);
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader><CardTitle>Risk Onayı</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="text-white/80 text-sm">{summary}</div>
        <div className="text-xs text-white/60">Onay, politika limitleri ve işlem koşullarını kabul eder.</div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/20">İptal</Button>
          <Button disabled={busy} className="bg-emerald-400 text-black"
            onClick={async()=>{ setBusy(true); try { await onApproveAction(); } finally { setBusy(false); } }}>
            {busy? "İmzalanıyor…" : "Onayla"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
