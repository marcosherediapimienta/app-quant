# Quant App

Application for quantitative portfolio analysis and optimization. Django REST API backend with a React + Vite frontend, powered by the [quant](https://github.com/marcosherediapimienta/quant) library.

## Features

| Module | Description |
|---|---|
| **Portfolio** | Portfolio analysis and optimization (Markowitz, Black-Litterman, risk parity) |
| **Risk** | VaR, Expected Shortfall, drawdown, performance ratios, correlations, distributions |
| **CAPM** | Single and multi-asset CAPM, portfolio optimization, expected returns |
| **Valuation** | Company and sector valuation, peer comparison, buy/sell signals |
| **Macro** | Factor regression, macro correlations, economic situation dashboard |
| **GalaAI** | AI chatbot with RAG for quantitative finance questions (Groq / Llama 3.3 70B) |

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, Django 6, Django REST Framework, LangChain, FAISS |
| **Frontend** | React 19, Vite 7, React Router, Recharts, KaTeX |
| **Data** | yfinance, FRED |

## Prerequisites

- Python 3.12+
- Node.js 18+
- The [`quant`](https://github.com/marcosherediapimienta/quant) repository cloned as a sibling directory (`../quant`)

## Installation

### Backend

    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate

### Frontend

    cd frontend
    npm install

## Running

    # Terminal 1 — Backend
    cd backend && python manage.py runserver

    # Terminal 2 — Frontend 
    cd frontend && npm run dev

## Project Structure

    quant-app/
    ├── backend/
    │   ├── apps/
    │   │   ├── api/                    # REST API layer
    │   │   └── core/
    │   │       └── services/           # Business logic
    │   ├── config/                     # Django settings
    │   ├── manage.py
    │   └── requirements.txt
    └── frontend/
        ├── src/
        │   ├── pages/
        │   ├── components/
        │   └── api/
        └── package.json

## Environment Variables

### Backend (`backend/.env`)

> **Never commit this file.** It is excluded via `.gitignore`. Create it manually and fill in the required values.

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key — obtain from [console.groq.com](https://console.groq.com) |
| `SECRET_KEY` | Yes (production) | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | No | Set to `False` in production (default: `True`) |
| `ALLOWED_HOSTS` | No | Comma-separated allowed hosts |
| `QUANT_PROJECT_PATH` | No | Absolute path to the `quant` library |
| `QUANT_PROJECT_ROOT` | No | Path to quant project root for RAG indexing |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:8000/api/v1`) |

## Limitations

### Data availability (Yahoo Finance & FRED)

All market data is sourced from Yahoo Finance and FRED via their public APIs. This introduces constraints that can affect the accuracy and completeness of analyses:

- **Incomplete fundamental data.** Not all companies expose every financial metric through Yahoo Finance. When running portfolio optimization over large indices like the S&P 500, the full index is downloaded and each company is scored and weighted according to the selected method (quality, value, momentum, etc.). If a company is missing key metrics such as ROE, ROIC, gross margin or debt ratios, it may receive a lower score or be excluded from the optimization — even if it is fundamentally a strong business. This introduces a coverage bias toward large-cap, well-documented names.

- **Delayed or missing price data.** Some tickers may return incomplete historical price series due to delistings, ticker changes or trading halts, which can distort return calculations, correlations and risk metrics.

- **FRED API timeouts.** Macroeconomic series (e.g. yield curve data) are occasionally unavailable due to FRED API timeouts. When this happens, the affected series is excluded from the analysis and a warning is logged.

- **Index composition drift.** The S&P 500 constituent list is fetched dynamically. Changes in composition (additions, removals) may not be reflected instantly, leading to minor discrepancies in full-index analyses.

> **Disclaimer:** All results produced by this application are for informational and educational purposes only. They do not constitute investment advice and should not be used as the sole basis for any investment decision.

## License

GNU Affero General Public License v3 — see [LICENSE](LICENSE).