import logging
import os
import time
from pathlib import Path
from typing import Dict, Optional

from django.conf import settings

from quant.domain.chatbot.chat_engine import ChatEngine
from quant.domain.chatbot.tools.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE

logger = logging.getLogger('quant.application.chat')

SESSION_TTL_SECONDS = 3600


def _resolve_domain_root() -> Optional[Path]:
    domain_path = Path(settings.QUANT_DOMAIN_PATH)
    if domain_path.exists() and (domain_path / 'chatbot').exists():
        logger.info("ChatUseCase — domain root: %s", domain_path)
        return domain_path

    fallback = Path(__file__).resolve().parent.parent.parent / 'domain'
    if fallback.exists() and (fallback / 'chatbot').exists():
        logger.info("ChatUseCase — domain root (fallback): %s", fallback)
        return fallback

    logger.warning("ChatUseCase — domain root not found. RAG will be disabled.")
    return None


class ChatUseCase:
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found. "
                "Add it to your .env file or as an environment variable"
            )

        self._api_key = api_key
        self._domain_root = _resolve_domain_root()
        self._sessions: Dict[str, Dict] = {}
        self._default_session_id = "default"
        self._get_or_create_engine(self._default_session_id)

        logger.info("ChatUseCase initialized (RAG: %s)", self._domain_root is not None)

    def _create_engine(self) -> ChatEngine:
        return ChatEngine(
            api_key=self._api_key,
            project_root=str(self._domain_root) if self._domain_root else None,
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE,
            enable_rag=bool(self._domain_root),
        )

    def _get_or_create_engine(self, session_id: str) -> ChatEngine:
        self._cleanup_expired_sessions()

        if session_id not in self._sessions:
            logger.debug("ChatUseCase — creating new session: %s", session_id)
            self._sessions[session_id] = {
                "engine": self._create_engine(),
                "last_used": time.time(),
            }
        else:
            self._sessions[session_id]["last_used"] = time.time()

        return self._sessions[session_id]["engine"]

    def _cleanup_expired_sessions(self):
        now = time.time()
        expired = [
            sid for sid, data in self._sessions.items()
            if sid != self._default_session_id
            and (now - data["last_used"]) > SESSION_TTL_SECONDS
        ]
        for sid in expired:
            logger.info("ChatUseCase — cleaning expired session: %s", sid)
            del self._sessions[sid]

    def send_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict] = None,
    ) -> Dict:
        sid = session_id or self._default_session_id
        engine = self._get_or_create_engine(sid)
        return engine.respond(message, context)

    def get_welcome_message(self) -> str:
        engine = self._get_or_create_engine(self._default_session_id)
        return engine.get_welcome_message()

    def clear_memory(self, session_id: Optional[str] = None):
        sid = session_id or self._default_session_id
        if sid in self._sessions:
            self._sessions[sid]["engine"].clear_memory()
        else:
            logger.warning("ChatUseCase — session %s not found for clear_memory", sid)

    def get_history(self, session_id: Optional[str] = None, last_n: int = 10) -> list:
        sid = session_id or self._default_session_id
        engine = self._get_or_create_engine(sid)
        return engine.get_history(last_n)

    def get_active_sessions(self) -> Dict:
        now = time.time()
        return {
            sid: {
                "last_used_ago_s": round(now - data["last_used"]),
                "message_count": len(data["engine"].get_history()),
            }
            for sid, data in self._sessions.items()
        }
