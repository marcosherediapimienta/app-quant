import threading
from typing import TypeVar, Callable

from quant.application.use_cases import (
    DataUseCase,
    MacroUseCase,
    PortfolioUseCase,
    RiskUseCase,
    CAPMUseCase,
    ValuationUseCase,
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


def get_data_service() -> DataUseCase:
    return _get_service('data', DataUseCase)


def get_macro_service() -> MacroUseCase:
    return _get_service('macro', MacroUseCase)


def get_portfolio_service() -> PortfolioUseCase:
    return _get_service('portfolio', PortfolioUseCase)


def get_risk_service() -> RiskUseCase:
    return _get_service('risk', RiskUseCase)


def get_capm_service() -> CAPMUseCase:
    return _get_service('capm', CAPMUseCase)


def get_valuation_service() -> ValuationUseCase:
    return _get_service('valuation', ValuationUseCase)


def get_chat_service():
    def _create():
        from quant.application.use_cases import ChatUseCase
        return ChatUseCase()
    return _get_service('chat', _create)
