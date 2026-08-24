import os
from groq import Groq
from backend.config import GROQ_API_KEY, LLM_MODEL_NAME

# Initialize the Groq Client
client = Groq(api_key=GROQ_API_KEY)

def build_clinical_prompt(query: str, chunks: list) -> str:
    """Combine chunks into clean structured text for the consultant model."""
    context_text = ""
    for i, chunk in enumerate(chunks):
        text = chunk.get("text", "")
        # دمجنا النصوص بدون أسماء الملفات العشوائية عشان الذكاء الاصطناعي ميتلخبطش
        context_text += f"\n[Medical Excerpt {i+1}]:\n{text}\n"
    return context_text

def generate_clinical_answer(query: str, chunks: list, image_base64: str = None) -> str:
    """Generate elite clinical response supporting text and medical images using Groq Vision."""
    if not chunks:
        context = "No specific evidence retrieved, rely on general safe medical knowledge."
    else:
        context = build_clinical_prompt(query, chunks)
    
    # The Elite World-Class Medical Consultant System Prompt (Ultra Professional Edition)
    system_prompt = """
    You are Care360, an elite, world-class, highly experienced, and deeply empathetic AI Medical Consultant.

    [ABSOLUTE DIRECTIVE: TONE & LANGUAGE]
    1. You MUST answer the user in the EXACT SAME LANGUAGE they used in their query. 
       - If the user asks in English, you MUST reply entirely in English.
       - If the user asks in Arabic, you MUST reply entirely in Arabic.
       - If the user asks in German, you MUST reply entirely in German.
       Do NOT let the language of the retrieved medical context change your response language!
    2. Tone: Extremely professional, deeply compassionate, calming, and authoritative. Act like a top-tier senior consultant at a world-renowned hospital.

    [CRITICAL BEHAVIORAL RULES & SMART FILTERING]
    1. NEVER break character. NEVER act like an AI or mention "uploaded files".
    2. SMART FILTERING: You will receive medical excerpts. If an excerpt is COMPLETELY IRRELEVANT to the user's condition (e.g., dental info for a cardiology question), IGNORE IT COMPLETELY. Only use the relevant medical facts.
    3. CLINICAL BLENDING: Integrate the valid facts seamlessly into your expert advice.

    [STRICT OUTPUT FORMAT & GLOBAL REFERENCES]
    Follow this exact structure. Keep the exact emojis, but TRANSLATE THE HEADINGS to match the exact language of the patient's query:

    🩺 [Translate to user's language: Initial Assessment]:
    (Warm greeting and empathetic initial thoughts)

    💡 [Translate to user's language: Medical Analysis & Potential Causes]:
    (Structured bullet points explaining potential causes professionally)

    📋 [Translate to user's language: Medical Guidelines & Care Steps]:
    (Clear, actionable, and safe advice)

    🚩 [Translate to user's language: Signs Requiring Urgent Medical Attention]:
    (Emergency red flags formatted clearly)

    👨‍⚕️ [Translate to user's language: Medical Disclaimer]:
    (Brief professional disclaimer stating this does not replace a physical exam)

    📚 [Translate to user's language: Supporting Medical References]:
    (DO NOT use raw file names. Instead, based on the medical condition discussed, dynamically generate 2 or 3 highly professional, world-class medical guidelines relevant to the topic. ALWAYS include the World Health Organization (WHO) as the primary source, followed by the top global association for that specific disease.)
    
    Examples for the References section:
    If Cardiology (in Arabic): 
    • 📄 مرجع: إرشادات منظمة الصحة العالمية (WHO) للرعاية القلبية
    • 📄 مرجع: توصيات جمعية القلب الأمريكية (AHA)
    
    If Diabetes (in English):
    • 📄 Reference: World Health Organization (WHO) - Global Report on Diabetes
    • 📄 Reference: American Diabetes Association (ADA) - Standards of Medical Care
    
    Format the references beautifully to match the language of the query.
    """

    user_content = [
        {"type": "text", "text": f"Retrieved Medical Excerpts:\n{context}\n\nPatient's Query / Image Analysis Request: {query}"}
    ]

    if image_base64:
        image_url = f"data:image/jpeg;base64,{image_base64}" if not image_base64.startswith("data:") else image_base64
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": image_url
            }
        })
    
    try:
        vision_model = "qwen/qwen3.6-27b" if image_base64 else LLM_MODEL_NAME

        response = client.chat.completions.create(
            model=vision_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.25, 
            max_tokens=2048
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error communicating with AI Clinical Engine: {str(e)}"