"""
AILYDIAN Social Sentiment Analysis Microservice
Advanced NLP sentiment analysis for financial markets with FinBERT integration
© 2025 Emrah Şardağ - Ultra Pro Edition
"""

import os
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
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

# NLP & Sentiment Analysis
import nltk
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import pipeline
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# Social Media APIs
import tweepy
import praw  # Reddit API
import yfinance as yf

# Async HTTP client
from httpx import AsyncClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

# FastAPI App
app = FastAPI(
    title="AILYDIAN Social Sentiment Analysis",
    description="Advanced NLP sentiment analysis for financial markets",
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

# Redis client for caching
redis_client = None

# Sentiment Models
finbert_analyzer = None
vader_analyzer = SentimentIntensityAnalyzer()

class SentimentScore(str, Enum):
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

class DataSource(str, Enum):
    TWITTER = "twitter"
    REDDIT = "reddit"
    STOCKTWITS = "stocktwits"
    NEWS = "news"

@dataclass
class SocialMention:
    id: str
    text: str
    author: str
    timestamp: datetime
    source: DataSource
    symbol: Optional[str] = None
    engagement: Dict[str, int] = None  # likes, retweets, comments
    url: Optional[str] = None

class SentimentAnalysisRequest(BaseModel):
    text: str
    symbol: Optional[str] = None
    use_finbert: bool = True

class SentimentAnalysisResponse(BaseModel):
    sentiment_score: float = Field(description="Sentiment score between -1 and 1")
    sentiment_label: SentimentScore
    confidence: float
    finbert_score: Optional[Dict] = None
    vader_score: Optional[Dict] = None
    textblob_score: Optional[float] = None
    
class BulkSentimentRequest(BaseModel):
    texts: List[str]
    symbol: Optional[str] = None
    use_finbert: bool = True

class SocialDataRequest(BaseModel):
    symbol: str
    sources: List[DataSource] = [DataSource.TWITTER, DataSource.REDDIT]
    limit: int = Field(default=100, ge=1, le=1000)
    hours_back: int = Field(default=24, ge=1, le=168)

class TrendAnalysisRequest(BaseModel):
    symbol: str
    days_back: int = Field(default=7, ge=1, le=30)

class SentimentEngine:
    """Advanced multi-model sentiment analysis engine"""
    
    def __init__(self):
        self.finbert_tokenizer = None
        self.finbert_model = None
        self.finbert_pipeline = None
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def initialize_finbert(self):
        """Initialize FinBERT model for financial sentiment analysis"""
        try:
            logger.info("Loading FinBERT model...")
            model_name = "yiyanghkust/finbert-tone"
            
            self.finbert_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.finbert_model = AutoModelForSequenceClassification.from_pretrained(model_name)
            
            self.finbert_pipeline = pipeline(
                "text-classification",
                model=self.finbert_model,
                tokenizer=self.finbert_tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info(f"FinBERT model loaded successfully on {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load FinBERT model: {str(e)}")
            return False
    
    def analyze_with_vader(self, text: str) -> Dict:
        """Analyze sentiment using VADER"""
        scores = self.vader_analyzer.polarity_scores(text)
        return {
            "compound": scores['compound'],
            "positive": scores['pos'],
            "negative": scores['neg'],
            "neutral": scores['neu']
        }
    
    def analyze_with_textblob(self, text: str) -> float:
        """Analyze sentiment using TextBlob"""
        blob = TextBlob(text)
        return blob.sentiment.polarity
    
    async def analyze_with_finbert(self, text: str) -> Dict:
        """Analyze sentiment using FinBERT"""
        if not self.finbert_pipeline:
            return None
            
        try:
            # Truncate text if too long
            max_length = 512
            if len(text) > max_length:
                text = text[:max_length]
            
            result = self.finbert_pipeline(text)[0]
            
            # Map FinBERT labels to scores
            label_mapping = {
                "positive": 1.0,
                "neutral": 0.0,
                "negative": -1.0
            }
            
            return {
                "label": result["label"].lower(),
                "score": label_mapping.get(result["label"].lower(), 0.0),
                "confidence": result["score"]
            }
            
        except Exception as e:
            logger.error(f"FinBERT analysis failed: {str(e)}")
            return None
    
    def get_sentiment_label(self, score: float) -> SentimentScore:
        """Convert numerical score to sentiment label"""
        if score >= 0.6:
            return SentimentScore.VERY_POSITIVE
        elif score >= 0.2:
            return SentimentScore.POSITIVE
        elif score >= -0.2:
            return SentimentScore.NEUTRAL
        elif score >= -0.6:
            return SentimentScore.NEGATIVE
        else:
            return SentimentScore.VERY_NEGATIVE
    
    async def comprehensive_analysis(self, text: str, use_finbert: bool = True) -> Dict:
        """Perform comprehensive sentiment analysis using multiple models"""
        
        # VADER Analysis
        vader_result = self.analyze_with_vader(text)
        
        # TextBlob Analysis
        textblob_score = self.analyze_with_textblob(text)
        
        # FinBERT Analysis
        finbert_result = None
        if use_finbert and self.finbert_pipeline:
            finbert_result = await self.analyze_with_finbert(text)
        
        # Ensemble scoring
        scores = [vader_result['compound'], textblob_score]
        if finbert_result:
            scores.append(finbert_result['score'])
        
        # Weighted average (FinBERT gets higher weight if available)
        if finbert_result:
            final_score = (vader_result['compound'] * 0.3 + 
                         textblob_score * 0.2 + 
                         finbert_result['score'] * 0.5)
            confidence = finbert_result['confidence']
        else:
            final_score = (vader_result['compound'] * 0.6 + textblob_score * 0.4)
            confidence = abs(vader_result['compound'])
        
        return {
            "sentiment_score": final_score,
            "sentiment_label": self.get_sentiment_label(final_score),
            "confidence": confidence,
            "finbert_score": finbert_result,
            "vader_score": vader_result,
            "textblob_score": textblob_score
        }

class SocialDataCollector:
    """Collect data from social media platforms"""
    
    def __init__(self):
        self.twitter_client = None
        self.reddit_client = None
        self.http_client = None
    
    async def initialize_apis(self):
        """Initialize social media API clients"""
        try:
            # Twitter API v2
            twitter_bearer = os.getenv('TWITTER_BEARER_TOKEN')
            if twitter_bearer:
                self.twitter_client = tweepy.Client(bearer_token=twitter_bearer)
            
            # Reddit API
            reddit_client_id = os.getenv('REDDIT_CLIENT_ID')
            reddit_secret = os.getenv('REDDIT_CLIENT_SECRET')
            reddit_user_agent = os.getenv('REDDIT_USER_AGENT', 'AILYDIAN-SentimentBot/1.0')
            
            if reddit_client_id and reddit_secret:
                self.reddit_client = praw.Reddit(
                    client_id=reddit_client_id,
                    client_secret=reddit_secret,
                    user_agent=reddit_user_agent
                )
            
            self.http_client = AsyncClient(timeout=30.0)
            logger.info("Social media APIs initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize APIs: {str(e)}")
    
    async def collect_twitter_mentions(self, symbol: str, limit: int = 100) -> List[SocialMention]:
        """Collect Twitter mentions for a symbol"""
        mentions = []
        
        if not self.twitter_client:
            logger.warning("Twitter API not available")
            return mentions
        
        try:
            query = f"${symbol} OR #{symbol} -is:retweet lang:en"
            tweets = tweepy.Paginator(
                self.twitter_client.search_recent_tweets,
                query=query,
                tweet_fields=['created_at', 'author_id', 'public_metrics', 'text'],
                max_results=min(100, limit)
            ).flatten(limit=limit)
            
            for tweet in tweets:
                mention = SocialMention(
                    id=tweet.id,
                    text=tweet.text,
                    author=str(tweet.author_id),
                    timestamp=tweet.created_at,
                    source=DataSource.TWITTER,
                    symbol=symbol,
                    engagement={
                        'likes': tweet.public_metrics['like_count'],
                        'retweets': tweet.public_metrics['retweet_count'],
                        'replies': tweet.public_metrics['reply_count']
                    },
                    url=f"https://twitter.com/x/status/{tweet.id}"
                )
                mentions.append(mention)
                
        except Exception as e:
            logger.error(f"Twitter collection failed: {str(e)}")
        
        return mentions
    
    async def collect_reddit_mentions(self, symbol: str, limit: int = 100) -> List[SocialMention]:
        """Collect Reddit mentions for a symbol"""
        mentions = []
        
        if not self.reddit_client:
            logger.warning("Reddit API not available")
            return mentions
        
        try:
            # Search in multiple subreddits
            subreddits = ['investing', 'stocks', 'SecurityAnalysis', 'ValueInvesting', 'StockMarket']
            
            for subreddit_name in subreddits:
                subreddit = self.reddit_client.subreddit(subreddit_name)
                
                # Search for symbol mentions
                for submission in subreddit.search(symbol, limit=limit//len(subreddits)):
                    mention = SocialMention(
                        id=submission.id,
                        text=f"{submission.title} {submission.selftext}"[:1000],
                        author=str(submission.author),
                        timestamp=datetime.fromtimestamp(submission.created_utc),
                        source=DataSource.REDDIT,
                        symbol=symbol,
                        engagement={
                            'upvotes': submission.score,
                            'comments': submission.num_comments
                        },
                        url=submission.url
                    )
                    mentions.append(mention)
                    
        except Exception as e:
            logger.error(f"Reddit collection failed: {str(e)}")
        
        return mentions
    
    async def collect_stocktwits_mentions(self, symbol: str, limit: int = 100) -> List[SocialMention]:
        """Collect StockTwits mentions for a symbol"""
        mentions = []
        
        if not self.http_client:
            return mentions
        
        try:
            url = f"https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json"
            response = await self.http_client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get('messages', [])
                
                for message in messages[:limit]:
                    mention = SocialMention(
                        id=str(message['id']),
                        text=message['body'],
                        author=message['user']['username'],
                        timestamp=datetime.strptime(message['created_at'], '%Y-%m-%dT%H:%M:%SZ'),
                        source=DataSource.STOCKTWITS,
                        symbol=symbol,
                        engagement={
                            'likes': message.get('likes', {}).get('total', 0)
                        },
                        url=f"https://stocktwits.com/{message['user']['username']}/message/{message['id']}"
                    )
                    mentions.append(mention)
                    
        except Exception as e:
            logger.error(f"StockTwits collection failed: {str(e)}")
        
        return mentions

# Global instances
sentiment_engine = SentimentEngine()
social_collector = SocialDataCollector()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global redis_client
    
    try:
        # Initialize Redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis connection failed: {str(e)}")
    
    # Initialize sentiment models
    await sentiment_engine.initialize_finbert()
    
    # Initialize social media APIs
    await social_collector.initialize_apis()
    
    logger.info("AILYDIAN Social Sentiment Analysis service started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global redis_client
    
    if redis_client:
        await redis_client.close()
    
    if social_collector.http_client:
        await social_collector.http_client.aclose()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "social-sentiment",
        "version": "1.0.0",
        "finbert_available": sentiment_engine.finbert_pipeline is not None,
        "redis_available": redis_client is not None
    }

# Sentiment analysis endpoints
@app.post("/analyze", response_model=SentimentAnalysisResponse)
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """Analyze sentiment of a single text"""
    try:
        result = await sentiment_engine.comprehensive_analysis(
            request.text, 
            request.use_finbert
        )
        
        return SentimentAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-bulk")
async def analyze_bulk_sentiment(request: BulkSentimentRequest):
    """Analyze sentiment of multiple texts"""
    try:
        results = []
        
        for text in request.texts:
            result = await sentiment_engine.comprehensive_analysis(
                text, 
                request.use_finbert
            )
            results.append(result)
        
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Bulk sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collect-social")
async def collect_social_mentions(request: SocialDataRequest):
    """Collect social media mentions for a symbol"""
    try:
        all_mentions = []
        
        # Collect from requested sources
        tasks = []
        
        if DataSource.TWITTER in request.sources:
            tasks.append(social_collector.collect_twitter_mentions(request.symbol, request.limit))
        
        if DataSource.REDDIT in request.sources:
            tasks.append(social_collector.collect_reddit_mentions(request.symbol, request.limit))
        
        if DataSource.STOCKTWITS in request.sources:
            tasks.append(social_collector.collect_stocktwits_mentions(request.symbol, request.limit))
        
        # Execute all collection tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_mentions.extend(result)
        
        # Filter by time range
        cutoff_time = datetime.utcnow() - timedelta(hours=request.hours_back)
        filtered_mentions = [
            mention for mention in all_mentions 
            if mention.timestamp >= cutoff_time
        ]
        
        # Sort by timestamp (newest first)
        filtered_mentions.sort(key=lambda x: x.timestamp, reverse=True)
        
        return {
            "mentions": filtered_mentions[:request.limit],
            "total_collected": len(all_mentions),
            "filtered_count": len(filtered_mentions),
            "sources_used": request.sources,
            "symbol": request.symbol
        }
        
    except Exception as e:
        logger.error(f"Social data collection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sentiment-trend")
async def analyze_sentiment_trend(request: TrendAnalysisRequest):
    """Analyze sentiment trends for a symbol over time"""
    try:
        # Collect recent social mentions
        social_request = SocialDataRequest(
            symbol=request.symbol,
            sources=[DataSource.TWITTER, DataSource.REDDIT, DataSource.STOCKTWITS],
            limit=1000,
            hours_back=request.days_back * 24
        )
        
        mentions_response = await collect_social_mentions(social_request)
        mentions = mentions_response["mentions"]
        
        # Analyze sentiment for each mention
        sentiment_data = []
        
        for mention in mentions:
            result = await sentiment_engine.comprehensive_analysis(mention.text)
            
            sentiment_data.append({
                "timestamp": mention.timestamp,
                "sentiment_score": result["sentiment_score"],
                "sentiment_label": result["sentiment_label"],
                "source": mention.source,
                "engagement": mention.engagement
            })
        
        # Create time series data
        df = pd.DataFrame(sentiment_data)
        
        if len(df) > 0:
            # Group by day and calculate averages
            df['date'] = pd.to_datetime(df['timestamp']).dt.date
            daily_sentiment = df.groupby('date').agg({
                'sentiment_score': ['mean', 'std', 'count'],
                'source': 'count'
            }).round(4)
            
            # Calculate trend metrics
            trend_data = daily_sentiment['sentiment_score']['mean'].values
            trend_direction = "positive" if len(trend_data) > 1 and trend_data[-1] > trend_data[0] else "negative"
            
            return {
                "symbol": request.symbol,
                "period_days": request.days_back,
                "total_mentions": len(mentions),
                "average_sentiment": float(df['sentiment_score'].mean()),
                "sentiment_volatility": float(df['sentiment_score'].std()),
                "trend_direction": trend_direction,
                "daily_data": daily_sentiment.to_dict(),
                "source_breakdown": df.groupby('source')['sentiment_score'].mean().to_dict()
            }
        
        else:
            return {
                "symbol": request.symbol,
                "period_days": request.days_back,
                "total_mentions": 0,
                "message": "No social mentions found for the specified period"
            }
        
    except Exception as e:
        logger.error(f"Sentiment trend analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background tasks for data collection
@app.post("/start-monitoring")
async def start_symbol_monitoring(background_tasks: BackgroundTasks, symbol: str):
    """Start background monitoring for a symbol"""
    
    async def monitor_symbol():
        """Background task to continuously monitor sentiment"""
        while True:
            try:
                # Collect recent mentions
                social_request = SocialDataRequest(
                    symbol=symbol,
                    sources=[DataSource.TWITTER, DataSource.REDDIT, DataSource.STOCKTWITS],
                    limit=100,
                    hours_back=1
                )
                
                mentions_response = await collect_social_mentions(social_request)
                
                # Store in Redis if available
                if redis_client:
                    cache_key = f"sentiment_monitor:{symbol}"
                    await redis_client.setex(
                        cache_key, 
                        3600,  # 1 hour expiry
                        json.dumps(mentions_response, default=str)
                    )
                
                # Wait before next collection
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Monitoring failed for {symbol}: {str(e)}")
                await asyncio.sleep(600)  # Wait 10 minutes on error
    
    background_tasks.add_task(monitor_symbol)
    
    return {
        "message": f"Started monitoring sentiment for {symbol}",
        "symbol": symbol,
        "monitor_interval": "5 minutes"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
