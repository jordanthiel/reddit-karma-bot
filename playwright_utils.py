import time
import random

def human_typing(page, selector, text, delay_range=(0.05, 0.15)):
    for char in text:
        current_value = page.eval_on_selector(selector, "el => el.value")
        page.fill(selector, current_value + char)
        time.sleep(random.uniform(*delay_range))

def wait_random(min_sec=2, max_sec=5):
    time.sleep(random.uniform(min_sec, max_sec))
