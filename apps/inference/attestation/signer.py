#!/usr/bin/env python3
"""
AILYDIAN ATTESTATION - ED25519 SIGNATURE
=========================================
Model çıktılarını Ed25519 ile imzalar.

Attestation nedir?
- Model çıktısının özgünlüğünü kanıtlar
- Hangi model, hangi zaman, hangi parametrelerle üretildiğini gösterir
- Manipülasyon tespiti: İmza doğrulamazsa, çıktı değiştirilmiş demektir

Örnek kullanım:
    # İmzala
    signed = sign_payload(private_key, {"model_id": "...", "output": "..."})

    # Doğrula
    valid = verify_signature(public_key, signed)
"""

import os
import json
import base64
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import Base64Encoder, HexEncoder


# ═══════════════════════════════════════════════════════════════
# 1. ANAHTAR YÖNETİMİ
# ═══════════════════════════════════════════════════════════════

def generate_keypair() -> Dict[str, str]:
    """
    Yeni Ed25519 anahtar çifti oluştur

    Returns:
        Dictionary with 'private_key' and 'public_key' (base64)
    """
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key

    return {
        "private_key": signing_key.encode(encoder=Base64Encoder).decode("utf-8"),
        "public_key": verify_key.encode(encoder=Base64Encoder).decode("utf-8")
    }


def load_keys_from_env() -> Dict[str, str]:
    """
    Environment variable'dan anahtarları yükle

    Environment variables:
        ATTESTATION_PRIVATE_KEY: Ed25519 private key (base64)
        ATTESTATION_PUBLIC_KEY: Ed25519 public key (base64)

    Returns:
        Dictionary with 'private_key' and 'public_key'
    """
    private_key = os.getenv("ATTESTATION_PRIVATE_KEY")
    public_key = os.getenv("ATTESTATION_PUBLIC_KEY")

    if not private_key or not public_key:
        raise ValueError(
            "Missing attestation keys! Set ATTESTATION_PRIVATE_KEY and "
            "ATTESTATION_PUBLIC_KEY environment variables. "
            "Generate with: python -c 'from signer import generate_keypair; print(generate_keypair())'"
        )

    return {
        "private_key": private_key,
        "public_key": public_key
    }


# ═══════════════════════════════════════════════════════════════
# 2. İMZALAMA (SIGNING)
# ═══════════════════════════════════════════════════════════════

def create_attestation_payload(
    model_id: str,
    output: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Attestation payload oluştur

    Args:
        model_id: Model identifier (e.g., "ailydian-lora-v1.0")
        output: Model output text
        metadata: Optional metadata (org_id, user_id, etc.)

    Returns:
        Attestation payload dictionary
    """
    timestamp = datetime.utcnow().isoformat() + "Z"

    # Output hash (SHA256)
    output_hash = hashlib.sha256(output.encode("utf-8")).hexdigest()

    payload = {
        "model_id": model_id,
        "output_hash": output_hash,
        "output_length": len(output),
        "timestamp": timestamp,
        "version": "1.0"
    }

    # Add optional metadata
    if metadata:
        payload["metadata"] = metadata

    return payload


def sign_payload(private_key_b64: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Payload'ı Ed25519 private key ile imzala

    Args:
        private_key_b64: Ed25519 private key (base64 encoded)
        payload: Attestation payload

    Returns:
        Signed payload with 'signature' field
    """
    # Private key decode
    signing_key = SigningKey(private_key_b64, encoder=Base64Encoder)

    # Canonical JSON (sort keys)
    canonical_json = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    message = canonical_json.encode("utf-8")

    # Sign
    signed = signing_key.sign(message)

    # Return payload + signature
    signed_payload = payload.copy()
    signed_payload["signature"] = base64.b64encode(signed.signature).decode("utf-8")

    return signed_payload


def sign_output(
    model_id: str,
    output: str,
    private_key: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Model output'unu imzala (high-level API)

    Args:
        model_id: Model identifier
        output: Model output text
        private_key: Optional private key (default: load from env)
        metadata: Optional metadata

    Returns:
        Signed attestation payload
    """
    # Private key yükle
    if not private_key:
        keys = load_keys_from_env()
        private_key = keys["private_key"]

    # Payload oluştur ve imzala
    payload = create_attestation_payload(model_id, output, metadata)
    signed = sign_payload(private_key, payload)

    return signed


# ═══════════════════════════════════════════════════════════════
# 3. DOĞRULAMA (VERIFICATION)
# ═══════════════════════════════════════════════════════════════

def verify_signature(
    public_key_b64: str,
    signed_payload: Dict[str, Any]
) -> bool:
    """
    İmzayı doğrula

    Args:
        public_key_b64: Ed25519 public key (base64 encoded)
        signed_payload: Signed attestation payload

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Public key decode
        verify_key = VerifyKey(public_key_b64, encoder=Base64Encoder)

        # Extract signature
        signature_b64 = signed_payload.get("signature")
        if not signature_b64:
            return False

        signature = base64.b64decode(signature_b64)

        # Recreate canonical JSON (without signature)
        payload_copy = signed_payload.copy()
        del payload_copy["signature"]
        canonical_json = json.dumps(payload_copy, sort_keys=True, ensure_ascii=False)
        message = canonical_json.encode("utf-8")

        # Verify
        verify_key.verify(message, signature)
        return True

    except Exception as e:
        print(f"❌ Signature verification failed: {e}")
        return False


def verify_output(
    signed_payload: Dict[str, Any],
    output: str,
    public_key: Optional[str] = None
) -> bool:
    """
    Model output'u doğrula (high-level API)

    Args:
        signed_payload: Signed attestation payload
        output: Original model output text
        public_key: Optional public key (default: load from env)

    Returns:
        True if valid, False otherwise
    """
    # Public key yükle
    if not public_key:
        keys = load_keys_from_env()
        public_key = keys["public_key"]

    # 1. İmza doğrulama
    if not verify_signature(public_key, signed_payload):
        print("❌ Signature invalid")
        return False

    # 2. Output hash doğrulama
    output_hash = hashlib.sha256(output.encode("utf-8")).hexdigest()
    if output_hash != signed_payload.get("output_hash"):
        print("❌ Output hash mismatch (output modified)")
        return False

    print("✅ Attestation valid")
    return True


# ═══════════════════════════════════════════════════════════════
# 4. HELPER FUNCTIONs
# ═══════════════════════════════════════════════════════════════

def format_attestation(signed_payload: Dict[str, Any]) -> str:
    """
    Attestation'ı human-readable format'a çevir

    Args:
        signed_payload: Signed attestation payload

    Returns:
        Formatted string
    """
    lines = [
        "═══════════════════════════════════════════════════════════════",
        "🔏 AILYDIAN ATTESTATION",
        "═══════════════════════════════════════════════════════════════",
        f"Model ID:      {signed_payload.get('model_id', 'N/A')}",
        f"Timestamp:     {signed_payload.get('timestamp', 'N/A')}",
        f"Output Hash:   {signed_payload.get('output_hash', 'N/A')[:16]}...",
        f"Output Length: {signed_payload.get('output_length', 'N/A')} chars",
        f"Signature:     {signed_payload.get('signature', 'N/A')[:32]}...",
        f"Version:       {signed_payload.get('version', 'N/A')}",
    ]

    if "metadata" in signed_payload:
        lines.append(f"Metadata:      {signed_payload['metadata']}")

    lines.append("═══════════════════════════════════════════════════════════════")

    return "\n".join(lines)


def save_attestation(signed_payload: Dict[str, Any], path: str):
    """
    Attestation'ı JSON dosyasına kaydet

    Args:
        signed_payload: Signed attestation payload
        path: File path to save
    """
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(signed_payload, f, indent=2, ensure_ascii=False)

    print(f"✅ Attestation saved to: {path}")


def load_attestation(path: str) -> Dict[str, Any]:
    """
    Attestation'ı JSON dosyasından yükle

    Args:
        path: File path to load

    Returns:
        Signed attestation payload
    """
    with open(path, "r", encoding="utf-8") as f:
        signed_payload = json.load(f)

    print(f"✅ Attestation loaded from: {path}")
    return signed_payload


# ═══════════════════════════════════════════════════════════════
# 5. TEST / DEMO
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("═══════════════════════════════════════════════════════════════")
    print("🔥 AILYDIAN ATTESTATION - ED25519 SIGNATURE - DEMO")
    print("═══════════════════════════════════════════════════════════════\n")

    # 1. Anahtar çifti oluştur
    print("🔑 Step 1: Generate keypair")
    keys = generate_keypair()
    print(f"  Private Key: {keys['private_key'][:32]}...")
    print(f"  Public Key:  {keys['public_key'][:32]}...")
    print()

    # 2. Model output'u imzala
    print("🔏 Step 2: Sign model output")
    model_output = "Ailydian AI Ecosystem ile kendi parametrenizin sahibi olun!"

    signed = sign_output(
        model_id="ailydian-lora-v1.0",
        output=model_output,
        private_key=keys["private_key"],
        metadata={
            "org_id": "org_ailydian",
            "user_id": "user_123",
            "domain": "general"
        }
    )

    print(format_attestation(signed))
    print()

    # 3. İmzayı doğrula
    print("✅ Step 3: Verify signature")
    is_valid = verify_output(
        signed_payload=signed,
        output=model_output,
        public_key=keys["public_key"]
    )
    print(f"  Valid: {is_valid}")
    print()

    # 4. Manipülasyon testi
    print("🔍 Step 4: Test tampering detection")
    tampered_output = model_output + " (modified)"
    is_valid = verify_output(
        signed_payload=signed,
        output=tampered_output,
        public_key=keys["public_key"]
    )
    print(f"  Valid: {is_valid} (should be False)")
    print()

    # 5. Attestation'ı dosyaya kaydet
    print("💾 Step 5: Save attestation to file")
    save_attestation(signed, "/tmp/ailydian-attestation.json")

    # 6. Attestation'ı dosyadan yükle
    print("📂 Step 6: Load attestation from file")
    loaded = load_attestation("/tmp/ailydian-attestation.json")
    print(f"  Model ID: {loaded['model_id']}")
    print()

    # 7. Environment variable için anahtar yazdır
    print("📋 Step 7: Environment variable setup")
    print("\n# Add to .env file:")
    print(f"ATTESTATION_PRIVATE_KEY={keys['private_key']}")
    print(f"ATTESTATION_PUBLIC_KEY={keys['public_key']}")
    print()

    print("✅ Demo complete!")
