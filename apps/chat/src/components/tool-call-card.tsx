'use client';

import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { ToolCall } from '@/store/chat-store';
import { useState } from 'react';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Play className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'success':
        return 'Başarılı';
      case 'error':
        return 'Hata';
      case 'running':
        return 'Çalışıyor...';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'success':
        return 'border-green-500/50 bg-green-500/5';
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'running':
        return 'border-primary/50 bg-primary/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${getStatusColor()}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">{toolCall.action}</span>
        </div>
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Payload */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Parametreler:
            </p>
            <pre className="text-xs bg-secondary p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.payload, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {toolCall.result && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Sonuç:
              </p>
              {toolCall.result.success ? (
                <pre className="text-xs bg-secondary p-2 rounded overflow-x-auto">
                  {JSON.stringify(toolCall.result.data, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  <p className="font-semibold">{toolCall.result.error?.code}</p>
                  <p>{toolCall.result.error?.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Timing */}
          {toolCall.startedAt && (
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Başlangıç: {new Date(toolCall.startedAt).toLocaleTimeString('tr-TR')}</span>
              {toolCall.completedAt && (
                <span>Bitiş: {new Date(toolCall.completedAt).toLocaleTimeString('tr-TR')}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
