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
        
        # تنظيف اسم الملف ليكون أكثر احترافية (إزالة .pdf والشرطات)
        raw_source = meta.get("section_name", meta.get("source", "Medical Guidelines"))
        if raw_source:
            section_name = str(raw_source).replace("\\", "/").split("/")[-1]
            # إزالة الامتدادات وتجميل الاسم
            clean_section_name = section_name.replace(".pdf", "").replace("-", " ").replace("_", " ").title()
        else:
            clean_section_name = "المراجع الطبية المعتمدة"
        
        section_number = meta.get("section_number", f"{meta.get('page', 'N/A')}")
        text = chunk.get("text", "")
        
        # تنسيق نظيف للمراجع يمنع ظهور أي بيانات عشوائية للمريض
        context_text += f"\n[Clinical Reference {i+1}]\n"
        context_text += f"Document: {clean_section_name} | Page/Section: {section_number}\n"
        context_text += f"Clinical Excerpt: {text}\n"
        
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
    1. Respond 100% in the exact language of the patient's query.
    2. Tone: Extremely professional, deeply compassionate, calming, and authoritative. Act like a top-tier senior consultant at a world-renowned hospital speaking directly to a patient.
    3. For Arabic, use an elegant, warm, and highly professional tone (e.g., "أهلاً بك يا فندم، ألف سلامة عليك. لا داعي للقلق، نحن هنا لمساعدتك وطمأنتك...").

    [CRITICAL BEHAVIORAL RULES - NO EXPOSING THE AI/BACKEND]
    1. NEVER break character. NEVER act like an AI, a search engine, or a data parser.
    2. STRICTLY PROHIBITED: Do NOT use phrases like "based on the provided files", "the text says", "in the database", or "the uploaded documents".
    3. CLINICAL BLENDING: Integrate the facts from the provided Clinical References seamlessly into your expert advice. Present the information as your own clinical expertise backed by medical literature.

    [CLINICAL REASONING & STRUCTURE]
    1. Start with warm reassurance and a brief empathetic validation of their concern.
    2. Provide a structured, easy-to-understand clinical analysis of potential causes.
    3. Outline actionable, safe home-care guidelines.
    4. Highlight critical red flags (when the user must seek immediate emergency care).
    5. Ensure the "Sources" section is formatted elegantly using ONLY the exact document names and pages provided in the context.

    [STRICT OUTPUT FORMAT]
    Follow this exact structure with these exact emojis and headings:

    🩺 التقييم المبدئي:
    (Your warm greeting, reassurance, and initial empathetic thoughts)

    💡 التحليل الطبي والأسباب المحتملة:
    (Structured bullet points explaining the potential causes professionally)

    📋 الإرشادات الطبية وخطوات الرعاية:
    (Clear, actionable, and safe advice)

    🚩 علامات تستدعي التدخل الطبي العاجل:
    (Emergency red flags formatted clearly)

    👨‍⚕️ تنويه طبي:
    (A brief, professional medical disclaimer stating this does not replace a physical exam)

    📚 المراجع الطبية الداعمة:
    (List the sources beautifully. Example format:)
    • 📄 مرجع: [Document Name] | 📑 صفحة/قسم: [Page/Section Number]
    """

    # تجهيز محتوى الرسالة (نص + صورة اختياريّة)
    user_content = [
        {"type": "text", "text": f"Retrieved Medical References:\n{context}\n\nPatient's Query / Image Analysis Request: {query}"}
    ]

    # لو فيه صورة مرفوعة (Base64)
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