"""Utility functions for Lydian SDK"""

import hmac
import hashlib
import secrets
from typing import Optional


def create_hmac_signature(payload: str, secret: str, algorithm: str = "sha256") -> str:
    """Generate HMAC signature for webhook validation"""
    return hmac.new(
        secret.encode("utf-8"), payload.encode("utf-8"), getattr(hashlib, algorithm)
    ).hexdigest()


def verify_hmac_signature(
    payload: str, signature: str, secret: str, algorithm: str = "sha256"
) -> bool:
    """Verify HMAC signature"""
    expected_signature = create_hmac_signature(payload, secret, algorithm)
    return hmac.compare_digest(signature, expected_signature)


def generate_idempotency_key() -> str:
    """Generate idempotency key"""
    return secrets.token_hex(16)


def sha256(input_string: str) -> str:
    """Hash string with SHA256"""
    return hashlib.sha256(input_string.encode("utf-8")).hexdigest()
