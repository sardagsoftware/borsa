#!/bin/bash

###############################################################################
# 🚀 AILYDIAN vLLM LAUNCH SCRIPT - OPTIMIZED
# Speculative Decoding + KV-Cache Optimization + Multi-LoRA
###############################################################################

set -e
set -u

# ═══════════════════════════════════════════════════════════════
# 1. CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Base model (örnek: Mistral-7B)
BASE_MODEL="${BASE_MODEL:-mistralai/Mistral-7B-Instruct-v0.3}"

# Draft model (speculative decoding için küçük model)
DRAFT_MODEL="${DRAFT_MODEL:-TinyLlama/TinyLlama-1.1B-Chat-v1.0}"

# Server config
VLLM_PORT="${VLLM_PORT:-8000}"
VLLM_HOST="${VLLM_HOST:-0.0.0.0}"

# GPU/Memory config
GPU_MEMORY_UTILIZATION="${GPU_MEMORY_UTILIZATION:-0.9}"  # %90 GPU kullanımı
MAX_MODEL_LEN="${MAX_MODEL_LEN:-4096}"  # Max sequence length

# LoRA config
ENABLE_LORA="${ENABLE_LORA:-true}"
MAX_LORAS="${MAX_LORAS:-5}"  # Aynı anda 5 tenant
LORA_BASE_DIR="${LORA_BASE_DIR:-./data/artifacts/adapters}"

# Performance optimizations
ENABLE_SPECULATIVE_DECODING="${ENABLE_SPECULATIVE_DECODING:-true}"
KV_CACHE_DTYPE="${KV_CACHE_DTYPE:-fp8}"  # FP8 quantization (%50 memory save)
DTYPE="${DTYPE:-auto}"  # Model precision (auto/fp16/bf16)

# Parallelism
TENSOR_PARALLEL_SIZE="${TENSOR_PARALLEL_SIZE:-1}"  # Multi-GPU tensor parallelism
PIPELINE_PARALLEL_SIZE="${PIPELINE_PARALLEL_SIZE:-1}"  # Pipeline parallelism

# ═══════════════════════════════════════════════════════════════
# 2. PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "🔥 AILYDIAN vLLM SERVER - OPTIMIZED LAUNCH"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if vLLM is installed
if ! python -c "import vllm" 2>/dev/null; then
    echo "❌ vLLM not installed!"
    echo "Install: pip install vllm>=0.6.0"
    exit 1
fi

# Check CUDA
if ! python -c "import torch; assert torch.cuda.is_available()" 2>/dev/null; then
    echo "⚠️  WARNING: CUDA not available. Running on CPU (SLOW!)"
fi

echo "✅ Pre-flight checks passed"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. BUILD COMMAND
# ═══════════════════════════════════════════════════════════════

CMD="python -m vllm.entrypoints.openai.api_server"

# Base model
CMD="$CMD --model $BASE_MODEL"

# Server config
CMD="$CMD --host $VLLM_HOST"
CMD="$CMD --port $VLLM_PORT"

# Memory/GPU
CMD="$CMD --gpu-memory-utilization $GPU_MEMORY_UTILIZATION"
CMD="$CMD --max-model-len $MAX_MODEL_LEN"
CMD="$CMD --dtype $DTYPE"

# KV-Cache optimization (FP8 quantization)
if [ "$KV_CACHE_DTYPE" = "fp8" ]; then
    CMD="$CMD --kv-cache-dtype fp8"
    echo "✅ KV-Cache FP8 quantization enabled (50% memory save)"
fi

# Speculative decoding (2-3x speedup)
if [ "$ENABLE_SPECULATIVE_DECODING" = "true" ]; then
    CMD="$CMD --speculative-model $DRAFT_MODEL"
    CMD="$CMD --num-speculative-tokens 5"
    CMD="$CMD --use-v2-block-manager"
    echo "✅ Speculative decoding enabled (draft: $DRAFT_MODEL)"
fi

# LoRA support
if [ "$ENABLE_LORA" = "true" ]; then
    CMD="$CMD --enable-lora"
    CMD="$CMD --max-loras $MAX_LORAS"
    CMD="$CMD --max-lora-rank 64"

    # LoRA modules (example: auto-discover from tenant config)
    # Format: --lora-modules tenant_name=path
    if [ -d "$LORA_BASE_DIR" ]; then
        # Ailydian HQ
        if [ -d "$LORA_BASE_DIR/ailydian-lora" ]; then
            CMD="$CMD --lora-modules ailydian=$LORA_BASE_DIR/ailydian-lora"
            echo "  • LoRA: ailydian → $LORA_BASE_DIR/ailydian-lora"
        fi

        # Medical AI
        if [ -d "$LORA_BASE_DIR/medical-lora" ]; then
            CMD="$CMD --lora-modules medical=$LORA_BASE_DIR/medical-lora"
            echo "  • LoRA: medical → $LORA_BASE_DIR/medical-lora"
        fi

        # Legal AI
        if [ -d "$LORA_BASE_DIR/legal-lora" ]; then
            CMD="$CMD --lora-modules legal=$LORA_BASE_DIR/legal-lora"
            echo "  • LoRA: legal → $LORA_BASE_DIR/legal-lora"
        fi
    fi

    echo "✅ Multi-LoRA enabled (max: $MAX_LORAS concurrent)"
fi

# Parallelism (multi-GPU)
if [ "$TENSOR_PARALLEL_SIZE" -gt 1 ]; then
    CMD="$CMD --tensor-parallel-size $TENSOR_PARALLEL_SIZE"
    echo "✅ Tensor parallelism: $TENSOR_PARALLEL_SIZE GPUs"
fi

if [ "$PIPELINE_PARALLEL_SIZE" -gt 1 ]; then
    CMD="$CMD --pipeline-parallel-size $PIPELINE_PARALLEL_SIZE"
    echo "✅ Pipeline parallelism: $PIPELINE_PARALLEL_SIZE stages"
fi

# Additional optimizations
CMD="$CMD --disable-log-requests"  # Reduce logging overhead
CMD="$CMD --max-num-batched-tokens 8192"  # Batch size optimization
CMD="$CMD --max-num-seqs 256"  # Max concurrent sequences

# ═══════════════════════════════════════════════════════════════
# 4. LAUNCH SERVER
# ═══════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 STARTING vLLM SERVER"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  Base Model:           $BASE_MODEL"
echo "  Draft Model:          $DRAFT_MODEL (speculative)"
echo "  Server:               http://$VLLM_HOST:$VLLM_PORT"
echo "  GPU Memory:           ${GPU_MEMORY_UTILIZATION}0%"
echo "  Max Sequence Length:  $MAX_MODEL_LEN"
echo "  KV-Cache:             $KV_CACHE_DTYPE"
echo "  Max LoRAs:            $MAX_LORAS"
echo ""
echo "Optimizations:"
echo "  ✅ Speculative Decoding (2-3x speedup)"
echo "  ✅ KV-Cache FP8 (50% memory save)"
echo "  ✅ Multi-LoRA (5 tenants concurrent)"
echo "  ✅ PagedAttention (efficient KV-cache)"
echo ""
echo "Command:"
echo "  $CMD"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Execute
exec $CMD

# ═══════════════════════════════════════════════════════════════
# 5. USAGE NOTES
# ═══════════════════════════════════════════════════════════════

# Curl example (after server starts):
#
# curl http://localhost:8000/v1/completions \
#   -H "Content-Type: application/json" \
#   -d '{
#     "model": "ailydian",
#     "prompt": "Ailydian nedir?",
#     "max_tokens": 100,
#     "temperature": 0.7
#   }'
#
# Multi-LoRA request:
#
# curl http://localhost:8000/v1/completions \
#   -H "Content-Type: application/json" \
#   -d '{
#     "model": "medical",
#     "prompt": "COVID-19 belirtileri nelerdir?",
#     "max_tokens": 200
#   }'
