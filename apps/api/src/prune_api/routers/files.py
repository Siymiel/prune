"""Files router — helper endpoint to extract text from an uploaded file."""

from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile

from prune_api.core.auth import get_current_user
from prune_api.routers.knowledge import SUPPORTED_TYPES, _extract_text

router = APIRouter()

MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/files/extract")
async def extract_file(
    file: UploadFile,
    _user=Depends(get_current_user),
) -> dict:
    """Read an uploaded file, extract its text, and return it as JSON.

    The caller can then attach the result to a workflow run's ``inputs.files``
    list so a FilesNode processes it at execution time.
    """
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "txt"
    if ext not in SUPPORTED_TYPES:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}'. Supported: {', '.join(sorted(SUPPORTED_TYPES))}",
        )

    content = await file.read()
    if len(content) > MAX_BYTES:
        from fastapi import HTTPException
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    text = _extract_text(file.filename or "file.txt", content)

    return {
        "name": file.filename,
        "type": ext,
        "size": len(content),
        "text": text,
    }
