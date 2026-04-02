# Quant App

Web application for quantitative financial analysis. Django REST API backend with a React + Vite frontend, powered by the [quant](https://github.com/marcosherediapimienta/quant).

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
| **Backend** | Python 3.12, Django 4.2, Django REST Framework, LangChain, FAISS |
| **Frontend** | React 19, Vite 7, React Router, Recharts, KaTeX |
| **Data** | yfinance, FRED |

## Prerequisites

- Python 3.12+
- Node.js 18+
- The [`quant`](https://github.com/marcosherediapimienta/quant) repository cloned as a sibling directory (`../quant`)

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # edit and set GROQ_API_KEY
python manage.py migrate
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # adjust VITE_API_BASE_URL if needed
```

## Running

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend && python manage.py runserver

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

## Project Structure

```
quant-app/
├── backend/
│   ├── apps/
│   │   ├── api/                    # REST API layer
│   │   │   ├── views/              # Endpoint handlers
│   │   │   ├── urls.py             # URL routing
│   │   │   └── serializers.py      # Response serialization
│   │   └── core/
│   │       └── services/           # Business logic
│   │           ├── portfolio_service.py
│   │           ├── risk_service.py
│   │           ├── capm_service.py
│   │           ├── valuation_service.py
│   │           ├── macro_service.py
│   │           ├── chat_service.py
│   │           ├── data_service.py
│   │           └── quant_service.py
│   ├── config/                     # Django settings
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/                  # Page components
    │   │   ├── Home/
    │   │   ├── Portfolio/
    │   │   ├── Risk/
    │   │   ├── CAPM/
    │   │   ├── Valuation/
    │   │   ├── Macro/
    │   │   └── Chat/
    │   ├── components/             # Reusable UI components
    │   ├── api/                    # API client (Axios)
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for GalaAI |
| `SECRET_KEY` | Production | Django secret key |
| `DEBUG` | No | Debug mode (default: `True`) |
| `ALLOWED_HOSTS` | No | Comma-separated allowed hosts |
| `QUANT_PROJECT_PATH` | No | Path to quant library (auto-resolved) |
| `QUANT_PROJECT_ROOT` | No | Path to quant project root for RAG indexing |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:8000/api/v1`) |

## API Endpoints

Base URL: `/api/v1/`

| Group | Endpoints |
|---|---|
| Health | `GET /health/` |
| Portfolio | `/portfolio/analyze/` |
| Risk | `/risk/ratios/`, `/risk/var-es/`, `/risk/drawdown/`, `/risk/benchmark/`, `/risk/distribution/`, `/risk/correlation/`, `/risk/complete/` |
| CAPM | `/capm/analyze/`, `/capm/multi-asset/`, `/capm/optimize/`, `/capm/expected-return/` |
| Valuation | `/valuation/company/`, `/valuation/compare/`, `/valuation/sector/`, `/valuation/signals/` |
| Macro | `/macro/factors/`, `/macro/correlation/`, `/macro/situation/` |
| Chat | `/chat/send/`, `/chat/welcome/`, `/chat/clear/`, `/chat/history/` |
| Data | `/data/download/`, `/data/macro-factors/` |

## License

GNU Affero General Public License v3 — see [LICENSE](LICENSE).
