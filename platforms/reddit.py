from playwright.sync_api import sync_playwright
import os
from dotenv import load_dotenv
from content_generator import generate_comment
from playwright_utils import wait_random
import sys
sys.path.append('../backend')
from backend.metrics_logger import log_action
import sqlite3
from pathlib import Path

load_dotenv()

def has_commented_on_post(post_title, subreddit):
    """Check if we've already commented on this post"""
    try:
        # Get the project root directory (two levels up from platforms/)
        project_root = Path(__file__).parent.parent
        db_path = project_root / "bot_metrics.db"
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute('''SELECT COUNT(*) FROM actions 
                     WHERE post_title_or_text = ? 
                     AND subreddit_name = ? 
                     AND action_type IN ('comment_posted', 'comment_generated')
                     AND success = 1''', (post_title, subreddit))
        count = c.fetchone()[0]
        conn.close()
        return count > 0
    except Exception as e:
        print(f"⚠️ Error checking duplicate comments: {e}")
        return False

def run(subreddits=None):
    print("🧭 Reddit bot running...")
    
    # Default to AskReddit if no subreddits provided
    if subreddits is None:
        subreddits = ["AskReddit"]
    
    print(f"📋 Targeting subreddits: {subreddits}")
    
    # # Uncomment if you want to log bot startup
    # log_action(
    #     platform="Reddit",
    #     post_text="Bot startup",
    #     action_type="bot_started",
    #     success=True
    # )
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Login
        print("🔐 Logging into Reddit...")
        page.goto("https://www.reddit.com/login/")
        
        # Wait for page to load completely
        page.wait_for_load_state("networkidle")
        
        # Handle potential cookie consent or overlays
        try:
            # Look for common cookie consent buttons
            cookie_selectors = [
                "button[data-testid='cookie-banner-accept']",
                "button:has-text('Accept')",
                "button:has-text('Accept All')",
                "button:has-text('I Accept')"
            ]
            for selector in cookie_selectors:
                try:
                    if page.locator(selector).is_visible(timeout=2000):
                        page.click(selector)
                        print("🍪 Accepted cookies")
                        break
                except:
                    continue
        except:
            pass
        
        # Wait for login form to be ready
        page.wait_for_selector("input[name='username']", timeout=60000)
        
        # Fill login form with human-like delays
        print("📝 Filling login form...")
        page.fill("input[name='username']", os.getenv("REDDIT_USERNAME"))
        wait_random(1, 2)
        page.fill("input[name='password']", os.getenv("REDDIT_PASSWORD"))
        wait_random(1, 2)
        
        # Submit login form
        page.click("button:has-text('Log In')")
        
        # Wait for login to complete
        print("⏳ Waiting for login to complete...")
        try:
            page.wait_for_url("https://www.reddit.com/", timeout=30000)
            print("✅ Successfully logged in")
        except:
            print("⚠️ Login might have succeeded, continuing...")
        
        print("⏱️ Adding delay after login...")
        wait_random(3, 5)

        # Process each subreddit
        for subreddit in subreddits:
            try:
                print(f"\n🎯 Processing subreddit: r/{subreddit}")
                
                # Go to the subreddit and find a post
                print(f"🔍 Finding a post on r/{subreddit}...")
                print(f"🌐 Navigating to https://www.reddit.com/r/{subreddit}/")
                page.goto(f"https://www.reddit.com/r/{subreddit}/")
                print("⏳ Waiting for page to load...")
                try:
                    page.wait_for_load_state("networkidle", timeout=30000)
                    print("✅ Page loaded successfully")
                except:
                    print("⚠️ Network idle timeout, but continuing...")
                print("⏱️ Adding random delay...")
                wait_random(2, 4)
                
                # Verify current URL
                current_url = page.url
                print(f"📍 Current URL: {current_url}")
                if f"reddit.com/r/{subreddit}" not in current_url:
                    print(f"❌ Failed to navigate to r/{subreddit}. Current URL: {current_url}")
                    print("This might be due to a redirect after login or a change in Reddit's navigation.")
                    print("Skipping this subreddit and continuing to the next one.")
                    continue
                
                print(f"✅ Successfully navigated to r/{subreddit}: {current_url}")
                
                # Wait for posts to load
                page.wait_for_selector("shreddit-post", timeout=30000)
                wait_random(2, 3)
                
                # Find posts to comment on - collect top 5 posts
                # Look for article tags containing posts
                articles = page.query_selector_all("article")
                print(f"Found {len(articles)} article elements")
                
                # Collect top 5 suitable posts
                suitable_posts = []
                for article in articles:
                    try:
                        # Check if this article contains a shreddit-post
                        shreddit_post = article.query_selector("shreddit-post")
                        if not shreddit_post:
                            continue
                        
                        # Get the aria-label to see the post content
                        aria_label = article.get_attribute("aria-label")
                        if aria_label:
                            print(f"Found post: {aria_label}")
                        
                        # Find the title link within the shreddit-post
                        title_link = shreddit_post.query_selector("a[slot='title']")
                        if not title_link:
                            # Fallback to any link within the shreddit-post
                            title_link = shreddit_post.query_selector("a")
                        
                        if title_link and title_link.is_visible():
                            href = title_link.get_attribute("href")
                            if href and "/comments/" in href:
                                # Get post title to check for duplicates
                                post_title = title_link.inner_text().strip()
                                if not post_title:
                                    # Try to find title in child elements
                                    title_element = title_link.locator("h3, span, div").first
                                    if title_element:
                                        post_title = title_element.inner_text().strip()
                                
                                # Check if we've already commented on this post
                                if post_title and has_commented_on_post(post_title, subreddit):
                                    print(f"⏭️ Skipping post (already commented): {post_title[:50]}...")
                                    continue
                                
                                suitable_posts.append(title_link)
                                print(f"✅ Found suitable post {len(suitable_posts)}: {href}")
                                
                                # Stop collecting after finding 5 posts
                                if len(suitable_posts) >= 5:
                                    break
                                
                    except Exception as e:
                        print(f"Error processing article: {e}")
                        continue
                
                # Randomly select from top 5 posts
                if suitable_posts:
                    import random
                    selected_index = random.randint(0, min(len(suitable_posts) - 1, 4))
                    post = suitable_posts[selected_index]
                    print(f"🎲 Randomly selected post {selected_index + 1} from top {len(suitable_posts)} posts")
                else:
                    print(f"⚠️ No suitable posts found in r/{subreddit} (all may have been commented on)")
                    
                    # Log that no new posts were found
                    log_action(
                        platform="Reddit",
                        post_text=f"No new posts found in r/{subreddit}",
                        action_type="no_new_posts_found",
                        success=False,
                        subreddit_name=subreddit
                    )
                    
                    post = None
                
                if not post:
                    print(f"❌ No suitable post found in r/{subreddit}")
                    
                    # Uncomment if you want to log no post found
                    # log_action(
                    #     platform="Reddit",
                    #     post_text=f"No post found in r/{subreddit}",
                    #     action_type="no_post_found",
                    #     success=False
                    # )
                    
                    continue
                    
                # Get post title from the link or its child elements
                try:
                    post_title = post.inner_text()
                    if not post_title.strip():
                        # Try to find title in child elements
                        title_element = post.locator("h3, span, div").first
                        if title_element:
                            post_title = title_element.inner_text()
                except:
                    post_title = "Unknown post"
                    
                print(f"🧠 Post found in r/{subreddit}: {post_title}")

                # Uncomment if you want to log post found
                # log_action(
                #     platform="Reddit",
                #     post_text=post_title,
                #     action_type="post_found",
                #     success=True
                # )

                # Get the post URL and navigate directly instead of clicking
                post_url = post.get_attribute("href")
                if post_url:
                    if not post_url.startswith("http"):
                        post_url = "https://www.reddit.com" + post_url
                    print(f"🌐 Navigating to post: {post_url}")
                    page.goto(post_url)
                    try:
                        page.wait_for_load_state("networkidle", timeout=30000)
                        print("✅ Post page loaded successfully")
                    except:
                        print("⚠️ Post page load timeout, but continuing...")
                    wait_random(2, 4)
                    
                    # Try to upvote the post
                    print("👍 Attempting to upvote the post...")
                    upvote_selectors = [
                        "button[upvote]",
                        "button[aria-pressed='false']",
                        "button:has-text('Upvote')",
                        "button[class*='upvote']",
                        "button[class*='button-secondary']"
                    ]
                    
                    upvoted = False
                    for selector in upvote_selectors:
                        try:
                            print(f"🔍 Looking for upvote button: {selector}")
                            upvote_buttons = page.locator(selector).all()
                            print(f"  Found {len(upvote_buttons)} potential upvote buttons")
                            
                            for i, button in enumerate(upvote_buttons):
                                try:
                                    if button.is_visible(timeout=3000):
                                        # Check if it's actually an upvote button by looking for upvote-related text or attributes
                                        button_text = button.inner_text().lower()
                                        button_aria = button.get_attribute("aria-pressed")
                                        
                                        if ("upvote" in button_text or 
                                            button_aria == "false" or 
                                            "upvote" in str(button.get_attribute("class") or "").lower()):
                                            
                                            print(f"  ✅ Found visible upvote button: {selector} (element {i})")
                                            button.click()
                                            print("👍 Post upvoted successfully!")
                                            upvoted = True
                                            wait_random(1, 2)
                                            break
                                        else:
                                            print(f"  ⚠️ Button {i} found but doesn't appear to be upvote button")
                                    else:
                                        print(f"  ⚠️ Button {i} found but not visible")
                                except Exception as e:
                                    print(f"  ❌ Error with button {i}: {e}")
                                    continue
                            
                            if upvoted:
                                break
                        except Exception as e:
                            print(f"❌ Failed with upvote selector {selector}: {e}")
                            continue
                    
                    if not upvoted:
                        print("⚠️ Could not find or click upvote button, but continuing...")
                        # Log failed upvote attempt
                        log_action(
                            platform="Reddit",
                            post_text=post_title,
                            action_type="upvote_failed",
                            success=False,
                            error="Could not find or click upvote button",
                            subreddit_name=subreddit
                        )
                    else:
                        # Log successful upvote
                        log_action(
                            platform="Reddit",
                            post_text=post_title,
                            action_type="post_upvoted",
                            success=True,
                            subreddit_name=subreddit
                        )
                else:
                    print("❌ Could not get post URL")
                    continue

                comment = generate_comment(post_title, platform="Reddit")
                print(f"💬 Comment: {comment}")
                

                # Uncomment if you want to log comment generation
                # log_action(
                #     platform="Reddit",
                #     post_text=post_title,
                #     action_type="comment_generated",
                #     success=True,
                #     comment_text=comment
                # )

                # Wait for the page to fully load and stabilize
                print("⏳ Waiting for comment interface to load...")
                wait_random(3, 5)
                
                # Try to scroll to the comment area first
                try:
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    wait_random(1, 2)
                except:
                    pass

                # Look specifically for the main comment input area (not individual comment metadata)
                print("🔍 Looking for main comment input area...")
                main_comment_selectors = [
                    "faceplate-textarea-input[data-testid='trigger-button']",
                    "faceplate-textarea-input[placeholder*='Join the conversation']",
                    "div[data-testid='trigger-button']",
                    "textarea[placeholder*='Join the conversation']",
                    "input[placeholder*='Join the conversation']"
                ]
                
                trigger_button = None
                for selector in main_comment_selectors:
                    try:
                        print(f"🔍 Trying main comment selector: {selector}")
                        elements = page.locator(selector).all()
                        print(f"  Found {len(elements)} elements with selector: {selector}")
                        
                        for i, element in enumerate(elements):
                            try:
                                if element.is_visible(timeout=2000):
                                    print(f"  ✅ Found visible main comment input: {selector} (element {i})")
                                    trigger_button = element
                                    break
                                else:
                                    print(f"  ⚠️ Element {i} found but not visible")
                            except Exception as e:
                                print(f"  ❌ Error with element {i}: {e}")
                                continue
                        
                        if trigger_button:
                            break
                    except Exception as e:
                        print(f"❌ Failed with main comment selector {selector}: {e}")
                        continue
                
                # Click the trigger button if found
                if trigger_button:
                    try:
                        print("🖱️ Clicking main comment input to trigger interface...")
                        trigger_button.click()
                        print("✅ Clicked comment trigger button")
                        wait_random(2, 3)
                        trigger_clicked = True
                    except Exception as e:
                        print(f"❌ Error clicking trigger button: {e}")
                else:
                    print("⚠️ Could not find main comment input, trying fallback...")
                    
                    # Try clicking in the comment area to trigger the interface
                    try:
                        print("🔍 Trying to click in comment area to trigger interface...")
                        # Look for any area that might be the comment section
                        comment_areas = page.locator("div[class*='comment'], div[class*='reply'], div[class*='textarea'], div[class*='input']").all()
                        print(f"Found {len(comment_areas)} potential comment areas")
                        
                        for i, area in enumerate(comment_areas):
                            try:
                                if area.is_visible(timeout=2000):
                                    print(f"Clicking in comment area {i}...")
                                    area.click()
                                    wait_random(1, 2)
                                    break
                            except:
                                continue
                    except Exception as e:
                        print(f"Error trying to click comment area: {e}")

                # Now try to find the comment field that should be visible
                print("🔍 Looking for comment field...")
                comment_selectors = [
                    "div[contenteditable='true'][role='textbox']",
                    "div[data-lexical-editor='true'][contenteditable='true']",
                    "div[role='textbox'][contenteditable='true']",
                    "div[contenteditable='true']",
                    "shreddit-composer div[contenteditable='true']",
                    "div[data-testid='comment-rich-text-editor'] div[contenteditable='true']",
                    "*[contenteditable='true']",
                    "div[role='textbox']"
                ]
                
                comment_field = None
                for selector in comment_selectors:
                    try:
                        print(f"🔍 Trying comment selector: {selector}")
                        elements = page.locator(selector).all()
                        print(f"  Found {len(elements)} elements with selector: {selector}")
                        
                        for i, field in enumerate(elements):
                            try:
                                # Wait for element to be present and visible
                                field.wait_for(timeout=5000)
                                
                                # Check if element is actually visible and clickable
                                if field.is_visible():
                                    print(f"✅ Found visible comment field with selector: {selector} (element {i})")
                                    comment_field = field
                                    break
                                else:
                                    print(f"⚠️ Element {i} found but not visible: {selector}")
                                    continue
                            except Exception as e:
                                print(f"❌ Error with element {i}: {e}")
                                continue
                        
                        if comment_field:
                            break
                    except Exception as e:
                        print(f"❌ Failed with comment selector {selector}: {e}")
                        continue
                
                if comment_field:
                    try:
                        # Try to focus the element first
                        comment_field.focus()
                        wait_random(1, 2)
                        
                        # Clear any existing content
                        comment_field.fill("")
                        wait_random(0.5, 1)
                        
                        # Type the comment character by character for human-like behavior
                        print("⌨️ Typing comment character by character...")
                        for char in comment:
                            comment_field.type(char)
                            # Random delay between characters (50-150ms)
                            wait_random(0.05, 0.15)
                        
                        print("📝 Comment typed successfully")
                        wait_random(1, 2)
                        
                        # Submit comment with better selectors
                        submit_selectors = [
                            "button[slot='submit-button']",
                            "button[type='submit']:has-text('Comment')",
                            "button:has-text('Comment')",
                            "button[data-testid='comment-submit']",
                            "button[type='submit']"
                        ]
                        
                        comment_posted = False
                        for selector in submit_selectors:
                            try:
                                print(f"🔍 Looking for submit button: {selector}")
                                submit_button = page.locator(selector).first
                                if submit_button.is_visible(timeout=5000):
                                    submit_button.click()
                                    print(f"✅ Reddit comment posted successfully on r/{subreddit}!")
                                    
                                    # Log successful comment posting
                                    log_action(
                                        platform="Reddit",
                                        post_text=post_title,
                                        action_type="comment_posted",
                                        success=True,
                                        comment_text=comment,
                                        subreddit_name=subreddit
                                    )
                                    
                                    comment_posted = True
                                    break
                            except Exception as e:
                                print(f"❌ Failed to click submit button {selector}: {e}")
                                continue
                        
                        if not comment_posted:
                            print("⚠️ Could not find or click submit button, but comment may have been posted")
                            
                            # Log failed comment posting
                            log_action(
                                platform="Reddit",
                                post_text=post_title,
                                action_type="comment_failed",
                                success=False,
                                comment_text=comment,
                                error="Could not find or click submit button",
                                subreddit_name=subreddit
                            )
                            
                    except Exception as e:
                        print(f"❌ Error interacting with comment field: {e}")
                        
                        # Log error
                        log_action(
                            platform="Reddit",
                            post_text=post_title,
                            action_type="comment_error",
                            success=False,
                            comment_text=comment,
                            error=str(e),
                            subreddit_name=subreddit
                        )
                else:
                    print("❌ Could not find comment field")
                    
                    # Log failure to find comment field
                    log_action(
                        platform="Reddit",
                        post_text=post_title,
                        action_type="comment_field_not_found",
                        success=False,
                        comment_text=comment,
                        error="Could not find comment field",
                        subreddit_name=subreddit
                    )
                
                # Add delay between subreddits
                wait_random(3, 5)
                print(f"✅ Completed processing r/{subreddit}")
                
            except Exception as e:
                print(f"❌ Error processing r/{subreddit}: {e}")
                # Log error for this subreddit
                log_action(
                    platform="Reddit",
                    post_text=f"Error processing r/{subreddit}",
                    action_type="subreddit_error",
                    success=False,
                    error=str(e),
                    subreddit_name=subreddit
                )
                continue
        
        wait_random(2, 4)
        browser.close()
