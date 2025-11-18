# Virtual Academic Tutor in Decentraland (SDK7 + Local RAG Pipeline)

This project implements a **virtual academic tutor** inside the metaverse platform **Decentraland**, using a fully local **Retrieval-Augmented Generation (RAG)** pipeline for natural language question answering.  
The system provides students with information about courses, schedules, teachers, and academic spaces through a conversational interface activated directly within the 3D scene.

---

## 🚀 Project Overview

The system is composed of three main components:

1. **Decentraland Scene (Frontend)**  
   Built using **Decentraland SDK7** and **React-ECS**, it contains:
   - An interactive **NPC** that triggers the chat interface.
   - A 3D virtual classroom.
   - A UI chat panel for sending questions and displaying answers.

2. **RAG Backend API (Orchestrator)**  
   A lightweight backend that:
   - Receives user queries from the scene
   - Generates embeddings through **Ollama**
   - Retrieves the Top-k relevant passages from a structured academic knowledge base (CSV files)
   - Constructs a controlled prompt and calls the LLM
   - Returns the final response to the scene

3. **Local LLM Runtime via Dockerized Ollama**  
   Ollama manages:
   - **Embedding model** (e.g., `mxbai-embed-large`)
   - **Generative models** (e.g., `gpt-oss:20b-cloud`, `gemma3:1b`)

This setup ensures **full data privacy**, **local execution**, and **verifiable responses** grounded in the academic knowledge base.


---

## 🛠 Requirements

### General
- Node.js ≥ 18
- npm ≥ 9
- Docker + Docker Compose
- Ollama installed locally in a container

### For the Decentraland scene
```bash
npm install -g @dcl/sdk-commands


