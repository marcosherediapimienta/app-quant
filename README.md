# Quant App

A modern full-stack quantitative finance platform built with React frontend and Django backend, featuring clean architecture and self-contained business logic.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Institutional-grade quantitative analysis platform for portfolio management, risk assessment, CAPM modeling, company valuation, macroeconomic analysis and AI-powered financial assistance. The application follows a clean / hexagonal architecture pattern with all business logic self-contained — no external repository dependencies.

### Key Features

- **Quantitative Engine** — Markowitz, Black-Litterman, risk parity optimization
- **Risk Analytics** — VaR, Expected Shortfall, drawdown, Sharpe, Sortino, Calmar ratios
- **CAPM Modeling** — Single and multi-asset CAPM, efficient frontier, SML/CML
- **Fundamental Valuation** — Company scoring, peer comparison, buy/sell signals
- **Macro Analysis** — Factor regression, correlation analysis, economic situation dashboard
- **AI Assistant (GalaAI)** — RAG-powered chatbot for quantitative finance (Groq / Llama 3.3 70B)
- **Modern Frontend** — React 19 with interactive charts, KaTeX math rendering
- **REST API** — Django REST Framework with versioned endpoints

## Tech Stack

### Frontend
- **React 19** — Modern JavaScript library for building user interfaces
- **Vite 7** — Next-generation build tool
- **React Router 7** — Client-side routing
- **Recharts 3** — Composable chart components
- **KaTeX** — Math typesetting
- **Axios** — HTTP client

### Backend
- **Django 6** — High-level Python web framework
- **Django REST Framework** — Toolkit for building Web APIs
- **NumPy & Pandas** — Numerical computing and data manipulation
- **SciPy & statsmodels** — Statistical analysis, regressions, optimization
- **scikit-learn** — Machine learning (Ledoit-Wolf covariance, optimization)
- **yfinance** — Market data (stocks, indices, ETFs, commodities, currencies)
- **LangChain & Groq** — LLM-powered chatbot with conversational memory
- **FAISS & sentence-transformers** — Vector search for RAG (code indexing)
- **Gunicorn** — WSGI HTTP server for production
- **WhiteNoise** — Static file serving

### Data Sources
- **Yahoo Finance** (via yfinance) — Historical and real-time prices
- **FRED** — Treasury yields and macroeconomic data

## Architecture

The application follows a clean / hexagonal architecture pattern:

```
┌─────────────────┐                  ┌─────────────────┐
│  React Frontend │                  │ Django Backend   │
│   (Port 5173)   │◄────REST API────►│   (Port 8000)   │
└─────────────────┘                  └─────────────────┘
                                              │
                                     ┌────────┴────────┐
                                     │                  │
                              ┌──────┴──────┐  ┌───────┴───────┐
                              │ Yahoo Finance│  │     FRED      │
                              │   (Market)   │  │    (Macro)    │
                              └─────────────┘  └───────────────┘
```

### Backend Layers

```
quant/                              # Single Django app
├── api/                            # HTTP layer — views, URLs, serializers
├── application/use_cases/          # Orchestration — coordinates domain logic
├── domain/                         # Core business logic (self-contained)
│   ├── pm/                         # Portfolio management
│   │   └── utils/
│   │       ├── analysis/           # Risk, CAPM, portfolio, valuation
│   │       ├── data/               # Data loading and processing
│   │       └── tools/              # Configuration constants
│   ├── macro/                      # Macroeconomic analysis
│   │   └── utils/
│   │       ├── analyzers/          # Factor, correlation, situation
│   │       ├── components/         # Regression, correlation, yield curve
│   │       └── tools/              # Configuration constants
│   └── chatbot/                    # AI assistant with RAG
│       ├── chat_engine.py          # LangChain conversation chain
│       ├── code_indexer.py         # FAISS vector store builder
│       ├── memory/                 # Conversation memory
│       └── prompts/                # Finance-specialized prompts
└── utils/                          # Shared utilities (serializers)
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python** (version 3.12+)
- **Node.js** (version 18+)
- **pip** (Python package manager)
- **npm** (Node.js package manager)

## Installation

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/v1/

## Development

### Backend Development

The Django backend follows a clean architecture pattern with the following structure:

```
backend/
├── general_settings/               # Django project configuration
│   └── settings/                   # Split settings modules
│       ├── base.py                 # Core settings (SECRET_KEY, DEBUG, LOGGING)
│       ├── apps.py                 # INSTALLED_APPS
│       ├── database.py             # Database configuration
│       ├── middleware.py            # Middleware stack
│       ├── rest_framework.py       # DRF and CORS settings
│       ├── templates.py            # Template configuration
│       ├── static.py               # Static files (WhiteNoise)
│       ├── internationalization.py # i18n settings
│       └── chatbot.py              # AI/LLM settings
├── quant/                          # Main Django application
│   ├── api/                        # API endpoints and views
│   ├── application/                # Use cases (orchestration)
│   ├── domain/                     # Core business logic
│   └── utils/                      # Shared utilities
├── manage.py                       # Django management script
└── requirements.txt                # Python dependencies
```

### Frontend Development

The React frontend is organized as follows:

```
frontend/
├── src/
│   ├── api/              # API service calls (Axios)
│   ├── components/       # Reusable React components
│   │   ├── Button/       # Button component
│   │   ├── Card/         # Card component
│   │   ├── Chat/         # Chat interface
│   │   ├── Layout/       # Page layout
│   │   ├── Results/      # Results display
│   │   └── ...           # Other components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── Portfolio/    # Portfolio analysis
│   │   ├── Risk/         # Risk metrics
│   │   ├── CAPM/         # CAPM modeling
│   │   ├── Valuation/    # Company valuation
│   │   ├── Macro/        # Macro analysis
│   │   └── Chat/         # AI chatbot
│   └── utils/            # Utility functions
├── public/               # Static assets
└── package.json          # Node.js dependencies
```

### Available Scripts

#### Backend
```bash
# Run development server
python manage.py runserver

# Run tests
python manage.py test

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files (production)
python manage.py collectstatic
```

#### Frontend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
quant-app/
├── backend/                        # Django backend application
│   ├── general_settings/           # Django project configuration
│   │   ├── settings/               # Split settings modules
│   │   ├── urls.py                 # Root URL configuration
│   │   ├── wsgi.py                 # WSGI entrypoint
│   │   └── asgi.py                 # ASGI entrypoint
│   ├── quant/                      # Main Django application
│   │   ├── api/                    # REST API layer
│   │   │   ├── urls/               # URL routing
│   │   │   └── views/              # View functions
│   │   ├── application/            # Orchestration layer
│   │   │   └── use_cases/          # Business use cases
│   │   ├── domain/                 # Core business logic
│   │   │   ├── pm/                 # Portfolio management
│   │   │   ├── macro/              # Macroeconomic analysis
│   │   │   └── chatbot/            # AI assistant
│   │   └── utils/                  # Shared utilities
│   ├── manage.py                   # Django management
│   └── requirements.txt            # Python dependencies
├── frontend/                       # React frontend application
│   ├── src/                        # Source code
│   │   ├── api/                    # API services
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── pages/                  # Page components
│   │   └── utils/                  # Utilities
│   └── package.json                # Node.js dependencies
├── requirements.txt                # Root Python dependencies
├── LICENSE                         # AGPL-3.0 license
└── README.md                       # This file
```

## API Documentation

### Base URL

```
http://localhost:8000/api/v1/
```

### Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/data/download/` | Download historical price data |
| `POST` | `/data/macro-factors/` | Download macroeconomic factors |

### Portfolio Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/portfolio/analyze/` | Run portfolio analysis and optimization |
| `GET` | `/portfolio/indices/` | Get supported index options |

### Risk Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/risk/ratios/` | Calculate risk ratios (Sharpe, Sortino, etc.) |
| `POST` | `/risk/var-es/` | Calculate VaR and Expected Shortfall |
| `POST` | `/risk/drawdown/` | Calculate drawdown metrics |
| `POST` | `/risk/benchmark/` | Benchmark comparison analysis |
| `POST` | `/risk/distribution/` | Return distribution analysis |
| `POST` | `/risk/correlation/` | Correlation matrix analysis |
| `POST` | `/risk/complete/` | Full risk analysis (all metrics) |

### CAPM Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/capm/analyze/` | Single-asset CAPM analysis |
| `POST` | `/capm/multi-asset/` | Multi-asset CAPM analysis |
| `POST` | `/capm/optimize/` | Efficient frontier optimization |
| `POST` | `/capm/expected-return/` | Calculate CAPM expected return |

### Valuation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/valuation/company/` | Company fundamental analysis |
| `POST` | `/valuation/compare/` | Multi-company comparison |
| `POST` | `/valuation/sector/` | Sector peer analysis |
| `POST` | `/valuation/signals/` | Buy/sell signal generation |

### Macro Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/macro/factors/` | Macro factor regression analysis |
| `POST` | `/macro/correlation/` | Macro correlation analysis |
| `POST` | `/macro/situation/` | Economic situation dashboard |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/send/` | Send message to AI assistant |
| `GET` | `/chat/welcome/` | Get welcome message |
| `POST` | `/chat/clear/` | Clear conversation memory |
| `GET` | `/chat/history/` | Get conversation history |

### Example API Usage

```bash
# Download historical data
curl -X POST http://localhost:8000/api/v1/data/download/ \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "GOOGL", "MSFT"], "type": "returns"}'

# Run portfolio optimization from index
curl -X POST http://localhost:8000/api/v1/portfolio/analyze/ \
  -H "Content-Type: application/json" \
  -d '{"index_name": "SP500", "config": {"method": "markowitz"}}'

# Analyze company valuation
curl -X POST http://localhost:8000/api/v1/valuation/company/ \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'

# Chat with GalaAI
curl -X POST http://localhost:8000/api/v1/chat/send/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain the Sharpe ratio"}'
```

## Testing

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test quant

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Testing

```bash
# Run linter
npm run lint

# Build check
npm run build
```

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

> **Never commit this file.** It is excluded via `.gitignore`.

```env
# AI / LLM
GROQ_API_KEY=your-groq-api-key

# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key — obtain from [console.groq.com](https://console.groq.com) |
| `SECRET_KEY` | Yes (production) | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | No | Set to `False` in production (default: `True`) |
| `ALLOWED_HOSTS` | No | Comma-separated allowed hosts |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |

Frontend environment (`frontend/.env`):

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:8000/api/v1`) |

## Limitations

### Data availability (Yahoo Finance & FRED)

All market data is sourced from Yahoo Finance and FRED via their public APIs. This introduces constraints that can affect the accuracy and completeness of analyses:

- **Incomplete fundamental data.** Not all companies expose every financial metric through Yahoo Finance. When running portfolio optimization over large indices like the S&P 500, the full index is downloaded and each company is scored and weighted according to the selected method (quality, value, momentum, etc.). If a company is missing key metrics such as ROE, ROIC, gross margin or debt ratios, it may receive a lower score or be excluded from the optimization — even if it is fundamentally a strong business.

- **Delayed or missing price data.** Some tickers may return incomplete historical price series due to delistings, ticker changes or trading halts, which can distort return calculations, correlations and risk metrics.

- **FRED API timeouts.** Macroeconomic series (e.g. yield curve data) are occasionally unavailable due to FRED API timeouts. When this happens, the affected series is excluded from the analysis and a warning is logged.

- **Index composition drift.** The S&P 500 constituent list is fetched dynamically. Changes in composition (additions, removals) may not be reflected instantly, leading to minor discrepancies in full-index analyses.

> **Disclaimer:** All results produced by this application are for informational and educational purposes only. They do not constitute investment advice and should not be used as the sole basis for any investment decision.

## Contributing

Contributions are welcome. Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed
- Follow the existing code style
- Test your changes thoroughly

## License

GNU Affero General Public License v3 — see [LICENSE](LICENSE) for details.

## Contact

### Project Maintainer

**Marcos Heredia Pimienta**
- GitHub: [marcosherediapimienta](https://github.com/marcosherediapimienta)
