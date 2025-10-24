"use client";
import { useState, useEffect } from "react";
import { Bell, Plus, X, TrendingUp, TrendingDown, BellRing } from "lucide-react";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useChartStore } from "@/store/useChartStore";
import toast from "react-hot-toast";
import numeral from "numeral";
import {
  requestNotificationPermission,
  canShowNotifications,
  getNotificationPermission,
  showTestNotification,
} from "@/lib/utils/notifications";

export default function PriceAlerts() {
  const { alerts, addAlert, removeAlert } = usePriceAlertStore();
  const { symbol } = useChartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("price-alerts-notifications") === "true";
    }
    return false;
  });
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  const activeAlerts = alerts.filter((a) => a.symbol === symbol && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.symbol === symbol && a.triggered);

  // Check notification permission on mount
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      toast.success("Bildirim izni verildi!");
      setNotificationsEnabled(true);
      localStorage.setItem("price-alerts-notifications", "true");

      // Show test notification
      showTestNotification();
    } else {
      toast.error("Bildirim izni reddedildi");
      setNotificationsEnabled(false);
      localStorage.setItem("price-alerts-notifications", "false");
    }
  };

  const handleToggleNotifications = () => {
    if (!canShowNotifications() && !notificationsEnabled) {
      handleRequestPermission();
    } else {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      localStorage.setItem("price-alerts-notifications", String(newValue));

      if (newValue) {
        toast.success("Tarayıcı bildirimleri açıldı");
        showTestNotification();
      } else {
        toast("Tarayıcı bildirimleri kapatıldı", { icon: "🔕" });
      }
    }
  };

  const handleAddAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Geçersiz fiyat");
      return;
    }

    addAlert({
      symbol,
      targetPrice: price,
      condition,
      message: `${symbol} ${condition === 'above' ? 'üstünde' : 'altında'} $${price}`,
    });

    toast.success(`Alarm kuruldu: ${symbol} ${condition === 'above' ? 'üstünde' : 'altında'} $${numeral(price).format("0,0.00")}`);
    setTargetPrice("");
    setShowAddForm(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-36 z-40 btn bg-bg-card border border-border p-3 shadow-lg relative"
        title="Fiyat Alarmları"
      >
        <Bell className="w-5 h-5" />
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red rounded-full text-xs flex items-center justify-center font-bold">
            {activeAlerts.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-36 w-80 bg-bg-card border border-border rounded-xl shadow-2xl z-40 max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <h3 className="font-bold text-sm">Fiyat Alarmları</h3>
          <span className="text-xs opacity-50">({activeAlerts.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleNotifications}
            className={`btn p-1.5 transition-colors ${
              notificationsEnabled && canShowNotifications()
                ? "bg-accent-blue text-white"
                : "hover:bg-white/10"
            }`}
            title={
              notificationsEnabled
                ? "Tarayıcı bildirimleri açık"
                : "Tarayıcı bildirimlerini aç"
            }
          >
            <BellRing className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="btn p-1 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Symbol */}
      <div className="px-4 py-2 border-b border-border bg-white/5">
        <div className="text-xs opacity-70">Mevcut Sembol</div>
        <div className="font-mono font-bold">{symbol}</div>
      </div>

      {/* Add Alert Form */}
      {showAddForm ? (
        <div className="p-4 border-b border-border bg-white/5">
          <div className="mb-3">
            <label className="text-xs opacity-70 mb-1 block">Hedef Fiyat</label>
            <input
              type="number"
              className="input w-full"
              placeholder="0.00"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="text-xs opacity-70 mb-1 block">Koşul</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCondition("above")}
                className={`flex-1 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  condition === "above"
                    ? "bg-accent-green text-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Üstünde
              </button>
              <button
                onClick={() => setCondition("below")}
                className={`flex-1 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  condition === "below"
                    ? "bg-accent-red text-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                Altında
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddAlert}
              className="btn btn-success flex-1 text-xs"
            >
              Alarm Ekle
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setTargetPrice("");
              }}
              className="btn flex-1 text-xs"
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-border">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-success w-full text-xs"
          >
            <Plus className="w-3 h-3" />
            <span className="ml-1">Fiyat Alarmı Ekle</span>
          </button>
        </div>
      )}

      {/* Active Alerts */}
      <div className="flex-1 overflow-y-auto">
        {activeAlerts.length === 0 && (
          <div className="p-8 text-center text-sm opacity-50">
            {symbol} için aktif alarm yok
          </div>
        )}

        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 border-b border-border hover:bg-white/5 group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {alert.condition === "above" ? (
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-accent-red" />
                )}
                <span className="text-xs opacity-70 capitalize">
                  {alert.condition === 'above' ? 'Üstünde' : 'Altında'}
                </span>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="font-mono font-bold">
              ${numeral(alert.targetPrice).format("0,0.00")}
            </div>
            <div className="text-xs opacity-50 mt-1">
              Oluşturuldu: {new Date(alert.createdAt).toLocaleTimeString('tr-TR')}
            </div>
          </div>
        ))}

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <>
            <div className="p-2 bg-white/5 text-xs opacity-50 border-b border-border">
              Tetiklenen Alarmlar
            </div>
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 border-b border-border opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    {alert.condition === 'above' ? 'Üstünde' : 'Altında'} ${numeral(alert.targetPrice).format("0,0.00")}
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
