#!/usr/bin/env python3
"""
AILYDIAN RATE LIMITER & COST METER
===================================
TPS (Transactions Per Second) ve RPM (Requests Per Minute) kontrolü.
Token-based maliyet hesaplama.

Örnek kullanım:
    limiter = RateLimiter()
    if limiter.allow("org_123", tps=5, rpm=100):
        # İşlem yapılabilir
        cost = calculate_cost(input_tokens=100, output_tokens=50)
"""

import time
from collections import defaultdict, deque
from typing import Dict, Tuple
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════
# 1. VERİ YAPILARI
# ═══════════════════════════════════════════════════════════════

@dataclass
class TokenUsage:
    """Token kullanım istatistikleri"""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0


@dataclass
class WindowStats:
    """Sliding window istatistikleri"""
    timestamps: deque = field(default_factory=deque)  # Request zamanları
    count: int = 0


# ═══════════════════════════════════════════════════════════════
# 2. RATE LIMITER
# ═══════════════════════════════════════════════════════════════

class RateLimiter:
    """
    In-memory sliding window rate limiter

    TPS ve RPM limitlerini kontrol eder.
    Production'da Redis kullanın (dağıtık sistem için).
    """

    def __init__(self):
        # Key: org_id, Value: {second: WindowStats, minute: WindowStats}
        self._windows: Dict[str, Dict[str, WindowStats]] = defaultdict(
            lambda: {
                "second": WindowStats(timestamps=deque()),
                "minute": WindowStats(timestamps=deque())
            }
        )

    def _clean_old_entries(self, window: WindowStats, window_size: float):
        """
        Sliding window'dan eski girişleri temizle

        Args:
            window: WindowStats object
            window_size: Window boyutu (saniye cinsinden)
        """
        now = time.time()
        cutoff = now - window_size

        # Eski timestampları çıkar
        while window.timestamps and window.timestamps[0] < cutoff:
            window.timestamps.popleft()
            window.count -= 1

    def allow(self, key: str, tps: int, rpm: int) -> bool:
        """
        Rate limit kontrolü yap

        Args:
            key: Unique key (genelde org_id)
            tps: Transactions per second limit
            rpm: Requests per minute limit

        Returns:
            True if request is allowed, False if rate limited
        """
        now = time.time()
        windows = self._windows[key]

        # 1. TPS kontrolü (1 saniyelik window)
        second_window = windows["second"]
        self._clean_old_entries(second_window, window_size=1.0)

        if second_window.count >= tps:
            return False  # TPS aşıldı

        # 2. RPM kontrolü (60 saniyelik window)
        minute_window = windows["minute"]
        self._clean_old_entries(minute_window, window_size=60.0)

        if minute_window.count >= rpm:
            return False  # RPM aşıldı

        # 3. İsteği kaydet
        second_window.timestamps.append(now)
        second_window.count += 1

        minute_window.timestamps.append(now)
        minute_window.count += 1

        return True

    def get_current_usage(self, key: str) -> Tuple[int, int]:
        """
        Mevcut TPS ve RPM kullanımını getir

        Args:
            key: Unique key

        Returns:
            Tuple of (current_tps, current_rpm)
        """
        windows = self._windows[key]

        # Clean old entries first
        self._clean_old_entries(windows["second"], window_size=1.0)
        self._clean_old_entries(windows["minute"], window_size=60.0)

        return (
            windows["second"].count,
            windows["minute"].count
        )

    def reset(self, key: str):
        """
        Belirli bir key için rate limit state'ini sıfırla

        Args:
            key: Unique key
        """
        if key in self._windows:
            del self._windows[key]


# ═══════════════════════════════════════════════════════════════
# 3. COST CALCULATOR
# ═══════════════════════════════════════════════════════════════

# Fiyatlandırma (USD per 1M tokens)
# Bu değerler örnek, gerçek fiyatları .env'den okuyun
PRICING = {
    "onnx": {
        "input": 0.0,      # ONNX kendi modelimiz, sıfır maliyet
        "output": 0.0
    },
    "anthropic_claude": {
        "input": 3.0,      # $3 / 1M input tokens
        "output": 15.0     # $15 / 1M output tokens
    },
    "openai_gpt4": {
        "input": 10.0,     # $10 / 1M input tokens
        "output": 30.0     # $30 / 1M output tokens
    },
    "google_gemini": {
        "input": 0.5,      # $0.5 / 1M input tokens
        "output": 1.5      # $1.5 / 1M output tokens
    }
}


def calculate_cost(
    input_tokens: int,
    output_tokens: int,
    model: str = "anthropic_claude"
) -> TokenUsage:
    """
    Token kullanımına göre maliyet hesapla

    Args:
        input_tokens: Input token sayısı
        output_tokens: Output token sayısı
        model: Model adı (pricing key)

    Returns:
        TokenUsage object with cost breakdown
    """
    total_tokens = input_tokens + output_tokens

    # Fiyatları al (default: Claude)
    pricing = PRICING.get(model, PRICING["anthropic_claude"])

    # Maliyet hesapla ($USD)
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    total_cost = input_cost + output_cost

    return TokenUsage(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        cost_usd=round(total_cost, 6)
    )


def estimate_token_count(text: str) -> int:
    """
    Text'ten yaklaşık token sayısını tahmin et

    Basit tahmin: 1 token ≈ 4 karakter (İngilizce için)
    Türkçe için: 1 token ≈ 3 karakter (daha verimli)

    Args:
        text: Input text

    Returns:
        Estimated token count
    """
    # Basit tahmin: kelime sayısı * 1.3
    # Production'da tiktoken veya transformers tokenizer kullanın
    words = text.split()
    return int(len(words) * 1.3)


# ═══════════════════════════════════════════════════════════════
# 4. DAILY QUOTA TRACKER
# ═══════════════════════════════════════════════════════════════

class DailyQuotaTracker:
    """
    Günlük token quota takibi

    Production'da database veya Redis kullanın.
    """

    def __init__(self):
        # Key: org_id, Value: {date: str, tokens_used: int}
        self._usage: Dict[str, Dict] = defaultdict(lambda: {
            "date": time.strftime("%Y-%m-%d"),
            "tokens_used": 0
        })

    def _get_today(self) -> str:
        """Bugünün tarihi (YYYY-MM-DD)"""
        return time.strftime("%Y-%m-%d")

    def add_usage(self, org_id: str, tokens: int):
        """
        Token kullanımı ekle

        Args:
            org_id: Organization ID
            tokens: Token sayısı
        """
        today = self._get_today()
        usage = self._usage[org_id]

        # Eğer gün değiştiyse, sıfırla
        if usage["date"] != today:
            usage["date"] = today
            usage["tokens_used"] = 0

        usage["tokens_used"] += tokens

    def get_usage(self, org_id: str) -> int:
        """
        Bugünkü token kullanımını getir

        Args:
            org_id: Organization ID

        Returns:
            Tokens used today
        """
        today = self._get_today()
        usage = self._usage[org_id]

        # Eğer gün değiştiyse, 0 döndür
        if usage["date"] != today:
            return 0

        return usage["tokens_used"]

    def check_quota(self, org_id: str, daily_limit: int) -> bool:
        """
        Günlük quota kontrolü

        Args:
            org_id: Organization ID
            daily_limit: Daily token limit

        Returns:
            True if under quota, False if exceeded
        """
        used = self.get_usage(org_id)
        return used < daily_limit


# ═══════════════════════════════════════════════════════════════
# 5. GLOBAL INSTANCES
# ═══════════════════════════════════════════════════════════════

# Global singleton instances
_rate_limiter = RateLimiter()
_quota_tracker = DailyQuotaTracker()


def get_rate_limiter() -> RateLimiter:
    """Global rate limiter instance"""
    return _rate_limiter


def get_quota_tracker() -> DailyQuotaTracker:
    """Global quota tracker instance"""
    return _quota_tracker


# ═══════════════════════════════════════════════════════════════
# 6. TEST / DEMO
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("═══════════════════════════════════════════════════════════════")
    print("🔥 AILYDIAN RATE LIMITER & COST METER - DEMO")
    print("═══════════════════════════════════════════════════════════════\n")

    # 1. Rate Limiter Demo
    print("⏱️  Rate Limiter Demo:")
    limiter = RateLimiter()

    org_id = "org_test"
    tps_limit = 3
    rpm_limit = 10

    print(f"  Limits: TPS={tps_limit}, RPM={rpm_limit}\n")

    # Rapid requests
    for i in range(5):
        allowed = limiter.allow(org_id, tps=tps_limit, rpm=rpm_limit)
        tps, rpm = limiter.get_current_usage(org_id)
        status = "✅ ALLOWED" if allowed else "❌ BLOCKED"
        print(f"  Request {i+1}: {status} (TPS: {tps}/{tps_limit}, RPM: {rpm}/{rpm_limit})")

        if i == 2:
            # TPS aşıldı, 1 saniye bekle
            print("  💤 Sleeping 1s to reset TPS window...")
            time.sleep(1.1)

    print()

    # 2. Cost Calculator Demo
    print("💰 Cost Calculator Demo:")

    test_cases = [
        ("ONNX (kendi modelimiz)", 1000, 500, "onnx"),
        ("Claude 3.5 Sonnet", 1000, 500, "anthropic_claude"),
        ("GPT-4", 1000, 500, "openai_gpt4"),
        ("Gemini Pro", 1000, 500, "google_gemini")
    ]

    for name, input_tok, output_tok, model in test_cases:
        usage = calculate_cost(input_tok, output_tok, model)
        print(f"  {name}:")
        print(f"    Input:  {usage.input_tokens} tokens")
        print(f"    Output: {usage.output_tokens} tokens")
        print(f"    Cost:   ${usage.cost_usd}")
        print()

    # 3. Daily Quota Demo
    print("📊 Daily Quota Tracker Demo:")
    quota = DailyQuotaTracker()

    org_id = "org_quota_test"
    daily_limit = 5_000_000

    # Simulate usage
    quota.add_usage(org_id, 1_000_000)
    quota.add_usage(org_id, 2_000_000)

    used = quota.get_usage(org_id)
    remaining = daily_limit - used
    under_quota = quota.check_quota(org_id, daily_limit)

    print(f"  Org ID: {org_id}")
    print(f"  Daily Limit: {daily_limit:,} tokens")
    print(f"  Used Today:  {used:,} tokens")
    print(f"  Remaining:   {remaining:,} tokens")
    print(f"  Status:      {'✅ Under quota' if under_quota else '❌ Quota exceeded'}")

    print("\n✅ Demo complete!")
