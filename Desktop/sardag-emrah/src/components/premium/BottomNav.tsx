"use client";
import { TrendingUp, Clock, Bell, Star, Book, Target } from "lucide-react";

type DrawerType = "signals" | "mtf" | "alerts" | "reference" | "watchlist" | "price-alerts" | null;

type Props = {
  activeDrawer: DrawerType;
  onDrawerToggle: (drawer: DrawerType) => void;
};

export default function BottomNav({ activeDrawer, onDrawerToggle }: Props) {
  const navItems = [
    { id: "signals" as DrawerType, icon: TrendingUp, label: "Sinyaller", color: "text-accent-green" },
    { id: "mtf" as DrawerType, icon: Clock, label: "Zaman", color: "text-accent-yellow" },
    { id: "alerts" as DrawerType, icon: Bell, label: "Alarmlar", color: "text-accent-red" },
    { id: "watchlist" as DrawerType, icon: Star, label: "Liste", color: "text-accent-blue" },
    { id: "reference" as DrawerType, icon: Book, label: "Rehber", color: "text-white/70" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeDrawer === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onDrawerToggle(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? "bg-white/20 scale-110"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? item.color : "text-white/50"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-white/50"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
