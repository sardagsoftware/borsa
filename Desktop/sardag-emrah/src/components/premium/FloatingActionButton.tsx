"use client";
import { useState } from "react";
import { Plus, TrendingUp, Clock, Bell, Star, Book, Target, X } from "lucide-react";

type Props = {
  onAction: (action: string) => void;
};

export default function FloatingActionButton({ onAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: "signals", icon: TrendingUp, label: "Sinyaller", color: "from-green-500 to-emerald-600" },
    { id: "mtf", icon: Clock, label: "Çoklu Zaman", color: "from-yellow-500 to-orange-600" },
    { id: "alerts", icon: Bell, label: "Alarmlar", color: "from-red-500 to-pink-600" },
    { id: "watchlist", icon: Star, label: "İzleme Listesi", color: "from-blue-500 to-cyan-600" },
    { id: "reference", icon: Book, label: "Rehber", color: "from-purple-500 to-indigo-600" },
    { id: "scan", icon: Target, label: "Tarama", color: "from-orange-500 to-red-600" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onAction(action.id);
                  setIsOpen(false);
                }}
                className={`group flex items-center gap-3 bg-gradient-to-r ${action.color} text-white px-4 py-3 rounded-full shadow-2xl hover:scale-110 transition-all`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue via-accent-green to-accent-yellow shadow-2xl hover:scale-110 transition-all flex items-center justify-center ${
          isOpen ? "rotate-45" : ""
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" strokeWidth={3} />
        ) : (
          <Plus className="w-7 h-7 text-white" strokeWidth={3} />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
