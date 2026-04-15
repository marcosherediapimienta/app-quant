from __future__ import annotations
import functools
import logging
import os

logger = logging.getLogger(__name__)

_YF_DEFAULT_LIB_TIMEOUT = 30

_tuning_applied = False


def _effective_timeout(requested: float | int | None) -> float | int:
    raw = os.getenv("YFINANCE_TIMEOUT", "180")
    try:
        ceiling = float(raw)
    except ValueError:
        ceiling = 180.0
    ceiling = max(20.0, min(ceiling, 300.0))
    if requested is None:
        return int(ceiling) if ceiling == int(ceiling) else ceiling
    if requested in (30, 30.0):
        return int(ceiling) if ceiling == int(ceiling) else ceiling
    return requested


def _patch_curl_session_request() -> None:
    try:
        from curl_cffi import requests as curl_requests
    except Exception as exc:
        logger.debug("curl_cffi not available: %s", exc)
        return

    Session = curl_requests.Session
    if getattr(Session, "_quant_timeout_request_patch", False):
        return

    orig = Session.request

    @functools.wraps(orig)
    def request(self, method, url, **kwargs): 
        t = kwargs.get("timeout")
        if t in (30, 30.0):
            kwargs = {**kwargs, "timeout": float(_effective_timeout(30))}
        return orig(self, method, url, **kwargs)

    Session.request = request
    Session._quant_timeout_request_patch = True


def apply_yfinance_network_tuning() -> None:
    global _tuning_applied

    if _tuning_applied:
        return

    try:
        import yfinance as yf
        from yfinance.data import YfData
    except Exception as exc:
        logger.debug("yfinance not available, skipping network tuning: %s", exc)
        return

    try:
        retries_raw = os.getenv("YFINANCE_RETRIES", "2")
        yf.config.network.retries = max(0, min(int(retries_raw), 5))
    except ValueError:
        yf.config.network.retries = 2

    _patch_curl_session_request()

    def _wrap_simple(orig):
        @functools.wraps(orig)
        def inner(self, timeout=30):  
            return orig(self, _effective_timeout(timeout))

        return inner

    for name in (
        "_get_cookie_basic",
        "_get_crumb_basic",
        "_get_cookie_csrf",
        "_get_crumb_csrf",
    ):
        orig = getattr(YfData, name, None)
        if callable(orig):
            setattr(YfData, name, _wrap_simple(orig))

    orig_cc = getattr(YfData, "_get_cookie_and_crumb", None)
    if callable(orig_cc):

        @functools.wraps(orig_cc)
        def _get_cookie_and_crumb(self, timeout=30):  
            return orig_cc(self, _effective_timeout(timeout))

        YfData._get_cookie_and_crumb = _get_cookie_and_crumb 

    orig_accept = getattr(YfData, "_accept_consent_form", None)
    if callable(orig_accept):

        @functools.wraps(orig_accept)
        def _accept_consent_form(self, consent_resp, timeout: int = 30):  
            return orig_accept(self, consent_resp, int(_effective_timeout(timeout)))

        YfData._accept_consent_form = _accept_consent_form  

    orig_make = YfData._make_request

    @functools.wraps(orig_make)
    def _make_request( 
        self,
        url,
        request_method,
        body=None,
        params=None,
        timeout=30,
        data=None,
    ):
        return orig_make(
            self,
            url,
            request_method,
            body=body,
            params=params,
            timeout=_effective_timeout(timeout),
            data=data,
        )

    YfData._make_request = _make_request  

    orig_get = YfData.get

    @functools.wraps(orig_get)
    def get(self, url, params=None, timeout=30):  
        return orig_get(self, url, params=params, timeout=_effective_timeout(timeout))

    YfData.get = get  

    orig_post = YfData.post

    @functools.wraps(orig_post)
    def post(self, url, body=None, params=None, timeout=30, data=None):  
        return orig_post(self, url, body=body, params=params, timeout=_effective_timeout(timeout), data=data)

    YfData.post = post  

    orig_cache_get = YfData.cache_get

    @functools.wraps(orig_cache_get)
    def cache_get(self, url, params=None, timeout=30): 
        return orig_cache_get(self, url, params=params, timeout=_effective_timeout(timeout))

    YfData.cache_get = cache_get  

    orig_raw_json = YfData.get_raw_json

    @functools.wraps(orig_raw_json)
    def get_raw_json(self, url, params=None, timeout=30): 
        return orig_raw_json(self, url, params=params, timeout=_effective_timeout(timeout))

    YfData.get_raw_json = get_raw_json  

    _tuning_applied = True
    logger.info(
        _effective_timeout(30),
        getattr(yf.config.network, "retries", "?"),
    )
