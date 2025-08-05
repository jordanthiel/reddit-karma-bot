from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path("../bot_metrics.db")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/metrics")
def get_metrics(
    platform: Optional[str] = None,
    action_type: Optional[str] = None,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    query = "SELECT platform, action_type, COUNT(*) FROM actions WHERE 1=1"
    params = []

    if platform:
        query += " AND platform = ?"
        params.append(platform)
    if action_type:
        query += " AND action_type = ?"
        params.append(action_type)
    if from_date:
        query += " AND timestamp >= ?"
        params.append(from_date)
    if to_date:
        query += " AND timestamp <= ?"
        params.append(to_date)

    query += " GROUP BY platform, action_type"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    data = {}
    for p, a, count in rows:
        data.setdefault(p, {})[a] = count
    return data

@app.get("/comments")
def get_comments(
    platform: Optional[str] = None,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: Optional[int] = Query(50)
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    query = """
    SELECT 
        id,
        platform,
        timestamp,
        post_title_or_text,
        action_type,
        comment_text,
        success,
        error,
        subreddit_name
    FROM actions 
    WHERE action_type IN ('comment_posted', 'comment_generated')
    """
    params = []

    if platform:
        query += " AND platform = ?"
        params.append(platform)
    if from_date:
        query += " AND timestamp >= ?"
        params.append(from_date)
    if to_date:
        query += " AND timestamp <= ?"
        params.append(to_date)

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    comments = []
    for row in rows:
        id, platform, timestamp, post_text, action_type, comment_text, success, error, subreddit_name = row
        
        comments.append({
            "id": id,
            "platform": platform,
            "timestamp": timestamp,
            "post_title": post_text,
            "subreddit": subreddit_name or "Unknown",
            "action_type": action_type,
            "comment_text": comment_text,
            "success": bool(success),
            "error": error
        })
    
    return comments
