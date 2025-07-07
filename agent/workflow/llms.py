import os
from dotenv import load_dotenv
load_dotenv()

# Now the API key will be loaded from the .env file if present
# os.environ['OPENAI_API_KEY'] should be set in the environment or .env file

from langchain_openai import ChatOpenAI

reason_llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

plan_llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

act_llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

