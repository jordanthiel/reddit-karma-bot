from platforms import reddit
import time
import random
from datetime import datetime, timedelta

# Configuration
MIN_ROTATION_INTERVAL_MIN = 2
MAX_ROTATION_INTERVAL_MIN = 30
BREAK_AFTER_ROUNDS = 10
BREAK_DURATION_HOURS = 3

# Define the subreddits you want the bot to comment on
SUBREDDITS = ["buildinpublic", "Entrepreneur", "SaaS", "GolfSwing", "golf", "SideProject", "IndieHackers"]

# Track rounds for break scheduling
round_count = 0

while True:
    try:
        print("\n🔁 Running Reddit...")
        # Randomize the order of subreddits
        randomized_subreddits = SUBREDDITS.copy()
        random.shuffle(randomized_subreddits)
        print(f"🎲 Randomized subreddit order: {randomized_subreddits}")
        
        # Pass the randomized array of subreddits to the bot
        reddit.run(subreddits=randomized_subreddits)
    except Exception as e:
        print(f"Reddit error: {e}")

    time.sleep(random.randint(60, 120))

    # try:
    #     print("\n🔁 Running Twitter...")
    #     twitter.run()
    # except Exception as e:
    #     print(f"Twitter error: {e}")

    # Increment round counter
    round_count += 1
    
    # Check if it's time for a break
    if round_count >= BREAK_AFTER_ROUNDS:
        print(f"\n🛌 Taking a {BREAK_DURATION_HOURS}-hour break after {round_count} rounds...")
        print(f"⏰ Break started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"⏰ Break will end at: {(datetime.now() + timedelta(hours=BREAK_DURATION_HOURS)).strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Take the break
        time.sleep(BREAK_DURATION_HOURS * 3600)  # Convert hours to seconds
        
        print(f"✅ Break completed! Resuming normal operations...")
        round_count = 0  # Reset round counter
    else:
        # Random rotation interval between 2-30 minutes
        rotation_interval = random.randint(MIN_ROTATION_INTERVAL_MIN, MAX_ROTATION_INTERVAL_MIN)
        sleep_time = rotation_interval * 60
        print(f"\n⏳ Waiting {rotation_interval} minutes before next rotation... (Round {round_count}/{BREAK_AFTER_ROUNDS})")
        time.sleep(sleep_time)
