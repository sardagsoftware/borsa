#!/usr/bin/env python3
"""
🧪 BlueQubit Connection Test
============================
LyDian OS - Quantum Computing POC
Tarih: 24 Ekim 2025

Bu script BlueQubit API bağlantısını test eder.
Kullanım: python test_bluequbit_connection.py
"""

import sys
import os
from datetime import datetime

def test_imports():
    """Step 1: Test Python paketi importları"""
    print("🔍 Step 1: Testing imports...")

    try:
        import bluequbit
        print("   ✅ bluequbit imported successfully")
        print(f"   📦 Version: {bluequbit.__version__ if hasattr(bluequbit, '__version__') else 'unknown'}")
    except ImportError as e:
        print(f"   ❌ Failed to import bluequbit: {e}")
        return False

    try:
        import qiskit
        print(f"   ✅ qiskit imported successfully (v{qiskit.__version__})")
    except ImportError as e:
        print(f"   ⚠️  qiskit not available: {e}")

    try:
        import numpy as np
        print(f"   ✅ numpy imported successfully (v{np.__version__})")
    except ImportError as e:
        print(f"   ❌ Failed to import numpy: {e}")
        return False

    return True


def test_api_key():
    """Step 2: Test API anahtarı varlığı"""
    print("\n🔑 Step 2: Checking API key...")

    api_key = os.getenv('BLUEQUBIT_API_KEY')

    if not api_key:
        print("   ⚠️  BLUEQUBIT_API_KEY environment variable not set")
        print("\n   📝 To set it:")
        print("      export BLUEQUBIT_API_KEY='your-api-key-here'")
        print("\n   💡 Hesap oluşturmak için:")
        print("      1. https://app.bluequbit.io sayfasına git")
        print("      2. Sign Up ile hesap aç (GitHub veya email)")
        print("      3. API Keys bölümünden key oluştur")
        return False

    # API key formatını kontrol et (hassas bilgi gösterme)
    masked_key = api_key[:8] + '*' * (len(api_key) - 12) + api_key[-4:]
    print(f"   ✅ API key found: {masked_key}")
    print(f"   📏 Length: {len(api_key)} characters")

    return True


def test_basic_circuit():
    """Step 3: Basit kuantum devresi oluştur"""
    print("\n⚛️  Step 3: Creating basic quantum circuit...")

    try:
        from qiskit import QuantumCircuit

        # 2-qubit Bell state (kuantum dolanıklık örneği)
        qc = QuantumCircuit(2, 2)
        qc.h(0)  # Hadamard gate (superposition)
        qc.cx(0, 1)  # CNOT gate (entanglement)
        qc.measure([0, 1], [0, 1])

        print("   ✅ Bell state circuit created")
        print(f"   📊 Qubits: {qc.num_qubits}, Classical bits: {qc.num_clbits}")
        print(f"   🔧 Gates: {len(qc.data)}")

        # Circuit'i ASCII olarak göster
        print("\n   Circuit diagram:")
        circuit_str = str(qc.draw(output='text', initial_state=True))
        for line in circuit_str.split('\n'):
            print(f"      {line}")

        return qc

    except Exception as e:
        print(f"   ❌ Failed to create circuit: {e}")
        return None


def test_bluequbit_submission(circuit):
    """Step 4: BlueQubit'e job gönder (sadece API key varsa)"""
    print("\n🚀 Step 4: Testing BlueQubit submission...")

    api_key = os.getenv('BLUEQUBIT_API_KEY')
    if not api_key:
        print("   ⏭️  Skipping (API key not available)")
        return False

    try:
        import bluequbit as bq

        print("   🔌 Connecting to BlueQubit...")
        client = bq.init(api_key)

        print("   📤 Submitting job to FREE TIER (CPU)...")
        job = client.run(
            circuit,
            device='cpu',  # Free tier
            shots=1024,
            asynchronous=False  # Wait for result
        )

        print(f"   ✅ Job submitted successfully!")
        print(f"   🆔 Job ID: {job.job_id}")
        print(f"   💻 Device: {job.device}")
        print(f"   📊 Status: {job.status}")

        if hasattr(job, 'result'):
            result = job.result()
            print(f"\n   📈 Results (top 3 measurements):")
            if hasattr(result, 'get_counts'):
                counts = result.get_counts()
                sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
                for state, count in sorted_counts[:3]:
                    probability = count / 1024 * 100
                    print(f"      |{state}⟩: {count} counts ({probability:.1f}%)")

        return True

    except ImportError as e:
        print(f"   ❌ BlueQubit not installed: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Submission failed: {e}")
        print(f"   💡 Tip: Check if API key is valid")
        return False


def main():
    """Ana test fonksiyonu"""
    print("=" * 60)
    print("🧪 BLUEQUBIT CONNECTION TEST")
    print("=" * 60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print("=" * 60)

    # Test 1: Imports
    if not test_imports():
        print("\n❌ Import test failed. Install dependencies:")
        print("   source venv/bin/activate")
        print("   pip install bluequbit qiskit numpy scipy")
        return 1

    # Test 2: API Key
    has_api_key = test_api_key()

    # Test 3: Circuit Creation
    circuit = test_basic_circuit()
    if circuit is None:
        print("\n❌ Circuit creation failed")
        return 1

    # Test 4: BlueQubit Submission (only if API key exists)
    if has_api_key:
        success = test_bluequbit_submission(circuit)
        if success:
            print("\n" + "=" * 60)
            print("🎉 ALL TESTS PASSED!")
            print("=" * 60)
            print("\n✅ LyDian OS artık kuantum computing kullanabilir!")
            print("📌 Sonraki adım: Medical Expert entegrasyonu")
            return 0
        else:
            print("\n" + "=" * 60)
            print("⚠️  PARTIAL SUCCESS")
            print("=" * 60)
            print("\n✅ Imports ve circuit oluşturma çalışıyor")
            print("❌ BlueQubit API bağlantısı kurulamadı")
            print("💡 API key'i kontrol et veya hesap oluştur")
            return 1
    else:
        print("\n" + "=" * 60)
        print("📋 SETUP REQUIRED")
        print("=" * 60)
        print("\n✅ Python paketi hazır")
        print("⏳ API key bekleniyor")
        print("\n🎯 Sonraki adım:")
        print("   1. https://app.bluequbit.io'da hesap oluştur")
        print("   2. API key al")
        print("   3. export BLUEQUBIT_API_KEY='your-key'")
        print("   4. Bu scripti tekrar çalıştır")
        return 0


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
