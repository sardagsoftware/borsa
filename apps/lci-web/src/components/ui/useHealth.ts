'use client';

import { useEffect, useState } from 'react';

type Row = {
  name: string;
  url: string;
  code: number;
  ms: number;
  status: 'up' | 'warn' | 'down';
  err?: string | null;
  group?: string;
};

export default function useHealth(intervalMs = 60000) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/healthmap', { cache: 'no-store' });
        const data = await res.json();
        setRows(data.items || []);
      } catch (error) {
        console.error('Health fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const upCount = rows.filter(r => r.status === 'up').length;
  const warnCount = rows.filter(r => r.status === 'warn').length;
  const downCount = rows.filter(r => r.status === 'down').length;
  const total = rows.length;
  const upPct = total > 0 ? Math.round((upCount / total) * 100) : 0;

  return { rows, loading, upCount, warnCount, downCount, total, upPct };
}
