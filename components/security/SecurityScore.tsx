import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SecurityScore({ score, size = 'md' }: SecurityScoreProps) {
  const getColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getIcon = (score: number) => {
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    
    if (score >= 90) {
      return <CheckCircle className={`${iconSize} text-green-500`} />;
    }
    if (score >= 60) {
      return <Shield className={`${iconSize} text-yellow-500`} />;
    }
    return <AlertTriangle className={`${iconSize} text-red-500`} />;
  };

  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-2">
      {getIcon(score)}
      <span className={`font-bold ${getColor(score)} ${textSize}`}>
        {score}
      </span>
      <span className="text-binance-textSecondary text-sm">/100</span>
    </div>
  );
}
