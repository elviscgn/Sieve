# Umurava AI Hackathon: Backend Recruitment Engine

## Overview
This is the core backend service for the Sieve AI recruitment assisstant . It is a robust, AI-driven backend built to automate the candidate screening process. The system ingests job descriptions to generate scoring rubrics, processes unstructured candidate data (including raw PDF resumes), and leverages Large Language Models (LLMs) to strictly enforce the hackathon's Talent Profile Schema. It also provides real-time streaming for evaluation progress and recruitment intelligence.

## Core Features

* **AI-Powered Rubric Generation:** Automatically extracts dimensions, weights, and dealbreakers from raw job descriptions.
* **Human-in-the-Loop Override:** Allows recruiters to manually adjust AI-generated rubric weights (strictly enforcing a 100% sum) and add custom dealbreakers.
* **Dual-Scenario Applicant Ingestion:** * *Batch Ingestion:* Accepts JSON arrays of pre-formatted candidate profiles.
    * *PDF Parsing:* Accepts raw PDF resumes, extracts the text using `pdfreader`, and uses AI to map the unstructured data flawlessly into the strict Umurava Talent Profile Schema.
* **Automated Evaluation Engine:** Scores candidates automatically against the approved job rubric, generating composite scores, specific strengths, and identified gaps.
* **Real-Time Streaming (SSE):** Utilizes Server-Sent Events to stream evaluation progress to the UI and power a real-time "Ask the AI" feature for specific candidate inquiries.
* **Recruitment Intelligence:** Generates comprehensive analytics across screening sessions, identifying market match rates, top skill gaps, and experience mismatches.

##  Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Database:** MongoDB via Mongoose
* **AI Integration:** Google Generative AI SDK (`gemini-2.5-flash` & `gemini-2.5-flash-lite`)
* **File Handling:** Multer (Memory Storage) & `pdfreader`

## ⚙️ Local Setup and Installation

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB instance (Local or Atlas)
* A Google Gemini API Key

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/elviscgn/Sieve
    cd sieve-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add the following variables:
    ```env
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    *(Assuming `ts-node-dev` or `nodemon` is configured in your package.json scripts).*

## 🔌 API Reference Summary

The full interactive API documentation is available via Swagger UI. Once the server is running, navigate to:
**`http://localhost:3000/api-docs`**

### Key Endpoints

**Jobs & Rubrics**
* `POST /api/jobs`: Create a new job and auto-generate the rubric.
* `PUT /api/jobs/{id}/rubric`: Human-in-the-loop rubric overwrite.

**Applicant Ingestion**
* `POST /api/jobs/{id}/applicants`: Batch ingest candidates via JSON.
* `POST /api/jobs/{id}/upload-resume`: Upload a raw PDF resume. Extracts text and uses AI to map to the strict schema.

**Evaluation & Streaming**
* `POST /api/evaluations/evaluate-all`: Trigger the bulk evaluation engine.
* `GET /api/evaluations/progress/{id}`: Connect to the SSE stream for real-time progress updates.
* `POST /api/evaluations/qa/{id}`: Stream real-time answers to specific questions about a candidate's profile.

**Intelligence**
* `GET /api/intelligence`: Retrieve multi-session analysis, trend data, and actionable recruitment insights.

## System Architecture Notes

* **Strict Schema Enforcement:** The AI integration (`src/services/aiService.ts`) utilizes heavy prompt engineering to force the LLM to output valid JSON that strictly adheres to the hackathon's `UmuravaProfile` interface, including exact enum matching and date normalization.
* **PDF Processing:** The system uses `pdfreader` to bypass common TypeScript/CommonJS compilation issues found in older libraries. Files are processed entirely in memory via Multer, ensuring no lingering temp files on the server.
* **Performance:** Mongoose `.lean()` queries are used for heavy operations (like candidate comparisons) to strip metadata and improve response times.