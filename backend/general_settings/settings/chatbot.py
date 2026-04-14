import os
from pathlib import Path

from .base import BASE_DIR

GROQ_API_KEY = os.getenv('GROQ_API_KEY')

_default_domain = str(BASE_DIR / 'quant' / 'domain')
QUANT_DOMAIN_PATH = os.getenv('QUANT_DOMAIN_PATH', _default_domain)
