#!/usr/bin/env python3
"""
AILYDIAN DPO TRAINING
=====================
Direct Preference Optimization with TRL + PEFT

DPO Nedir?
- Preference-based training: Model "chosen" cevapları öğreniyor
- RLHF'nin basitleştirilmiş versiyonu (reward model gerektirmez)
- RLAIF preference data ile çalışır

Kullanım:
    python apps/trainer/dpo_train.py \
        --base_model mistralai/Mistral-7B-Instruct-v0.3 \
        --dataset data/preferences.jsonl \
        --output_dir data/artifacts/adapters/ailydian-dpo
"""

import os
import torch
from dataclasses import dataclass, field
from typing import Optional
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import DPOTrainer
import mlflow


@dataclass
class DPOConfig:
    """DPO Training configuration"""

    # Model
    base_model: str = "mistralai/Mistral-7B-Instruct-v0.3"

    # Data
    dataset_path: str = "data/preferences.jsonl"
    max_length: int = 2048

    # LoRA
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05

    # Training
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 5e-5
    max_grad_norm: float = 1.0
    warmup_steps: int = 100

    # DPO-specific
    beta: float = 0.1  # DPO temperature

    # Quantization
    use_4bit: bool = True
    bnb_4bit_compute_dtype: str = "float16"

    # Output
    output_dir: str = "data/artifacts/adapters/ailydian-dpo"
    logging_steps: int = 10
    save_steps: int = 100

    # MLflow
    mlflow_tracking_uri: str = "./data/mlruns"
    experiment_name: str = "ailydian-dpo"


def load_preference_dataset(dataset_path: str):
    """Load RLAIF preference dataset"""
    dataset = load_dataset("json", data_files=dataset_path, split="train")

    # Format: {prompt, chosen, rejected}
    def format_example(example):
        return {
            "prompt": example["prompt"],
            "chosen": example["chosen"],
            "rejected": example["rejected"]
        }

    dataset = dataset.map(format_example)
    return dataset


def setup_model_and_tokenizer(config: DPOConfig):
    """Setup base model + tokenizer with 4-bit quantization"""

    # 4-bit quantization config
    if config.use_4bit:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=getattr(torch, config.bnb_4bit_compute_dtype),
            bnb_4bit_use_double_quant=True,
        )
    else:
        bnb_config = None

    # Load base model
    model = AutoModelForCausalLM.from_pretrained(
        config.base_model,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.float16,
    )

    # Prepare for k-bit training
    model = prepare_model_for_kbit_training(model)

    # LoRA config
    peft_config = LoraConfig(
        r=config.lora_r,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
    )

    # Apply LoRA
    model = get_peft_model(model, peft_config)

    # Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config.base_model)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    return model, tokenizer, peft_config


def train_dpo(config: DPOConfig):
    """Main DPO training function"""

    print("="*60)
    print("🔥 AILYDIAN DPO TRAINING")
    print("="*60)
    print(f"Base Model:  {config.base_model}")
    print(f"Dataset:     {config.dataset_path}")
    print(f"Output Dir:  {config.output_dir}")
    print(f"LoRA r={config.lora_r}, alpha={config.lora_alpha}")
    print(f"DPO Beta:    {config.beta}")
    print("="*60)
    print()

    # MLflow setup
    mlflow.set_tracking_uri(config.mlflow_tracking_uri)
    mlflow.set_experiment(config.experiment_name)

    with mlflow.start_run():
        # Log config
        mlflow.log_params({
            "base_model": config.base_model,
            "lora_r": config.lora_r,
            "lora_alpha": config.lora_alpha,
            "dpo_beta": config.beta,
            "learning_rate": config.learning_rate,
            "epochs": config.num_train_epochs,
        })

        # Load dataset
        print("📂 Loading preference dataset...")
        dataset = load_preference_dataset(config.dataset_path)
        print(f"✅ Loaded {len(dataset)} preference pairs\n")

        # Setup model
        print("🤖 Loading model and tokenizer...")
        model, tokenizer, peft_config = setup_model_and_tokenizer(config)

        # Print trainable parameters
        trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
        total_params = sum(p.numel() for p in model.parameters())
        print(f"✅ Model loaded")
        print(f"   Trainable params: {trainable_params:,}")
        print(f"   Total params:     {total_params:,}")
        print(f"   Trainable %:      {100 * trainable_params / total_params:.2f}%\n")

        mlflow.log_metric("trainable_params", trainable_params)
        mlflow.log_metric("total_params", total_params)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=config.output_dir,
            num_train_epochs=config.num_train_epochs,
            per_device_train_batch_size=config.per_device_train_batch_size,
            gradient_accumulation_steps=config.gradient_accumulation_steps,
            learning_rate=config.learning_rate,
            max_grad_norm=config.max_grad_norm,
            warmup_steps=config.warmup_steps,
            logging_steps=config.logging_steps,
            save_steps=config.save_steps,
            bf16=True,  # Use bfloat16
            gradient_checkpointing=True,
            remove_unused_columns=False,
        )

        # DPO Trainer
        print("🎯 Initializing DPO Trainer...")
        dpo_trainer = DPOTrainer(
            model=model,
            ref_model=None,  # Implicit reference model
            args=training_args,
            beta=config.beta,
            train_dataset=dataset,
            tokenizer=tokenizer,
            max_length=config.max_length,
            max_prompt_length=config.max_length // 2,
        )

        print("✅ DPO Trainer initialized\n")

        # Train
        print("🚀 Starting DPO training...\n")
        train_result = dpo_trainer.train()

        # Log metrics
        mlflow.log_metrics({
            "final_loss": train_result.training_loss,
        })

        # Save model
        print("\n💾 Saving model...")
        dpo_trainer.save_model(config.output_dir)
        tokenizer.save_pretrained(config.output_dir)
        print(f"✅ Model saved to: {config.output_dir}")

        # Log artifacts
        mlflow.log_artifacts(config.output_dir, artifact_path="model")

        print("\n✅ DPO Training complete!")
        print(f"📊 MLflow tracking: {config.mlflow_tracking_uri}")
        print(f"📁 Model artifacts: {config.output_dir}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AILYDIAN DPO Training")
    parser.add_argument("--base_model", type=str, default="mistralai/Mistral-7B-Instruct-v0.3")
    parser.add_argument("--dataset", type=str, default="data/preferences.jsonl")
    parser.add_argument("--output_dir", type=str, default="data/artifacts/adapters/ailydian-dpo")
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--beta", type=float, default=0.1)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--learning_rate", type=float, default=5e-5)

    args = parser.parse_args()

    config = DPOConfig(
        base_model=args.base_model,
        dataset_path=args.dataset,
        output_dir=args.output_dir,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        beta=args.beta,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )

    train_dpo(config)
