import logging
import os
import sys
import uuid
import json
from datetime import datetime
from logging.handlers import RotatingFileHandler
from contextvars import ContextVar
from typing import Optional, Dict, Any

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")
user_id_ctx: ContextVar[str] = ContextVar("user_id", default="")

_sentry_initialized = False
_logging_initialized = False

LOGS_DIR = os.path.join(os.path.dirname(__file__), "logs")
ERROR_LOG_FILE = os.path.join(LOGS_DIR, "errors.log")


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
            "user_id": user_id_ctx.get(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_data") and record.extra_data:
            log_data["data"] = record.extra_data

        return json.dumps(log_data)


class ExtraLogAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        kwargs.setdefault("extra", {})
        kwargs["extra"]["extra_data"] = self.extra
        return msg, kwargs


def init_logging(log_level: str = "INFO"):
    global _logging_initialized

    if _logging_initialized:
        return

    os.makedirs(LOGS_DIR, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    root_logger.handlers.clear()

    file_handler = RotatingFileHandler(
        ERROR_LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.ERROR)
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    console_format = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    )
    console_handler.setFormatter(console_format)
    root_logger.addHandler(console_handler)

    _logging_initialized = True


def init_sentry(
    dsn: Optional[str] = None,
    environment: str = "development",
    release: Optional[str] = None,
    traces_sample_rate: float = 0.1,
):
    global _sentry_initialized

    if _sentry_initialized:
        return

    dsn = dsn or os.getenv("SENTRY_DSN")

    if not dsn:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release or os.getenv("SENTRY_RELEASE"),
            traces_sample_rate=traces_sample_rate,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            before_send=before_send_sentry,
        )
        _sentry_initialized = True
    except ImportError:
        pass


def before_send_sentry(event: Dict[str, Any], hint: Dict[str, Any]) -> Dict[str, Any]:
    request_id = request_id_ctx.get()
    user_id = user_id_ctx.get()

    if request_id:
        event.setdefault("tags", {})["request_id"] = request_id
    if user_id:
        event.setdefault("user", {})["id"] = user_id

    return event


def init_error_tracking(
    sentry_dsn: Optional[str] = None,
    environment: str = "development",
    log_level: str = "INFO",
):
    init_logging(log_level)
    init_sentry(sentry_dsn, environment)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def get_logger_with_extra(name: str, **extra) -> ExtraLogAdapter:
    logger = get_logger(name)
    return ExtraLogAdapter(logger, extra)


def set_request_id(request_id: Optional[str] = None) -> str:
    rid = request_id or str(uuid.uuid4())[:8]
    request_id_ctx.set(rid)
    return rid


def set_user_context(user_id: str, email: Optional[str] = None):
    user_id_ctx.set(user_id)

    if _sentry_initialized:
        try:
            import sentry_sdk

            sentry_sdk.set_user(
                {
                    "id": user_id,
                    "email": email,
                }
            )
        except ImportError:
            pass


def clear_user_context():
    user_id_ctx.set("")

    if _sentry_initialized:
        try:
            import sentry_sdk

            sentry_sdk.set_user(None)
        except ImportError:
            pass


def add_breadcrumb(
    message: str,
    category: str = "custom",
    level: str = "info",
    data: Optional[Dict[str, Any]] = None,
):
    if _sentry_initialized:
        try:
            import sentry_sdk

            sentry_sdk.add_breadcrumb(
                message=message,
                category=category,
                level=level,
                data=data or {},
            )
        except ImportError:
            pass


def capture_exception(
    exc: Exception,
    context: Optional[Dict[str, Any]] = None,
):
    logger = get_logger(__name__)
    logger.exception(f"Exception captured: {type(exc).__name__}: {exc}")

    if _sentry_initialized:
        try:
            import sentry_sdk

            if context:
                for key, value in context.items():
                    sentry_sdk.set_context(key, value)
            sentry_sdk.capture_exception(exc)
        except ImportError:
            pass


def capture_message(
    message: str,
    level: str = "error",
    context: Optional[Dict[str, Any]] = None,
):
    logger = get_logger(__name__)
    log_method = getattr(logger, level, logger.error)
    log_method(message)

    if _sentry_initialized:
        try:
            import sentry_sdk

            if context:
                for key, value in context.items():
                    sentry_sdk.set_context(key, value)
            sentry_sdk.capture_message(message, level=level)
        except ImportError:
            pass


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    logger = get_logger("request")

    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "ip_address": ip_address,
    }

    level = logging.INFO
    if status_code >= 500:
        level = logging.ERROR
    elif status_code >= 400:
        level = logging.WARNING

    adapter = ExtraLogAdapter(logger, log_data)
    adapter.log(level, f"{method} {path} - {status_code} ({duration_ms:.2f}ms)")
