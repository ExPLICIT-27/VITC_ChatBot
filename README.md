# VITC_ChatBot

## 1. Project Name & Overview
**Project Name:** VITC_ChatBot  
**Overview:**  
VITC_ChatBot is a sophisticated, AI-powered conversational assistant designed specifically for Vellore Institute of Technology, Chennai (VITC). By leveraging Retrieval-Augmented Generation (RAG), the chatbot ingests official university documents (PDFs) and uses Google's Gemini LLM to provide accurate, context-aware answers to student and faculty queries. The application features a stunning, immersive "Galaxy" themed frontend built with React and Three.js/WebGL, coupled with a robust FastAPI backend.

## 2. Problem it Solves
-   **Information Overload:** Students often struggle to find specific information buried in lengthy university handbooks, circulars, and websites.
-   **Accessibility:** Official information is scattered across different portals; the chatbot centralizes this retrieval.
-   **Contextual Understanding:** Keyword search often fails to answer complex queries. This chatbot understands natural language and provides synthesized answers with source citations.
-   **User Engagement:** Traditional portals are often dry and outdated. VITC_ChatBot offers a modern, engaging interface that students actually want to use.

## 3. Target Users (Personas)
-   **The Student:** Needs quick answers about academic regulations, exam schedules, hostel rules, or campus events without reading 50-page PDFs.
-   **The Faculty:** Requires quick access to administrative policies, curriculum details, and research guidelines.
-   **The Prospective Student/Parent:** Seeks information about admission criteria, campus facilities, and fee structures.
-   **The Administrator:** Wants to ensure consistent and accurate dissemination of information across the campus.

## 4. Vision Statement
"To revolutionize the way the VIT community interacts with institutional knowledge by creating an immersive, intelligent, and instantaneous bridge between users and information."

## 5. Key Features / Goals
-   **RAG-Powered Intelligence:** Combines the generative power of Gemini wth the factual accuracy of Weaviate vector search.
-   **Immersive UI:** A visually striking "Galaxy" background using WebGL (OGL) to create a premium user experience.
-   **Source Citations:** Every answer comes with links to the specific source documents (chunks) used, ensuring trust and verifiability.
-   **Multi-Modal Ingestion:** Capable of processing complex PDF documents, including tables (via Camelot) and text (via PyMuPDF).
-   **Dockerized Deployment:** Fully containerized setup (Frontend + Backend + Nginx) for easy deployment anywhere.
-   **Natural Language Interaction:** Supports follow-up questions and maintains context within the chat session.

## 6. Success Metrics
-   **Accuracy:** % of queries where the retrieved context contains the correct answer.
-   **Latency:** Average time to generate a response (Goal: < 5 seconds).
-   **User Retention:** Daily Active Users (DAU) and query volume per session.
-   **Source Utilization:** Frequency of users clicking on/verifying source citations.

## 7. Assumptions & Constraints
-   **Assumptions:**
    -   Users have internet access to reach the web application.
    -   The provided PDF documents in the `data/` folder are the source of truth.
    -   Google Gemini API availability and rate limits apply.
-   **Constraints:**
    -   **Token Limits:** The LLM has a context window limit, requiring efficient chunking of documents.
    -   **PDF Formatting:** Extremely complex or scanned PDFs (images) might require OCR (Tesseract) which adds processing overhead (currently relying on text extraction).
    -   **Cost:** Usage of commercial APIs (Gemini, Weaviate Cloud) may incur costs at scale.

## 8. Technical Stack
-   **Frontend:** React, TypeScript, TailwindCSS, Framer Motion, OGL (WebGL).
-   **Backend:** FastAPI, Python 3.10.
-   **AI/ML:** Google Gemini (LLM), Weaviate (Vector DB), Sentence Transformers (Embeddings).
-   **Infrastructure:** Docker, Docker Compose, Nginx.
