from .base import *  
from .apps import *  
from .database import *  
from .middleware import *  
from .rest_framework import *  
from .templates import *  
from .static import *  
from .internationalization import *  
from .chatbot import * 

try:
    from quant.utils.yfinance_network import apply_yfinance_network_tuning

    apply_yfinance_network_tuning()
except ImportError:
    pass
