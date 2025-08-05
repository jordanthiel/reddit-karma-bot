import openai
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize the OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_comment(context: str, platform: str = "Reddit") -> str:
    prompt = f"Write a human sounding comment for this {platform} post:\n\n{context}\n\nThe tone should be really casual. Keep it less than 250 characters. Shorter the better. Keep it real, simplify grammar, stay away from fluf, use simple language"
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=150
    )
    return response.choices[0].message.content.strip()
