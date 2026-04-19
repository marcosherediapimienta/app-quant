from django.apps import AppConfig


class QuantConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'quant'

    def ready(self) -> None:
        from quant.utils import yfinance_network

        yfinance_network.apply_yfinance_network_tuning()
