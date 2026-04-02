import threading
from typing import TypeVar, Callable

from apps.core import (
    DataService,
    MacroService,
    PortfolioService,
    RiskService,
    CAPMService,
    ValuationService,
)

T = TypeVar('T')

_lock = threading.Lock()
_instances: dict = {}


def _get_service(key: str, factory: Callable[[], T]) -> T:

    if key not in _instances:
        with _lock:
            if key not in _instances:
                _instances[key] = factory()
    return _instances[key]


def get_data_service() -> DataService:
    return _get_service('data', DataService)


def get_macro_service() -> MacroService:
    return _get_service('macro', MacroService)


def get_portfolio_service() -> PortfolioService:
    return _get_service('portfolio', PortfolioService)


def get_risk_service() -> RiskService:
    return _get_service('risk', RiskService)


def get_capm_service() -> CAPMService:
    return _get_service('capm', CAPMService)


def get_valuation_service() -> ValuationService:
    return _get_service('valuation', ValuationService)


def get_chat_service():
    def _create():
        from apps.core import ChatService
        return ChatService()
    return _get_service('chat', _create)
