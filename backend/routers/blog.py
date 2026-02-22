import string
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
from data.blog_seed import BLOG_ARTICLES_SEED_DATA, IMPORT_SECRET_KEY

router = APIRouter()


class BlogArticleMetadata(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: Optional[str] = None
    author: str
    role: str
    date: str
    readTime: Optional[str] = None
    image: Optional[str] = None
    category: str
    tags: List[str] = []
    seoDescription: Optional[str] = None


class BlogArticleFull(BlogArticleMetadata):
    content: str


@router.get("/api/blog/articles", response_model=List[BlogArticleMetadata])
def get_blog_articles(db: Session = Depends(get_db)):
    articles = (
        db.query(models.BlogArticle)
        .filter(models.BlogArticle.is_published == True)
        .order_by(models.BlogArticle.id.desc())
        .all()
    )
    return [
        BlogArticleMetadata(
            id=a.id,
            slug=a.slug,
            title=a.title,
            excerpt=a.excerpt,
            author=a.author,
            role=a.role,
            date=a.date,
            readTime=a.read_time,
            image=a.image,
            category=a.category,
            tags=a.tags if isinstance(a.tags, list) else [],
            seoDescription=a.seo_description,
        )
        for a in articles
    ]


@router.get("/api/blog/articles/{slug}", response_model=BlogArticleFull)
def get_blog_article(slug: str, db: Session = Depends(get_db)):
    article = (
        db.query(models.BlogArticle)
        .filter(
            models.BlogArticle.slug == slug, models.BlogArticle.is_published == True
        )
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return BlogArticleFull(
        id=article.id,
        slug=article.slug,
        title=article.title,
        excerpt=article.excerpt,
        content=article.content,
        author=article.author,
        role=article.role,
        date=article.date,
        readTime=article.read_time,
        image=article.image,
        category=article.category,
        tags=article.tags if isinstance(article.tags, list) else [],
        seoDescription=article.seo_description,
    )


@router.get("/import-blog-seed-data-v1")
async def import_blog_articles(
    secret: str = None,
    db: Session = Depends(get_db),
):
    if secret != IMPORT_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid secret key")

    try:
        db.query(models.BlogArticle).delete()
        db.commit()

        imported_count = 0
        for article_data in BLOG_ARTICLES_SEED_DATA:
            article = models.BlogArticle(
                slug=article_data["slug"],
                title=article_data["title"],
                excerpt=article_data["excerpt"],
                content=article_data["content"],
                author=article_data["author"],
                role=article_data["role"],
                date=article_data["date"],
                read_time=article_data["read_time"],
                image=article_data["image"],
                category=article_data["category"],
                tags=article_data["tags"],
                seo_description=article_data["seo_description"],
                is_published=True,
            )
            db.add(article)
            imported_count += 1

        db.commit()
        return JSONResponse(
            content={
                "success": True,
                "imported": imported_count,
                "message": f"Successfully imported {imported_count} blog articles",
            },
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
