#!/usr/bin/env python3
"""
AILYDIAN RLAIF - PREFERENCE DATA GENERATOR
===========================================
AI'dan AI feedback ile preference pairs oluşturur (DPO training için).

RLAIF Nedir?
- Reinforcement Learning from AI Feedback
- Güçlü bir AI (Claude), kendi modelimizin çıktılarını değerlendiriyor
- Her prompt için 2 cevap: "chosen" (iyi) vs "rejected" (kötü)
- Bu preference data ile DPO training yapıyoruz

Kullanım:
    python apps/rlaif/generate_preferences.py \
        --prompts data/prompts.jsonl \
        --output data/preferences.jsonl \
        --num_responses 2
"""

import os
import json
import time
import argparse
from typing import List, Dict, Any
from dataclasses import dataclass
import anthropic


# ═══════════════════════════════════════════════════════════════
# 1. VERİ MODELLERİ
# ═══════════════════════════════════════════════════════════════

@dataclass
class PreferencePair:
    """DPO training için preference pair"""
    prompt: str
    chosen: str
    rejected: str
    chosen_score: float = 0.0
    rejected_score: float = 0.0
    metadata: Dict[str, Any] = None


# ═══════════════════════════════════════════════════════════════
# 2. AI FEEDBACK (Claude API)
# ═══════════════════════════════════════════════════════════════

class RLAIFGenerator:
    """RLAIF preference pair generator"""

    def __init__(self, api_key: str = None):
        """
        Initialize RLAIF generator

        Args:
            api_key: Anthropic API key (default: from env)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self.client = anthropic.Anthropic(api_key=self.api_key)

    def generate_response(self, prompt: str, temperature: float = 0.7) -> str:
        """
        Generate a response from Claude

        Args:
            prompt: User prompt
            temperature: Sampling temperature

        Returns:
            Generated response text
        """
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return message.content[0].text
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            return ""

    def score_response(self, prompt: str, response: str) -> float:
        """
        AI feedback: Score a response (0-10 scale)

        Criteria:
        - Relevance to prompt
        - Helpfulness
        - Accuracy
        - Safety (no harmful content)
        - Clarity

        Args:
            prompt: Original prompt
            response: Generated response

        Returns:
            Score from 0.0 to 10.0
        """
        scoring_prompt = f"""You are an expert evaluator. Score the following AI response on a scale of 0-10.

Criteria:
- Relevance: Does it answer the question?
- Helpfulness: Is it useful to the user?
- Accuracy: Is the information correct?
- Safety: No harmful/toxic content?
- Clarity: Is it clear and well-written?

ORIGINAL PROMPT:
{prompt}

RESPONSE TO EVALUATE:
{response}

Return ONLY a number from 0.0 to 10.0 (e.g., "7.5"). No explanation."""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=10,
                temperature=0.0,  # Deterministic scoring
                messages=[
                    {"role": "user", "content": scoring_prompt}
                ]
            )
            score_text = message.content[0].text.strip()
            score = float(score_text)
            return min(10.0, max(0.0, score))  # Clamp to [0, 10]
        except Exception as e:
            print(f"⚠️  Error scoring response: {e}")
            return 5.0  # Default mid-score on error

    def generate_preference_pair(
        self,
        prompt: str,
        num_responses: int = 4
    ) -> PreferencePair:
        """
        Generate a preference pair for DPO training

        Process:
        1. Generate N responses with different temperatures
        2. Score each response with AI feedback
        3. Pick best (chosen) and worst (rejected)

        Args:
            prompt: User prompt
            num_responses: Number of candidate responses

        Returns:
            PreferencePair object
        """
        print(f"\n🔄 Generating preference pair for: {prompt[:50]}...")

        # 1. Generate multiple responses
        responses = []
        temperatures = [0.3, 0.5, 0.7, 0.9][:num_responses]

        for i, temp in enumerate(temperatures):
            print(f"  • Generating response {i+1}/{num_responses} (temp={temp})...")
            response = self.generate_response(prompt, temperature=temp)
            if response:
                responses.append({"text": response, "temperature": temp})
            time.sleep(0.5)  # Rate limiting

        if len(responses) < 2:
            raise ValueError(f"Need at least 2 responses, got {len(responses)}")

        # 2. Score each response
        scored_responses = []
        for i, resp in enumerate(responses):
            print(f"  • Scoring response {i+1}/{len(responses)}...")
            score = self.score_response(prompt, resp["text"])
            scored_responses.append({
                "text": resp["text"],
                "temperature": resp["temperature"],
                "score": score
            })
            time.sleep(0.5)  # Rate limiting

        # 3. Pick best and worst
        scored_responses.sort(key=lambda x: x["score"], reverse=True)

        best = scored_responses[0]
        worst = scored_responses[-1]

        print(f"  ✅ Chosen score: {best['score']:.1f}, Rejected score: {worst['score']:.1f}")

        return PreferencePair(
            prompt=prompt,
            chosen=best["text"],
            rejected=worst["text"],
            chosen_score=best["score"],
            rejected_score=worst["score"],
            metadata={
                "chosen_temp": best["temperature"],
                "rejected_temp": worst["temperature"],
                "num_candidates": len(responses)
            }
        )


# ═══════════════════════════════════════════════════════════════
# 3. BATCH PROCESSING
# ═══════════════════════════════════════════════════════════════

def load_prompts(file_path: str) -> List[str]:
    """
    Load prompts from JSONL file

    Format: {"prompt": "..."}

    Args:
        file_path: Path to JSONL file

    Returns:
        List of prompts
    """
    prompts = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                prompts.append(data["prompt"])
    return prompts


def save_preferences(pairs: List[PreferencePair], output_path: str):
    """
    Save preference pairs to JSONL file

    Args:
        pairs: List of PreferencePair objects
        output_path: Output file path
    """
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        for pair in pairs:
            record = {
                "prompt": pair.prompt,
                "chosen": pair.chosen,
                "rejected": pair.rejected,
                "chosen_score": pair.chosen_score,
                "rejected_score": pair.rejected_score,
                "metadata": pair.metadata
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"\n✅ Saved {len(pairs)} preference pairs to: {output_path}")


def generate_batch(
    prompts: List[str],
    output_path: str,
    num_responses: int = 4
):
    """
    Generate preference pairs for a batch of prompts

    Args:
        prompts: List of prompts
        output_path: Output file path
        num_responses: Number of candidate responses per prompt
    """
    generator = RLAIFGenerator()
    pairs = []

    for i, prompt in enumerate(prompts):
        print(f"\n{'='*60}")
        print(f"Progress: {i+1}/{len(prompts)}")
        print(f"{'='*60}")

        try:
            pair = generator.generate_preference_pair(prompt, num_responses=num_responses)
            pairs.append(pair)

            # Checkpoint every 10 prompts
            if (i + 1) % 10 == 0:
                save_preferences(pairs, output_path + ".tmp")
                print(f"\n💾 Checkpoint saved ({len(pairs)} pairs)")

        except Exception as e:
            print(f"❌ Error processing prompt: {e}")
            continue

    # Final save
    save_preferences(pairs, output_path)


# ═══════════════════════════════════════════════════════════════
# 4. DEMO PROMPTS
# ═══════════════════════════════════════════════════════════════

DEMO_PROMPTS = [
    "Ailydian AI Ecosystem nedir?",
    "PyTorch ile model nasıl eğitilir?",
    "Türkçe doğal dil işleme için en iyi yaklaşımlar nelerdir?",
    "COVID-19 aşısının yan etkileri nelerdir?",
    "Anayasa Mahkemesi'ne bireysel başvuru süreci nasıl işler?",
]


def create_demo_prompts(output_path: str = "data/demo_prompts.jsonl"):
    """
    Create demo prompts file

    Args:
        output_path: Output file path
    """
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        for prompt in DEMO_PROMPTS:
            f.write(json.dumps({"prompt": prompt}, ensure_ascii=False) + "\n")

    print(f"✅ Created demo prompts: {output_path}")


# ═══════════════════════════════════════════════════════════════
# 5. CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="AILYDIAN RLAIF Preference Data Generator")

    parser.add_argument(
        "--prompts",
        type=str,
        default="data/demo_prompts.jsonl",
        help="Path to prompts JSONL file"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/preferences.jsonl",
        help="Output path for preference pairs"
    )
    parser.add_argument(
        "--num-responses",
        type=int,
        default=4,
        help="Number of candidate responses per prompt"
    )
    parser.add_argument(
        "--create-demo",
        action="store_true",
        help="Create demo prompts file"
    )

    args = parser.parse_args()

    print("═══════════════════════════════════════════════════════════════")
    print("🔥 AILYDIAN RLAIF - PREFERENCE DATA GENERATOR")
    print("═══════════════════════════════════════════════════════════════\n")

    # Create demo prompts if requested
    if args.create_demo:
        create_demo_prompts(args.prompts)
        return

    # Load prompts
    print(f"📂 Loading prompts from: {args.prompts}")
    prompts = load_prompts(args.prompts)
    print(f"✅ Loaded {len(prompts)} prompts\n")

    # Generate preferences
    generate_batch(
        prompts=prompts,
        output_path=args.output,
        num_responses=args.num_responses
    )

    print("\n✅ RLAIF generation complete!")
    print(f"📄 Output: {args.output}")


if __name__ == "__main__":
    main()
