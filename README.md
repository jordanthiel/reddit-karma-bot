# Reddit Karma Bot

This is an automated engagement bot for Reddit, powered by GPT and Playwright. It tracks likes, comments, and follows in a SQLite database, and provides a real-time metrics dashboard built with React and FastAPI.

---

## ⚙️ Features

- ✅ Reddit automation with GPT replies
- ✅ Auto-upvote functionality
- ✅ Unified scheduler with randomized intervals
- ✅ Metrics tracking (SQLite database)
- ✅ React dashboard with filters (by platform and date)
- ✅ Real-time analytics and success rate tracking

  <img width="4388" height="1536" alt="image" src="https://github.com/user-attachments/assets/f9ec3b25-0040-4934-9533-066afbe8128d" />


---

## 🧰 Requirements

- Python 3.9+
- Node.js 14+
- OpenAI API key
- Reddit login credentials

---

## 🪜 Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd reddit-karma-bot
```

### 2. Set up Python environment

```bash
python -m venv redditBot
source redditBot/bin/activate  # On Windows: socialBot\Scripts\activate
pip install -r requirements.txt
```

Install Playwright dependencies:

```bash
playwright install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### 4. Start the backend API server

```bash
cd backend
uvicorn app:app --reload
```

The API will be available at: `http://localhost:8000`

### 5. Start the React dashboard

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at: `http://localhost:3000`

### 6. Run the engagement bot

In a new terminal (make sure you're in the root directory and virtual environment is activated):

```bash
<<<<<<< HEAD
=======
source redditBot/bin/activate
>>>>>>> f5c1f307f1a1087086f87c2c7831cd6a02e7602a
python main.py
```

This will start the Reddit automation with randomized intervals between 2-30 minutes, and includes automatic breaks after 10 rounds.

---

## 📊 Dashboard Features

Visit `http://localhost:3000` to access the real-time dashboard with:

- ✅ Platform-specific metrics
- ✅ Date range filtering
- ✅ Action type breakdown (comments, upvotes, etc.)
- ✅ Success rate tracking
- ✅ Detailed comment history
- ✅ Interactive charts and analytics

---

## 📂 Project Structure

```
reddit-karma-bot/
├── backend/            # FastAPI API server
│   ├── app.py         # API endpoints
│   └── metrics_logger.py
├── frontend/          # React dashboard
│   ├── src/
│   │   ├── App.jsx    # Main dashboard component
│   │   └── api.js     # API client
│   └── package.json
├── platforms/         # Platform automation
│   └── reddit.py     # Reddit automation logic
├── content_generator.py  # GPT content generation
├── playwright_utils.py   # Browser automation utilities
├── main.py           # Main bot scheduler
├── bot_metrics.db    # SQLite database (auto-created)
└── requirements.txt  # Python dependencies
```

---

## 🔧 Configuration

### Subreddits

Edit the `SUBREDDITS` list in `main.py` to target specific subreddits:

```python
SUBREDDITS = ["buildinpublic", "Entrepreneur", "SaaS", "SideProject", "IndieHackers"]
```

### Scheduling

The bot uses randomized intervals to avoid detection:
- Minimum interval: 2 minutes
- Maximum interval: 30 minutes
- Break after 10 rounds (3 hours)
- Randomized subreddit order each cycle

---

## 📈 Monitoring

The dashboard provides comprehensive monitoring:

- **Real-time metrics**: Track engagement actions as they happen
- **Success rates**: Monitor bot performance across platforms
- **Comment history**: Review all posted comments with full context
- **Error tracking**: Identify and debug failed actions
- **Analytics**: Visual charts showing engagement patterns

---

## ⚠️ Important Notes

- The bot includes randomized delays and breaks to avoid detection
- All actions are logged to the SQLite database for monitoring
- The dashboard shows real-time data from the API
- This does not comply with Reddit's terms of service and API guidelines so use at your own risk. I have not seen the bot get caught yet...

--- 

## 🚀 Next Steps

- [ ] Add support for additional platforms (Twitter, LinkedIn, Instagram, etc.)
- [ ] Add support for posting to subreddits
- [ ] Add more sophisticated content generation strategies

