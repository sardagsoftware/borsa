"""
AILYDIAN News Intelligence & Trust Index Microservice
Advanced news analysis with reliability scoring and heatmap visualization
© 2025 Emrah Şardağ - Ultra Pro Edition
"""

import os
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass
from enum import Enum

import pandas as pd
import numpy as np
import aiohttp
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# News analysis & NLP
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import feedparser
import requests
from bs4 import BeautifulSoup
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation

# Async HTTP client
from httpx import AsyncClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
except:
    pass

# FastAPI App
app = FastAPI(
    title="AILYDIAN News Intelligence & Trust Index",
    description="Advanced news analysis with reliability scoring",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsSource(str, Enum):
    BLOOMBERG = "bloomberg"
    REUTERS = "reuters"
    YAHOO_FINANCE = "yahoo_finance"
    MARKETWATCH = "marketwatch"
    CNBC = "cnbc"
    FINANCIAL_TIMES = "financial_times"
    WALL_STREET_JOURNAL = "wsj"
    SEEKING_ALPHA = "seeking_alpha"
    BENZINGA = "benzinga"
    GOOGLE_NEWS = "google_news"

class TrustLevel(str, Enum):
    VERY_HIGH = "very_high"      # 90-100%
    HIGH = "high"                # 80-90%
    MEDIUM = "medium"            # 60-80%
    LOW = "low"                  # 40-60%
    VERY_LOW = "very_low"        # 0-40%

class SentimentLevel(str, Enum):
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

@dataclass
class NewsArticle:
    id: str
    title: str
    content: str
    summary: str
    source: NewsSource
    author: Optional[str] = None
    published_at: datetime = datetime.utcnow()
    url: Optional[str] = None
    symbols: List[str] = None
    categories: List[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[SentimentLevel] = None
    trust_score: Optional[float] = None
    trust_level: Optional[TrustLevel] = None
    engagement: Optional[Dict] = None
    keywords: List[str] = None

class NewsRequest(BaseModel):
    symbols: Optional[List[str]] = None
    sources: List[NewsSource] = [NewsSource.BLOOMBERG, NewsSource.REUTERS]
    limit: int = Field(default=50, ge=1, le=200)
    hours_back: int = Field(default=24, ge=1, le=168)
    min_trust_score: float = Field(default=0.5, ge=0.0, le=1.0)

class HeatmapRequest(BaseModel):
    symbol: str
    days_back: int = Field(default=7, ge=1, le=30)
    sources: Optional[List[NewsSource]] = None

class TrustAnalysisRequest(BaseModel):
    articles: List[str]  # Article URLs or IDs
    
class NewsResponse(BaseModel):
    articles: List[Dict]
    total_count: int
    avg_sentiment: float
    avg_trust_score: float
    source_breakdown: Dict[str, int]

class TrustEngine:
    """Advanced news source trust and credibility scoring engine"""
    
    # Trust scores for different news sources (0-1 scale)
    SOURCE_BASE_TRUST = {
        NewsSource.BLOOMBERG: 0.95,
        NewsSource.REUTERS: 0.93,
        NewsSource.FINANCIAL_TIMES: 0.91,
        NewsSource.WALL_STREET_JOURNAL: 0.89,
        NewsSource.CNBC: 0.78,
        NewsSource.MARKETWATCH: 0.75,
        NewsSource.YAHOO_FINANCE: 0.65,
        NewsSource.SEEKING_ALPHA: 0.62,
        NewsSource.BENZINGA: 0.58,
        NewsSource.GOOGLE_NEWS: 0.55,
    }
    
    def __init__(self):
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    
    def calculate_trust_score(self, article: NewsArticle) -> float:
        """Calculate comprehensive trust score for an article"""
        
        # Base trust from source credibility
        base_trust = self.SOURCE_BASE_TRUST.get(article.source, 0.5)
        
        # Content quality factors
        content_quality = self._analyze_content_quality(article)
        
        # Author credibility (if available)
        author_credibility = self._analyze_author_credibility(article.author) if article.author else 0.5
        
        # Temporal freshness (newer articles get slight boost)
        freshness = self._calculate_freshness_score(article.published_at)
        
        # Sentiment consistency (extreme sentiment reduces trust slightly)
        sentiment_consistency = self._analyze_sentiment_consistency(article)
        
        # Weighted calculation
        trust_score = (
            base_trust * 0.4 +
            content_quality * 0.25 +
            author_credibility * 0.15 +
            freshness * 0.10 +
            sentiment_consistency * 0.10
        )
        
        return min(1.0, max(0.0, trust_score))
    
    def _analyze_content_quality(self, article: NewsArticle) -> float:
        """Analyze content quality indicators"""
        quality_score = 0.5  # baseline
        
        # Content length (optimal range)
        content_length = len(article.content) if article.content else len(article.title)
        if 500 <= content_length <= 3000:
            quality_score += 0.2
        elif content_length < 200:
            quality_score -= 0.2
        
        # Title quality
        title_words = len(article.title.split())
        if 8 <= title_words <= 15:  # Optimal headline length
            quality_score += 0.1
        
        # Check for key financial terms
        financial_terms = ['earnings', 'revenue', 'profit', 'loss', 'stock', 'market', 'trading', 'price']
        content_lower = (article.content or '').lower() + article.title.lower()
        financial_relevance = sum(1 for term in financial_terms if term in content_lower) / len(financial_terms)
        quality_score += financial_relevance * 0.2
        
        return min(1.0, max(0.0, quality_score))
    
    def _analyze_author_credibility(self, author: str) -> float:
        """Analyze author credibility (simplified)"""
        if not author:
            return 0.5
        
        # Check for known credible financial journalists
        credible_authors = {
            'bloomberg staff', 'reuters staff', 'dow jones', 'financial times',
            'wall street journal', 'cnbc staff'
        }
        
        author_lower = author.lower()
        if any(cred in author_lower for cred in credible_authors):
            return 0.9
        
        # Check for institutional emails or credentials
        if '@' in author_lower and any(domain in author_lower for domain in ['bloomberg', 'reuters', 'wsj', 'ft']):
            return 0.8
        
        return 0.6  # default for individual authors
    
    def _calculate_freshness_score(self, published_at: datetime) -> float:
        """Calculate freshness score based on publication time"""
        age_hours = (datetime.utcnow() - published_at).total_seconds() / 3600
        
        if age_hours <= 1:
            return 1.0
        elif age_hours <= 6:
            return 0.9
        elif age_hours <= 24:
            return 0.8
        elif age_hours <= 72:
            return 0.7
        else:
            return 0.6
    
    def _analyze_sentiment_consistency(self, article: NewsArticle) -> float:
        """Analyze sentiment consistency (extreme sentiment may indicate bias)"""
        if not article.sentiment_score:
            # Quick sentiment analysis
            sentiment = self.sentiment_analyzer.polarity_scores(article.title + ' ' + (article.content[:500] if article.content else ''))
            article.sentiment_score = sentiment['compound']
        
        # Extreme sentiment reduces trust slightly
        abs_sentiment = abs(article.sentiment_score)
        if abs_sentiment > 0.8:
            return 0.7  # Very extreme sentiment
        elif abs_sentiment > 0.6:
            return 0.8  # Moderate bias
        else:
            return 1.0  # Neutral to moderate sentiment
    
    def get_trust_level(self, trust_score: float) -> TrustLevel:
        """Convert trust score to categorical level"""
        if trust_score >= 0.9:
            return TrustLevel.VERY_HIGH
        elif trust_score >= 0.8:
            return TrustLevel.HIGH
        elif trust_score >= 0.6:
            return TrustLevel.MEDIUM
        elif trust_score >= 0.4:
            return TrustLevel.LOW
        else:
            return TrustLevel.VERY_LOW

class NewsCollector:
    """Collect news from various financial sources"""
    
    def __init__(self):
        self.trust_engine = TrustEngine()
        self.session = None
        
        # API configurations
        self.rss_feeds = {
            NewsSource.YAHOO_FINANCE: "https://feeds.finance.yahoo.com/rss/2.0/headline",
            NewsSource.MARKETWATCH: "https://feeds.marketwatch.com/marketwatch/topstories/",
            NewsSource.SEEKING_ALPHA: "https://seekingalpha.com/feed.xml",
            NewsSource.BENZINGA: "https://www.benzinga.com/feed",
        }
        
        # News API configurations (would require API keys)
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.bloomberg_api_key = os.getenv('BLOOMBERG_API_KEY')
        self.reuters_api_key = os.getenv('REUTERS_API_KEY')
    
    async def initialize(self):
        """Initialize HTTP session"""
        self.session = AsyncClient(timeout=30.0)
    
    async def collect_news(self, request: NewsRequest) -> List[NewsArticle]:
        """Collect news from multiple sources"""
        all_articles = []
        
        # Collect from RSS feeds
        rss_tasks = []
        for source in request.sources:
            if source in self.rss_feeds:
                rss_tasks.append(self._collect_from_rss(source, request))
        
        if rss_tasks:
            rss_results = await asyncio.gather(*rss_tasks, return_exceptions=True)
            for result in rss_results:
                if isinstance(result, list):
                    all_articles.extend(result)
        
        # Collect from premium APIs (if available)
        if self.news_api_key:
            news_api_articles = await self._collect_from_news_api(request)
            all_articles.extend(news_api_articles)
        
        # Filter by time range
        cutoff_time = datetime.utcnow() - timedelta(hours=request.hours_back)
        filtered_articles = [
            article for article in all_articles 
            if article.published_at >= cutoff_time
        ]
        
        # Calculate trust and sentiment scores
        for article in filtered_articles:
            article.trust_score = self.trust_engine.calculate_trust_score(article)
            article.trust_level = self.trust_engine.get_trust_level(article.trust_score)
            
            # Sentiment analysis
            if not article.sentiment_score:
                sentiment = self.trust_engine.sentiment_analyzer.polarity_scores(
                    article.title + ' ' + (article.content[:500] if article.content else '')
                )
                article.sentiment_score = sentiment['compound']
                article.sentiment_label = self._get_sentiment_label(article.sentiment_score)
        
        # Filter by trust score
        trusted_articles = [
            article for article in filtered_articles 
            if article.trust_score >= request.min_trust_score
        ]
        
        # Sort by trust score and recency
        trusted_articles.sort(
            key=lambda x: (x.trust_score * 0.7 + (1 - (datetime.utcnow() - x.published_at).total_seconds() / 86400) * 0.3),
            reverse=True
        )
        
        return trusted_articles[:request.limit]
    
    async def _collect_from_rss(self, source: NewsSource, request: NewsRequest) -> List[NewsArticle]:
        """Collect news from RSS feeds"""
        articles = []
        
        try:
            feed_url = self.rss_feeds[source]
            response = await self.session.get(feed_url)
            
            if response.status_code == 200:
                feed = feedparser.parse(response.content)
                
                for entry in feed.entries[:request.limit]:
                    # Parse publication date
                    published_at = datetime.utcnow()
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published_at = datetime(*entry.published_parsed[:6])
                    
                    # Extract content
                    content = getattr(entry, 'summary', '') or getattr(entry, 'description', '')
                    
                    # Create article
                    article = NewsArticle(
                        id=f"{source}_{hash(entry.title)}",
                        title=entry.title,
                        content=content,
                        summary=content[:300] + '...' if len(content) > 300 else content,
                        source=source,
                        published_at=published_at,
                        url=entry.link,
                        symbols=self._extract_symbols(entry.title + ' ' + content),
                        keywords=self._extract_keywords(entry.title + ' ' + content)
                    )
                    
                    articles.append(article)
                    
        except Exception as e:
            logger.error(f"RSS collection failed for {source}: {str(e)}")
        
        return articles
    
    async def _collect_from_news_api(self, request: NewsRequest) -> List[NewsArticle]:
        """Collect news from News API (newsapi.org)"""
        articles = []
        
        if not self.news_api_key:
            return articles
        
        try:
            # Build query
            query_parts = []
            if request.symbols:
                query_parts.extend([f'"{symbol}"' for symbol in request.symbols])
            
            query = ' OR '.join(query_parts) if query_parts else 'stock market trading'
            
            url = "https://newsapi.org/v2/everything"
            params = {
                'q': query,
                'apiKey': self.news_api_key,
                'language': 'en',
                'sortBy': 'publishedAt',
                'pageSize': min(100, request.limit * 2)  # Get more to filter later
            }
            
            response = await self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                for item in data.get('articles', []):
                    # Skip if no content
                    if not item.get('title') or item.get('title') == '[Removed]':
                        continue
                    
                    # Parse publication date
                    published_at = datetime.utcnow()
                    if item.get('publishedAt'):
                        try:
                            published_at = datetime.fromisoformat(item['publishedAt'].replace('Z', '+00:00'))
                        except:
                            pass
                    
                    # Determine source
                    source_name = item.get('source', {}).get('name', '').lower()
                    source = NewsSource.GOOGLE_NEWS  # Default
                    
                    for news_source in NewsSource:
                        if news_source.value.lower() in source_name:
                            source = news_source
                            break
                    
                    content = item.get('content', '') or item.get('description', '')
                    
                    article = NewsArticle(
                        id=f"newsapi_{hash(item['title'])}",
                        title=item['title'],
                        content=content,
                        summary=item.get('description', content[:300] + '...' if len(content) > 300 else content),
                        source=source,
                        author=item.get('author'),
                        published_at=published_at,
                        url=item.get('url'),
                        symbols=self._extract_symbols(item['title'] + ' ' + content),
                        keywords=self._extract_keywords(item['title'] + ' ' + content)
                    )
                    
                    articles.append(article)
                    
        except Exception as e:
            logger.error(f"News API collection failed: {str(e)}")
        
        return articles
    
    def _extract_symbols(self, text: str) -> List[str]:
        """Extract stock symbols from text"""
        import re
        
        # Common patterns for stock symbols
        patterns = [
            r'\$([A-Z]{1,5})\b',  # $AAPL format
            r'\b([A-Z]{2,5})\s+stock',  # AAPL stock format
            r'\b([A-Z]{2,5})\s+shares',  # AAPL shares format
        ]
        
        symbols = set()
        for pattern in patterns:
            matches = re.findall(pattern, text.upper())
            symbols.update(matches)
        
        # Filter out common false positives
        false_positives = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'OLD'}
        
        return list(symbols - false_positives)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        try:
            # Simple keyword extraction using TextBlob
            blob = TextBlob(text)
            
            # Extract noun phrases
            keywords = []
            for phrase in blob.noun_phrases:
                if len(phrase.split()) <= 3 and len(phrase) >= 4:  # Reasonable length
                    keywords.append(phrase)
            
            return keywords[:10]  # Top 10 keywords
            
        except:
            return []
    
    def _get_sentiment_label(self, sentiment_score: float) -> SentimentLevel:
        """Convert sentiment score to label"""
        if sentiment_score >= 0.6:
            return SentimentLevel.VERY_POSITIVE
        elif sentiment_score >= 0.2:
            return SentimentLevel.POSITIVE
        elif sentiment_score >= -0.2:
            return SentimentLevel.NEUTRAL
        elif sentiment_score >= -0.6:
            return SentimentLevel.NEGATIVE
        else:
            return SentimentLevel.VERY_NEGATIVE

# Global instances
news_collector = NewsCollector()
redis_client = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global redis_client
    
    try:
        # Initialize Redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/1')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis connection failed: {str(e)}")
    
    # Initialize news collector
    await news_collector.initialize()
    
    logger.info("AILYDIAN News Intelligence service started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global redis_client
    
    if redis_client:
        await redis_client.close()
    
    if news_collector.session:
        await news_collector.session.aclose()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "news-intelligence",
        "version": "1.0.0",
        "redis_available": redis_client is not None,
        "sources_available": len(news_collector.rss_feeds)
    }

# News collection endpoints
@app.post("/collect-news", response_model=NewsResponse)
async def collect_news(request: NewsRequest):
    """Collect news from various sources"""
    try:
        articles = await news_collector.collect_news(request)
        
        # Calculate statistics
        avg_sentiment = np.mean([a.sentiment_score for a in articles if a.sentiment_score]) if articles else 0.0
        avg_trust_score = np.mean([a.trust_score for a in articles if a.trust_score]) if articles else 0.0
        
        # Source breakdown
        source_breakdown = {}
        for article in articles:
            source_breakdown[article.source] = source_breakdown.get(article.source, 0) + 1
        
        # Convert articles to dict format
        articles_data = []
        for article in articles:
            articles_data.append({
                'id': article.id,
                'title': article.title,
                'summary': article.summary,
                'source': article.source,
                'author': article.author,
                'published_at': article.published_at.isoformat(),
                'url': article.url,
                'symbols': article.symbols or [],
                'sentiment_score': article.sentiment_score,
                'sentiment_label': article.sentiment_label,
                'trust_score': article.trust_score,
                'trust_level': article.trust_level,
                'keywords': article.keywords or []
            })
        
        return NewsResponse(
            articles=articles_data,
            total_count=len(articles),
            avg_sentiment=float(avg_sentiment),
            avg_trust_score=float(avg_trust_score),
            source_breakdown=source_breakdown
        )
        
    except Exception as e:
        logger.error(f"News collection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/heatmap-data")
async def generate_heatmap_data(request: HeatmapRequest):
    """Generate heatmap data for news sentiment analysis"""
    try:
        # Collect news for the symbol
        news_request = NewsRequest(
            symbols=[request.symbol],
            sources=request.sources or list(NewsSource),
            limit=200,
            hours_back=request.days_back * 24
        )
        
        articles = await news_collector.collect_news(news_request)
        
        if not articles:
            return {
                "symbol": request.symbol,
                "message": "No news articles found",
                "heatmap_data": []
            }
        
        # Create time-series data for heatmap
        df = pd.DataFrame([{
            'timestamp': article.published_at,
            'sentiment_score': article.sentiment_score,
            'trust_score': article.trust_score,
            'source': article.source,
            'title': article.title
        } for article in articles])
        
        # Group by day and hour
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        
        # Create heatmap matrix
        heatmap_data = []
        
        for date in df['date'].unique():
            day_data = df[df['date'] == date]
            
            for hour in range(24):
                hour_data = day_data[day_data['hour'] == hour]
                
                if len(hour_data) > 0:
                    avg_sentiment = hour_data['sentiment_score'].mean()
                    avg_trust = hour_data['trust_score'].mean()
                    article_count = len(hour_data)
                    
                    # Weight sentiment by trust score
                    weighted_sentiment = (hour_data['sentiment_score'] * hour_data['trust_score']).mean()
                    
                    heatmap_data.append({
                        'date': date.isoformat(),
                        'hour': hour,
                        'sentiment_score': float(avg_sentiment),
                        'trust_score': float(avg_trust),
                        'weighted_sentiment': float(weighted_sentiment),
                        'article_count': article_count,
                        'intensity': min(1.0, article_count / 5.0)  # Normalized intensity
                    })
        
        return {
            "symbol": request.symbol,
            "period_days": request.days_back,
            "total_articles": len(articles),
            "heatmap_data": heatmap_data,
            "source_breakdown": df.groupby('source')['sentiment_score'].mean().to_dict()
        }
        
    except Exception as e:
        logger.error(f"Heatmap generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trust-sources")
async def get_trust_sources():
    """Get list of news sources with their base trust scores"""
    trust_engine = TrustEngine()
    
    return {
        "trust_scores": {
            source.value: trust_engine.SOURCE_BASE_TRUST.get(source, 0.5)
            for source in NewsSource
        },
        "trust_levels": {
            "very_high": "90-100%",
            "high": "80-90%", 
            "medium": "60-80%",
            "low": "40-60%",
            "very_low": "0-40%"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
