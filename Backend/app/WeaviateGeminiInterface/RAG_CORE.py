from dotenv import load_dotenv

# Import functions from our modules
from .pdf_processor import process_pdfs_in_directory
from .weaviate_handler import (
    connect_to_weaviate, 
    get_or_create_collection, 
    ingest_data,
    retrieve_chunks
)
from .gemini_handler import configure_gemini, generate_answer


def query(user_query : str):
    """
    Main function to orchestrate the PDF ingestion and RAG workflow.
    """
    load_dotenv()

    # --- Configuration ---
    # Set to True to delete the existing Weaviate collection and re-ingest all PDFs.
    # Set to False to use the existing data and just ask questions.
    PERFORM_INGESTION = False 
    import os
    # The folder containing your PDF files. 
    # In Docker, this will be /code/Backend/data if WORKDIR is /code/Backend.
    # We use a relative path here to support both local and docker execution (assuming run from Backend dir).
    PDF_DIRECTORY = os.path.join(os.getcwd(), "data") 
    
    # --- API and DB Setup ---
    if not configure_gemini():
        return # Exit if Gemini config fails
    client = connect_to_weaviate()
    if not client:
        return # Exit if Weaviate connection fails

    try:
        collection_name = "VIT_docs"
        # Get or create the collection, deleting it first if PERFORM_INGESTION is True
        documents_collection = get_or_create_collection(
            client, 
            collection_name, 
            fresh_start=PERFORM_INGESTION
        )
        if documents_collection is None:
            return 

        # --- Data Ingestion Step ---
        if PERFORM_INGESTION:
            # Process all PDFs in the specified directory
            data_to_ingest = process_pdfs_in_directory(PDF_DIRECTORY)
            # Ingest the processed data into Weaviate
            ingest_data(documents_collection, data_to_ingest)

        # --- RAG (Retrieval-Augmented Generation) Workflow ---
        print("\n--- Ready to answer questions ---")
        
        # Example Query
        print(f"\nUser Query: '{user_query}'")

        # 1. Retrieve relevant context from Weaviate
        retrieved_chunks = retrieve_chunks(documents_collection, user_query, limit=5)
        
        # 2. Generate an answer using Gemini with the retrieved context
        final_answer = generate_answer(retrieved_chunks, user_query)
        
        return final_answer
    except Exception as e:
        print(f"❌ An unexpected error occurred in the main workflow: {e}")

    finally:
        # Always close the connection
        if client and client.is_connected():
            client.close()
            print("\nConnection to Weaviate closed.")


