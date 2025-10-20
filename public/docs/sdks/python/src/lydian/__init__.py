"""
Lydian AI Platform Python SDK

Official Python SDK for interacting with Lydian AI APIs including
Smart Cities, İnsan IQ, and LyDian IQ.
"""

from .client import Lydian, LydianError
from .smart_cities import SmartCitiesClient
from .insan_iq import InsanIQClient
from .lydian_iq import LydianIQClient

__version__ = "1.0.0"
__all__ = [
    "Lydian",
    "LydianError",
    "SmartCitiesClient",
    "InsanIQClient",
    "LydianIQClient",
]
