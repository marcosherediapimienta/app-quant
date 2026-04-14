# Quant App — Backend

Django REST API for quantitative portfolio analysis and optimization.

## Architecture

```
backend/
├── manage.py
├── general_settings/                   # Django project configuration
│   ├── urls.py                         # Root URL routing
│   ├── wsgi.py                         # WSGI entrypoint
│   ├── asgi.py                         # ASGI entrypoint
│   └── settings/                       # Split settings modules
│       ├── base.py                     # Core (SECRET_KEY, DEBUG, LOGGING)
│       ├── apps.py                     # INSTALLED_APPS
│       ├── database.py                 # Database configuration
│       ├── middleware.py               # Middleware stack
│       ├── rest_framework.py           # DRF and CORS
│       ├── templates.py               # Template configuration
│       ├── static.py                   # Static files (WhiteNoise)
│       ├── internationalization.py     # i18n settings
│       └── chatbot.py                  # AI/LLM settings
└── quant/                              # Single Django app
    ├── api/                            # HTTP layer
    │   ├── urls/                       # URL routing
    │   └── views/                      # Views by domain
    │       ├── root_views.py           # API root and health
    │       ├── data_views.py           # Data download
    │       ├── portfolio_views.py      # Portfolio analysis
    │       ├── risk_views.py           # Risk metrics
    │       ├── capm_views.py           # CAPM modeling
    │       ├── valuation_views.py      # Fundamental valuation
    │       ├── macro_views.py          # Macro analysis
    │       └── chat_views.py           # AI chatbot
    ├── application/                    # Orchestration layer
    │   └── use_cases/                  # Business use cases
    │       ├── data_use_case.py        # Market data download
    │       ├── portfolio_use_case.py   # Portfolio optimization
    │       ├── risk_use_case.py        # Risk analysis
    │       ├── capm_use_case.py        # CAPM analysis
    │       ├── valuation_use_case.py   # Fundamental valuation
    │       ├── macro_use_case.py       # Macro factor analysis
    │       └── chat_use_case.py        # AI assistant sessions
    ├── domain/                         # Core business logic (self-contained)
    │   ├── pm/                         # Portfolio management
    │   │   └── utils/
    │   │       ├── analysis/           # Analyzers (risk, CAPM, portfolio, valuation)
    │   │       ├── data/               # Data loading and processing
    │   │       └── tools/              # Configuration constants
    │   ├── macro/                      # Macroeconomic analysis
    │   │   └── utils/
    │   │       ├── analyzers/          # Factor, correlation, situation
    │   │       ├── components/         # Regression, correlation, yield curve
    │   │       └── tools/              # Configuration constants
    │   └── chatbot/                    # AI assistant with RAG
    │       ├── chat_engine.py          # LangChain chain
    │       ├── code_indexer.py         # FAISS vector store
    │       ├── memory/                 # Conversation memory
    │       └── prompts/                # Finance prompts
    └── utils/                          # Shared utilities
        └── serializers.py              # JSON response serialization
```

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

## Running

```bash
python manage.py runserver
```

## Available Commands

```bash
python manage.py runserver          # Start development server
python manage.py test               # Run tests
python manage.py makemigrations     # Create migrations
python manage.py migrate            # Apply migrations
python manage.py createsuperuser    # Create admin user
python manage.py collectstatic      # Collect static files (production)
python manage.py check              # Run system checks
```

## Environment Variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key — obtain from [console.groq.com](https://console.groq.com) |
| `SECRET_KEY` | Yes (production) | Django secret key |
| `DEBUG` | No | Set to `False` in production (default: `True`) |
| `ALLOWED_HOSTS` | No | Comma-separated allowed hosts |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |

## Dependencies

| Library | Purpose |
|---|---|
| `Django`, `djangorestframework` | Web framework and REST API |
| `numpy`, `pandas` | Numerical computing and data manipulation |
| `scipy`, `statsmodels` | Statistics, regressions, optimization |
| `scikit-learn` | Machine learning (covariance estimation) |
| `yfinance` | Market data (Yahoo Finance) |
| `matplotlib`, `seaborn` | Visualization (server-side) |
| `langchain`, `langchain-groq` | LLM-powered chatbot |
| `sentence-transformers`, `faiss-cpu` | RAG (vector search, embeddings) |
| `gunicorn`, `whitenoise` | Production server and static files |
