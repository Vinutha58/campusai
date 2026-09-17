from app.db.mongodb import get_database

OPENAI_MODEL = "gpt-4o-mini"
GEMINI_MODEL = "gemini-2.0-flash"
CLAUDE_MODEL = "claude-haiku-4-5-20251001"


class AIError(Exception):
    pass


async def _get_ai_config() -> dict:
    db = get_database()
    config = await db.settings.find_one({"_id": "ai_config"})
    if not config or not config.get("api_key"):
        raise AIError(
            "AI isn't configured yet. Ask an administrator to add a provider API key in AI Configuration."
        )
    return config


async def generate_reply(messages: list[dict], system_prompt: str) -> str:
    config = await _get_ai_config()
    provider = config["provider"]
    api_key = config["api_key"]

    if provider not in ("openai", "gemini", "claude"):
        raise AIError(f"Unknown AI provider configured: {provider}")

    try:
        if provider == "openai":
            return await _call_openai(api_key, messages, system_prompt)
        if provider == "gemini":
            return await _call_gemini(api_key, messages, system_prompt)
        return await _call_claude(api_key, messages, system_prompt)
    except AIError:
        raise
    except Exception as e:
        raise AIError(
            f"The AI provider ({provider}) couldn't be reached: {e}. Check the API key in AI Configuration."
        ) from e


async def _call_openai(api_key: str, messages: list[dict], system_prompt: str) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "system", "content": system_prompt}, *messages],
    )
    return response.choices[0].message.content or ""


async def _call_claude(api_key: str, messages: list[dict], system_prompt: str) -> str:
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return "".join(block.text for block in response.content if block.type == "text")


async def _call_gemini(api_key: str, messages: list[dict], system_prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_prompt)
    history = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]} for m in messages[:-1]
    ]
    chat = model.start_chat(history=history)
    response = await chat.send_message_async(messages[-1]["content"])
    return response.text
