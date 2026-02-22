import os
from typing import Optional
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import models
from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "3000"))

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key-change-in-prod")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_access_token(
    user: models.User, expires_delta: Optional[timedelta] = None
):
    data = {
        "sub": user.email,
        "ver": user.token_version if user.token_version is not None else 1,
    }
    return create_access_token(data, expires_delta)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (JWTError, AttributeError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    token_ver = payload.get("ver")
    if (
        token_ver is not None
        and user.token_version is not None
        and token_ver != user.token_version
    ):
        raise credentials_exception

    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    api_key: Optional[str] = Depends(api_key_header),
    db: Session = Depends(get_db),
):
    if api_key:
        user = db.query(models.User).filter(models.User.api_key == api_key).first()
        if user:
            return user

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    token_ver = payload.get("ver")
                    if (
                        token_ver is not None
                        and user.token_version is not None
                        and token_ver != user.token_version
                    ):
                        pass
                    else:
                        return user
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication (JWT or X-API-KEY required)",
    )


def verify_internal_api_key(request: Request):
    api_key = request.headers.get("X-Internal-API-Key")
    if api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return True
