import os
import sys
sys.path.append(os.getcwd())
from backend.generator import client as groq_client

def test():
    raw_text = 'غهري واجعني وعندي صوداع'
    sys_prompt = "You are an elite multilingual and Arabic dialect (Egyptian, Gulf, Levantine, MSA) medical speech-to-text phonetic corrector. Your ONLY job is to fix phonetic/spelling errors made by speech recognition while preserving the user's EXACT spoken language and dialect. Examples: if the raw transcript says 'غهري واجعني' or 'حهري واجعني', correct it to 'ظهري واجعني'. If it contains random hallucinated Chinese/Hindi/Korean characters mixed with Arabic/English or from background noise, strip them out or fix them to the intended Arabic/English medical phrase. Output ONLY the corrected transcript text with zero commentary, zero quotes, and NEVER answer the user's question."
    res = groq_client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        temperature=0.0,
        max_tokens=250,
        messages=[{'role': 'system', 'content': sys_prompt}, {'role': 'user', 'content': raw_text}]
    )
    print('Corrected:', res.choices[0].message.content.strip())

if __name__ == "__main__":
    test()
