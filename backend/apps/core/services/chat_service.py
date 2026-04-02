import logging
from typing import Dict, Optional
import os
import time
import sys
from pathlib import Path
from .quant_service import QuantService

try:
    from quant.chatbot.tools.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE
except ImportError:
    DEFAULT_MODEL = "llama-3.3-70b-versatile"
    DEFAULT_TEMPERATURE = 0.4

logger = logging.getLogger('apps.core.chat')

SESSION_TTL_SECONDS = 3600

def _resolve_quant_root() -> Optional[Path]:
    env_root = os.getenv('QUANT_PROJECT_ROOT')
    if env_root:
        candidate = Path(env_root)
        if candidate.exists():
            logger.info("ChatService — quant_root from QUANT_PROJECT_ROOT: %s", candidate)
            return candidate
        else:
            logger.warning("ChatService — QUANT_PROJECT_ROOT points to non-existent path: %s", candidate)

    base_dir = Path(__file__).resolve().parent 
    candidates = [
        base_dir.parent.parent.parent.parent.parent / 'quant' / 'projects' / 'quant',
        base_dir.parent.parent.parent.parent / 'quant' / 'projects' / 'quant',
        base_dir.parent.parent.parent.parent.parent / 'quant',
    ]
    for candidate in candidates:
        if candidate.exists() and (candidate / 'chatbot').exists():
            logger.info("ChatService — quant_root from relative path: %s", candidate)
            return candidate

    for path in sys.path:
        if 'quant/projects' in path or 'quant\\projects' in path:
            candidate = Path(path) / 'quant'
            if candidate.exists() and (candidate / 'chatbot').exists():
                logger.info("ChatService — quant_root from sys.path: %s", candidate)
                return candidate

    logger.warning("ChatService — quant_root not found. RAG will be disabled.")
    return None


class ChatService:
    def __init__(self):
        self.ChatEngine = QuantService.get_class(
            'quant.chatbot.chat_engine',
            'ChatEngine'
        )

        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found. "
                "Add it to your .env file or as an environment variable"
            )

        self._api_key = api_key
        self._quant_root = _resolve_quant_root()
        self._sessions: Dict[str, Dict] = {}
        self._default_session_id = "default"
        self._get_or_create_engine(self._default_session_id)

        logger.info("ChatService initialized (RAG: %s)", self._quant_root is not None)

    def _create_engine(self) -> object:
        return self.ChatEngine(
            api_key=self._api_key,
            project_root=str(self._quant_root) if self._quant_root else None,
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE,
            enable_rag=bool(self._quant_root),
        )

    def _get_or_create_engine(self, session_id: str) -> object:
        self._cleanup_expired_sessions()

        if session_id not in self._sessions:
            logger.debug("ChatService — creating new session: %s", session_id)
            self._sessions[session_id] = {
                "engine": self._create_engine(),
                "last_used": time.time()
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
            logger.info("ChatService — cleaning expired session: %s", sid)
            del self._sessions[sid]

    def send_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict] = None
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
            logger.warning("ChatService — session %s not found for clear_memory", sid)

    def get_history(self, session_id: Optional[str] = None, last_n: int = 10) -> list:
        sid = session_id or self._default_session_id
        engine = self._get_or_create_engine(sid)
        return engine.get_history(last_n)

    def get_active_sessions(self) -> Dict:
        now = time.time()
        return {
            sid: {
                "last_used_ago_s": round(now - data["last_used"]),
                "message_count": len(data["engine"].get_history())
            }
            for sid, data in self._sessions.items()
        }
