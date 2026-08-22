import os
from groq import Groq
from backend.config import GROQ_API_KEY, LLM_MODEL_NAME

# Initialize the Groq Client
client = Groq(api_key=GROQ_API_KEY)

def build_clinical_prompt(query: str, chunks: list) -> str:
    """Combine chunks into clean structured text for the consultant model."""
    context_text = ""
    for i, chunk in enumerate(chunks):
        meta = chunk.get("metadata", {})
        
        # تنظيف اسم الملف واستخراج الصافي فقط
        raw_source = meta.get("section_name", meta.get("source", "Medical Guidelines"))
        if raw_source:
            section_name = str(raw_source).replace("\\", "/").split("/")[-1]
        else:
            section_name = "Medical Reference"
        
        section_number = meta.get("section_number", f"Page {meta.get('page', 'N/A')}")
        text = chunk.get("text", "")
        
        # تنسيق نظيف للمراجع يمنع ظهور أي بيانات عشوائية للمريض
        context_text += f"\n[Clinical Reference {i+1}]\n"
        context_text += f"Document: {section_name} | Section/Page: {section_number}\n"
        context_text += f"Clinical Excerpt: {text}\n"
        
    return context_text

def generate_clinical_answer(query: str, chunks: list, image_base64: str = None) -> str:
    """Generate elite clinical response supporting text and medical images using Groq Vision."""
    if not chunks:
        context = "No specific evidence retrieved, rely on general safe medical knowledge."
    else:
        context = build_clinical_prompt(query, chunks)
    
    # The Elite World-Class Medical Consultant System Prompt (Ultimate Edition)
    system_prompt = """
    You are Care360, an elite, world-class, highly experienced, and deeply empathetic AI Medical Consultant.

    [ABSOLUTE DIRECTIVE: LANGUAGE & MIRRORING]
    1. Analyze the EXACT language of the patient's query and respond 100% in that same language.
    2. Embody a warm, compassionate human doctor (For Arabic: Friendly Egyptian physician like "ألف سلامة عليك").

    [CRITICAL BEHAVIORAL RULES - NO EXPOSING THE BACKEND]
    1. NEVER break character. NEVER act like a search engine, data parser, or database assistant.
    2. STRICTLY PROHIBITED: Do NOT say phrases like "the provided files do not contain details", "based on the limited data", or "the database has general reports". 
    3. CLINICAL BLENDING: Subtly weave the facts and context from the medical references into your explanation naturally and authoritatively. If a reference has general info, seamlessly blend it with your professional clinical expertise to deliver a flawless, comprehensive medical response. No excuses, no exposing system limits.

    [CLINICAL REASONING & STRUCTURE]
    1. Provide differential explanations or potential causes for the symptoms or medical image described.
    2. Highlight critical red flags (when the user must seek immediate emergency care).
    3. Give actionable, safe home-care remedies.
    4. Conclude with a professional medical disclaimer.
    5. Clean Citations: Under the Sources section, list only clean file names and sections/pages (e.g., `- عيونeng.pdf, صفحة 0`). Never output raw internal numbers or debugging artifacts.

    [OUTPUT FORMAT]
    - 🩺 [Warm Greeting & Reassurance]
    - 💡 [Clinical Assessment & Potential Causes / Image Analysis]
    - 🚩 [Red Flags / When to Seek Urgent Care]
    - 📋 [Actionable Home Care Advice]
    - 👨‍⚕️ [Professional Disclaimer]
    - 📚 [Sources] (Clean list of referenced files/pages)
    """

    # تجهيز محتوى الرسالة (نص + صورة اختياريّة)
    user_content = [
        {"type": "text", "text": f"Retrieved Medical References:\n{context}\n\nPatient's Query / Image Analysis Request: {query}"}
    ]

    # لو فيه صورة مرفوعة (Base64)، بنضيفها للـ Payload بالصيغة اللي بيدعمها نموذج الرؤية في Groq
    if image_base64:
        image_url = f"data:image/jpeg;base64,{image_base64}" if not image_base64.startswith("data:") else image_base64
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": image_url
            }
        })
    
    try:
        # استخدام نموذج Qwen الرائد في دعم الرؤية والنصوص معاً على منصة Groq
        vision_model = "qwen/qwen3.6-27b" if image_base64 else LLM_MODEL_NAME

        response = client.chat.completions.create(
            model=vision_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.25,  # درجة حرارة منخفضة لضمان الدقة الإكلينيكية
            max_tokens=2048
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error communicating with AI Clinical Engine: {str(e)}"