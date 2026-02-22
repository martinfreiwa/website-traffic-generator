from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from dependencies import get_current_user

router = APIRouter()


@router.get("/tools/scan-ga4")
async def scan_ga4(url: str, current_user: models.User = Depends(get_current_user)):
    from web_utils import find_ga4_tid

    if not url.startswith("http"):
        url = "https://" + url

    tid = await find_ga4_tid(url)
    if not tid:
        raise HTTPException(status_code=404, detail="No GA4 ID found on this page.")

    return {"tid": tid}


@router.get("/health")
def health_check():
    return {"status": "healthy", "mode": "saas_foundation"}
