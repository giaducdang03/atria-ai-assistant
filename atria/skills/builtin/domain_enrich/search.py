"""Web search backend: Serper (primary) → DuckDuckGo (fallback)."""

from __future__ import annotations

import asyncio
import inspect
import json
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_SERPER_URL = "https://google.serper.dev/search"


async def _maybe_await(value: Any) -> Any:
    """Await value if it is a coroutine, otherwise return it directly."""
    if inspect.iscoroutine(value):
        return await value
    return value


def _serper_search(query: str, max_results: int) -> list[dict[str, Any]]:
    """Call Serper API synchronously. Returns [] if no key or on error."""
    api_key = os.environ.get("SERPER_API_KEY", "")
    if not api_key:
        return []

    async def _call() -> list[dict[str, Any]]:
        headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
        payload = json.dumps({"q": query, "num": max_results})
        ac = httpx.AsyncClient(timeout=20)
        client = await _maybe_await(ac.__aenter__())
        try:
            post_cm = client.post(_SERPER_URL, headers=headers, content=payload)
            resp = await _maybe_await(post_cm.__aenter__())
            try:
                resp.raise_for_status()
                data = resp.json()
            finally:
                await _maybe_await(post_cm.__aexit__(None, None, None))
        finally:
            await _maybe_await(ac.__aexit__(None, None, None))

        results = []
        for item in (data.get("organic") or [])[:max_results]:
            url = (item.get("link") or "").strip()
            if url:
                results.append(
                    {
                        "title": (item.get("title") or "").strip(),
                        "url": url,
                        "snippet": (item.get("snippet") or "").strip(),
                    }
                )
        return results

    try:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_call())
        finally:
            loop.close()
    except Exception:
        logger.debug("Serper search failed for %r", query)
        return []


def _ddg_search(query: str, max_results: int) -> list[dict[str, Any]]:
    """DuckDuckGo search fallback. Returns [] on error."""
    try:
        from duckduckgo_search import DDGS

        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(
                    {
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    }
                )
        return results
    except Exception:
        logger.debug("DuckDuckGo search failed for %r", query)
        return []


def search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Search the web. Tries Serper first, falls back to DuckDuckGo."""
    results = _serper_search(query, max_results)
    if not results:
        results = _ddg_search(query, max_results)
    return results
