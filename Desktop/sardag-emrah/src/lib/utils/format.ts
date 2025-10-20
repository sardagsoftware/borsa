import numeral from "numeral";

export function formatPrice(price: number): string {
  if (price >= 1) return numeral(price).format('0,0.00');
  if (price >= 0.01) return numeral(price).format('0,0.0000');
  return numeral(price).format('0,0.00000000');
}

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return numeral(vol / 1e9).format('0.00a').toUpperCase();
  if (vol >= 1e6) return numeral(vol / 1e6).format('0.00a').toUpperCase();
  if (vol >= 1e3) return numeral(vol / 1e3).format('0.00a').toUpperCase();
  return numeral(vol).format('0,0');
}

export function formatPercent(val: number): string {
  return numeral(val / 100).format('+0.00%');
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
