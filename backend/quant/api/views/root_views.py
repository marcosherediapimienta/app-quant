from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_root(request):
    return Response({
        "message": "Quant API v1",
        "endpoints": {
            "health": "/api/v1/health/",
            "chat": {
                "send": "/api/v1/chat/send/",
                "welcome": "/api/v1/chat/welcome/",
                "clear": "/api/v1/chat/clear/",
                "history": "/api/v1/chat/history/",
            },
            "macro": {
                "factors": "/api/v1/macro/factors/",
                "correlation": "/api/v1/macro/correlation/",
                "correlation_matrix": "/api/v1/macro/correlation-matrix/",
                "situation": "/api/v1/macro/situation/",
            },
            "portfolio": {
                "analyze": "/api/v1/portfolio/analyze/",
            },
            "risk": {
                "ratios": "/api/v1/risk/ratios/",
                "var_es": "/api/v1/risk/var-es/",
                "drawdown": "/api/v1/risk/drawdown/",
                "benchmark": "/api/v1/risk/benchmark/",
                "distribution": "/api/v1/risk/distribution/",
                "correlation": "/api/v1/risk/correlation/",
            },
            "capm": {
                "analyze": "/api/v1/capm/analyze/",
                "multi_asset": "/api/v1/capm/multi-asset/",
                "optimize": "/api/v1/capm/optimize/",
                "expected_return": "/api/v1/capm/expected-return/",
            },
            "valuation": {
                "company": "/api/v1/valuation/company/",
                "compare": "/api/v1/valuation/compare/",
                "sector": "/api/v1/valuation/sector/",
                "signals": "/api/v1/valuation/signals/",
            },
        },
    })

@api_view(['GET'])
def api_health(request):
    return Response({"status": "healthy", "service": "quant-api"})
