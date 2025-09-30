"""
Nirvana TF Bot v2 - Vercel Serverless Entry Point
Lightweight API without TensorFlow (uses mock predictions)
"""

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.serving.app import app

# Vercel serverless handler
handler = app