import importlib

class QuantService:
    @staticmethod
    def get_module(module_path: str):
        try:
            module = importlib.import_module(module_path)
            return module
        except ImportError as e:
            raise ImportError(f"Could not import {module_path}: {e}")
    
    @staticmethod
    def get_class(module_path: str, class_name: str):
        module = QuantService.get_module(module_path)
        if not hasattr(module, class_name):
            raise AttributeError(f"Class '{class_name}' not found in {module_path}")
        return getattr(module, class_name)