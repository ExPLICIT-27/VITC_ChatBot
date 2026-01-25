import os
import google.generativeai as genai
import json

#gemini congfig
global GEMINI_MODEL
def configure_gemini():
    """Configures the Gemini API and initializes the model."""
    global GEMINI_MODEL
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL")
    if not GOOGLE_API_KEY or not GEMINI_MODEL:
        print("❌ GOOGLE_API_KEY/MODEL SELECTION not found in .env file.")
        return False
    
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        GEMINI_MODEL = genai.GenerativeModel(GEMINI_MODEL)
        print("✅ Gemini API configured successfully.")
        return True
    except Exception as e:
        print(f"❌ Error configuring Gemini API: {e}")
        return False

def generate_answer(context_chunks, query_text):
    """Generates an answer using Gemini based on the provided context."""
    global GEMINI_MODEL
    if not GEMINI_MODEL:
        print("❌ Gemini model is not configured. Please call configure_gemini() first.")
        return {"answer": "Error: Gemini model not configured.", "sources": []}
        
    if not context_chunks:
        return {"answer": "I could not find any relevant information to answer your question.", "sources": []}

    context = "\n".join(context_chunks)
    
    # This prompt template is crucial for instructing the model effectively
    prompt = f"""
    CONTEXT:
    ---
    {context}
    ---
    Based ONLY on the context provided above, please answer the following question. Do not use any other information. 
    Return a valid JSON object in the format: {{ "answer": "<the_answer>", "sources": [<list_of_sources>] }}.
    The sources should be a list of dictionaries.

    QUESTION: {query_text}
    """

    try:
        print("\nGenerating answer with Gemini...")
        response = GEMINI_MODEL.generate_content(prompt)
        
        # Extract the raw text from the response object
        response_text = response.text

        # 1. Clean up the response text by removing markdown and the json tag
        cleaned_text = response_text.strip().replace("```json\n", "").replace("```", "").strip()

        # 2. Try to parse the cleaned text as JSON
        try:
            result_dict = json.loads(cleaned_text)
            
            # Additional check to ensure the returned JSON has the expected keys
            if "answer" not in result_dict or "sources" not in result_dict:
                return {"answer": "Gemini returned an unexpected JSON format.", "sources": []}

            return result_dict
        
        except json.JSONDecodeError as e:
            print(f"❌ Error decoding JSON from Gemini response: {e}")
            # If JSON decoding fails, return a default structured response
            return {"answer": response_text, "sources": []}

    except Exception as e:
        print(f"❌ Error generating content with Gemini: {e}")
        return {"answer": "Sorry, I encountered an error while generating the answer.", "sources": []}