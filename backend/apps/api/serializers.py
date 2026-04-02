import math
from dataclasses import asdict, is_dataclass
from datetime import datetime

import numpy as np
import pandas as pd

class QuantResponseSerializer:
    @staticmethod
    def _date_key(key):
        if isinstance(key, (pd.Timestamp, datetime)):

            return key.strftime('%Y-%m-%d')

        if not isinstance(key, (str, int, float, bool, type(None))):
            return str(key)

        return key

    @classmethod
    def clean_response(cls, data):
        if data is None or isinstance(data, (str, int, bool)):
            return data

        if isinstance(data, (float, np.floating, np.integer)):
            val = float(data)
            return None if math.isnan(val) or math.isinf(val) else val

        if isinstance(data, pd.Timestamp):
            return data.strftime('%Y-%m-%d')

        if is_dataclass(data) and not isinstance(data, type):
            data = asdict(data)

        if isinstance(data, dict):
            return {cls._date_key(k): cls.clean_response(v) for k, v in data.items()}

        if isinstance(data, (list, tuple)):
            return [cls.clean_response(item) for item in data]

        if isinstance(data, pd.DataFrame):
            if data.shape[0] == data.shape[1] and data.index.equals(data.columns):
                return data.to_dict()
            return data.to_dict('records') if not data.empty else []

        if isinstance(data, pd.Series):
            return {cls._date_key(idx): cls.clean_response(val) for idx, val in data.items()}

        if isinstance(data, np.ndarray):
            return data.tolist()

        if hasattr(data, 'to_dict'):
            return data.to_dict()

        if hasattr(data, 'tolist'):
            return data.tolist()

        if hasattr(data, '__dict__'):
            try:
                return cls.clean_response(data.__dict__)
            except Exception:
                pass

        return str(data)
