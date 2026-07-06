import uuid
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.companies.models import Company
from app.database import get_db
from app.keywords.generator import generate_keywords, generate_article
from app.keywords.models import Keyword
from app.keywords.schemas import (
    ArticleResponse,
    GenerateKeywordsRequest,
    KeywordListResponse,
    KeywordResponse,
)

router = APIRouter(prefix="/companies/{company_id}/keywords", tags=["keywords"])


async def _get_company(
    company_id: uuid.UUID,
    user_id: str,
    db: AsyncSession,
) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/", response_model=KeywordListResponse)
async def list_keywords(
    company_id: uuid.UUID,
    cluster: str | None = Query(default=None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KeywordListResponse:
    await _get_company(company_id, user_id, db)

    q = select(Keyword).where(Keyword.company_id == company_id)
    if cluster:
        q = q.where(Keyword.cluster == cluster)
    q = q.order_by(Keyword.cluster, Keyword.query)

    result = await db.execute(q)
    keywords = list(result.scalars().all())

    # Build cluster counts (from all keywords, not filtered)
    all_result = await db.execute(select(Keyword).where(Keyword.company_id == company_id))
    all_kws = list(all_result.scalars().all())
    clusters = dict(Counter(k.cluster for k in all_kws if k.cluster))

    return KeywordListResponse(
        items=[KeywordResponse.model_validate(k) for k in keywords],
        total=len(keywords),
        clusters=clusters,
    )


@router.post("/generate", response_model=KeywordListResponse)
async def generate_keyword_core(
    company_id: uuid.UUID,
    request: GenerateKeywordsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KeywordListResponse:
    company = await _get_company(company_id, user_id, db)

    # Check if already generated
    existing = await db.execute(select(Keyword).where(Keyword.company_id == company_id))
    existing_list = list(existing.scalars().all())
    if existing_list and not request.force_regenerate:
        clusters = dict(Counter(k.cluster for k in existing_list if k.cluster))
        return KeywordListResponse(
            items=[KeywordResponse.model_validate(k) for k in existing_list],
            total=len(existing_list),
            clusters=clusters,
        )

    # Clear existing if force_regenerate
    if request.force_regenerate and existing_list:
        await db.execute(delete(Keyword).where(Keyword.company_id == company_id))
        await db.flush()

    # Generate via GPT-4o
    kw_dicts = await generate_keywords(
        company_name=company.name,
        domain=company.domain,
        description=company.description,
        max_keywords=request.max_keywords,
    )

    # Save to DB
    saved = []
    for kd in kw_dicts:
        kw = Keyword(
            company_id=company_id,
            query=kd.get("query", ""),
            cluster=kd.get("cluster"),
            intent=kd.get("intent"),
            difficulty=kd.get("difficulty"),
        )
        db.add(kw)
        saved.append(kw)

    await db.flush()
    for kw in saved:
        await db.refresh(kw)

    clusters = dict(Counter(k.cluster for k in saved if k.cluster))
    return KeywordListResponse(
        items=[KeywordResponse.model_validate(k) for k in saved],
        total=len(saved),
        clusters=clusters,
    )


@router.get("/{keyword_id}", response_model=KeywordResponse)
async def get_keyword(
    company_id: uuid.UUID,
    keyword_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> KeywordResponse:
    await _get_company(company_id, user_id, db)
    result = await db.execute(
        select(Keyword).where(Keyword.id == keyword_id, Keyword.company_id == company_id)
    )
    kw = result.scalar_one_or_none()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return KeywordResponse.model_validate(kw)


@router.post("/{keyword_id}/article", response_model=ArticleResponse)
async def generate_keyword_article(
    company_id: uuid.UUID,
    keyword_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ArticleResponse:
    company = await _get_company(company_id, user_id, db)
    result = await db.execute(
        select(Keyword).where(Keyword.id == keyword_id, Keyword.company_id == company_id)
    )
    kw = result.scalar_one_or_none()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")

    # Return cached article if exists
    if kw.article_generated and kw.article_content:
        return ArticleResponse(
            keyword_id=kw.id,
            query=kw.query,
            title=kw.article_title or kw.query,
            content=kw.article_content,
            meta_description=kw.article_meta or "",
            word_count=len((kw.article_content or "").split()),
        )

    # Generate new article
    article = await generate_article(
        company_name=company.name,
        domain=company.domain,
        query=kw.query,
        cluster=kw.cluster,
    )

    kw.article_generated = True
    kw.article_title = article.get("title", kw.query)[:499]
    kw.article_content = article.get("content", "")
    kw.article_meta = article.get("meta_description", "")[:499]
    await db.flush()

    return ArticleResponse(
        keyword_id=kw.id,
        query=kw.query,
        title=kw.article_title,
        content=kw.article_content,
        meta_description=kw.article_meta or "",
        word_count=len(kw.article_content.split()),
    )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_keywords(
    company_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_company(company_id, user_id, db)
    await db.execute(delete(Keyword).where(Keyword.company_id == company_id))
    await db.flush()
