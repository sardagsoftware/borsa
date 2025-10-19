#!/usr/bin/env python3
"""
AILYDIAN MULTI-TENANT CONFIGURATION
====================================
Her organizasyon kendi LoRA adapter, RAG collection ve rate limits kullanır.

Örnek kullanım:
    tenant = get_tenant("org_123")
    lora_path = tenant.lora_path
    rate_ok = tenant.limits.tps <= 5
"""

import os
import json
from typing import Optional
from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════
# 1. VERİ MODELLERİ
# ═══════════════════════════════════════════════════════════════

class TenantLimits(BaseModel):
    """Rate limiting ve maliyet sınırları"""
    tps: int = Field(default=2, description="Transactions per second")
    rpm: int = Field(default=60, description="Requests per minute")
    daily_tokens: int = Field(default=5_000_000, description="Günlük token limiti")


class Tenant(BaseModel):
    """Organizasyon (kiracı) bilgileri"""
    org_id: str = Field(..., description="Unique organization ID (e.g., org_123)")
    name: str = Field(..., description="Organization name")
    lora_path: str = Field(..., description="Path to organization's LoRA adapter")
    rag_collection: str = Field(..., description="Qdrant collection name")
    limits: TenantLimits = Field(default_factory=TenantLimits)
    active: bool = Field(default=True, description="Is tenant active?")


# ═══════════════════════════════════════════════════════════════
# 2. YAPLANDIRMA DEPOLAMA
# ═══════════════════════════════════════════════════════════════

# In-memory tenant registry (Production'da database veya Redis kullanın)
TENANT_REGISTRY: dict[str, Tenant] = {}


def seed_demo_tenants():
    """Demo kiracılar ekle"""
    demo_tenants = [
        Tenant(
            org_id="org_ailydian",
            name="Ailydian HQ",
            lora_path="data/artifacts/adapters/ailydian-lora",
            rag_collection="ailydian_corpus",
            limits=TenantLimits(tps=10, rpm=300, daily_tokens=10_000_000),
            active=True
        ),
        Tenant(
            org_id="org_medical",
            name="Medical AI Division",
            lora_path="data/artifacts/adapters/medical-lora",
            rag_collection="medical_knowledge",
            limits=TenantLimits(tps=5, rpm=150, daily_tokens=5_000_000),
            active=True
        ),
        Tenant(
            org_id="org_legal",
            name="Legal AI Division",
            lora_path="data/artifacts/adapters/legal-lora",
            rag_collection="legal_corpus",
            limits=TenantLimits(tps=3, rpm=100, daily_tokens=3_000_000),
            active=True
        ),
    ]

    for tenant in demo_tenants:
        TENANT_REGISTRY[tenant.org_id] = tenant

    print(f"✅ Seeded {len(demo_tenants)} demo tenants")


# ═══════════════════════════════════════════════════════════════
# 3. TENANT İŞLEMLERİ
# ═══════════════════════════════════════════════════════════════

def get_tenant(org_id: str) -> Optional[Tenant]:
    """
    Organizasyon ID'sine göre tenant bilgilerini getir

    Args:
        org_id: Organization identifier (e.g., "org_ailydian")

    Returns:
        Tenant object or None if not found
    """
    return TENANT_REGISTRY.get(org_id)


def register_tenant(tenant: Tenant) -> bool:
    """
    Yeni tenant kaydet

    Args:
        tenant: Tenant object to register

    Returns:
        True if successful, False if org_id already exists
    """
    if tenant.org_id in TENANT_REGISTRY:
        print(f"⚠️  Tenant {tenant.org_id} already exists")
        return False

    TENANT_REGISTRY[tenant.org_id] = tenant
    print(f"✅ Registered tenant: {tenant.org_id} ({tenant.name})")
    return True


def update_tenant(org_id: str, updates: dict) -> bool:
    """
    Tenant bilgilerini güncelle

    Args:
        org_id: Organization ID
        updates: Dictionary of fields to update

    Returns:
        True if successful, False if tenant not found
    """
    tenant = TENANT_REGISTRY.get(org_id)
    if not tenant:
        print(f"❌ Tenant {org_id} not found")
        return False

    # Update allowed fields
    for key, value in updates.items():
        if hasattr(tenant, key):
            setattr(tenant, key, value)

    print(f"✅ Updated tenant: {org_id}")
    return True


def deactivate_tenant(org_id: str) -> bool:
    """
    Tenant'ı deaktif et (silmeden)

    Args:
        org_id: Organization ID

    Returns:
        True if successful
    """
    return update_tenant(org_id, {"active": False})


def list_tenants(active_only: bool = False) -> list[Tenant]:
    """
    Tüm tenantları listele

    Args:
        active_only: Only return active tenants

    Returns:
        List of Tenant objects
    """
    tenants = list(TENANT_REGISTRY.values())
    if active_only:
        tenants = [t for t in tenants if t.active]
    return tenants


# ═══════════════════════════════════════════════════════════════
# 4. YAPLANDIRMA DOSYASI DESTEĞI
# ═══════════════════════════════════════════════════════════════

def load_tenants_from_file(path: str = "apps/inference/multitenancy/tenants.json"):
    """
    JSON dosyasından tenantları yükle

    Args:
        path: Path to JSON file
    """
    if not os.path.exists(path):
        print(f"⚠️  Config file not found: {path}")
        return

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for tenant_dict in data.get("tenants", []):
        tenant = Tenant(**tenant_dict)
        register_tenant(tenant)

    print(f"✅ Loaded {len(data.get('tenants', []))} tenants from {path}")


def save_tenants_to_file(path: str = "apps/inference/multitenancy/tenants.json"):
    """
    Tenantları JSON dosyasına kaydet

    Args:
        path: Path to save JSON file
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)

    data = {
        "tenants": [tenant.dict() for tenant in TENANT_REGISTRY.values()]
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(TENANT_REGISTRY)} tenants to {path}")


# ═══════════════════════════════════════════════════════════════
# 5. BAŞLATMA
# ═══════════════════════════════════════════════════════════════

def initialize():
    """Tenant registry'yi başlat"""
    # Önce config dosyasından yükle
    load_tenants_from_file()

    # Eğer boşsa, demo tenants ekle
    if not TENANT_REGISTRY:
        seed_demo_tenants()


# Module import edildiğinde otomatik başlat
initialize()


# ═══════════════════════════════════════════════════════════════
# 6. TEST / DEMO
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("═══════════════════════════════════════════════════════════════")
    print("🔥 AILYDIAN MULTI-TENANT CONFIG - DEMO")
    print("═══════════════════════════════════════════════════════════════\n")

    # 1. Tüm tenantları listele
    print("📋 All Tenants:")
    for tenant in list_tenants():
        print(f"  • {tenant.org_id}: {tenant.name} (TPS: {tenant.limits.tps}, RPM: {tenant.limits.rpm})")

    print()

    # 2. Belirli bir tenant getir
    print("🔍 Get tenant 'org_medical':")
    medical = get_tenant("org_medical")
    if medical:
        print(f"  Name: {medical.name}")
        print(f"  LoRA: {medical.lora_path}")
        print(f"  RAG Collection: {medical.rag_collection}")
        print(f"  TPS Limit: {medical.limits.tps}")

    print()

    # 3. Yeni tenant ekle
    print("➕ Register new tenant:")
    new_tenant = Tenant(
        org_id="org_demo",
        name="Demo Organization",
        lora_path="data/artifacts/adapters/demo-lora",
        rag_collection="demo_collection",
        limits=TenantLimits(tps=1, rpm=30, daily_tokens=1_000_000)
    )
    register_tenant(new_tenant)

    print()

    # 4. Tenant güncelle
    print("🔄 Update tenant 'org_demo':")
    update_tenant("org_demo", {"limits": TenantLimits(tps=2, rpm=60, daily_tokens=2_000_000)})

    print()

    # 5. Config dosyasına kaydet
    print("💾 Save to config file:")
    save_tenants_to_file()

    print("\n✅ Demo complete!")
