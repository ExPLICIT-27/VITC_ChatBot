try:
    from app.WeaviateGeminiInterface.RAG_CORE import query as core_query 
    print("Successfully imported query function") # Add this to confirm success

except Exception as e:
    print(f"Failed to import query function: {e}")