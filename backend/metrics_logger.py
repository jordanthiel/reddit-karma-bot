import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path("bot_metrics.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        timestamp TEXT,
        post_title_or_text TEXT,
        action_type TEXT,
        comment_text TEXT,
        success INTEGER,
        error TEXT
    )''')
    conn.commit()
    conn.close()

def log_action(platform, post_text, action_type, success=True, comment_text=None, error=None, subreddit_name=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO actions (
        platform, timestamp, post_title_or_text, action_type,
        comment_text, success, error, subreddit_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', (
        platform,
        datetime.utcnow().isoformat(),
        post_text,
        action_type,
        comment_text,
        int(success),
        error,
        subreddit_name
    ))
    conn.commit()
    conn.close()

init_db()
