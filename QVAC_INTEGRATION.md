# QVAC Integration in SoverMind

*This document explains how Tether's QVAC SDK was integrated into the SoverMind architecture for the hackathon submission.*

---

We integrated Tether's QVAC SDK as the foundational AI orchestration layer within our Node.js (Fastify) backend. Because our core value proposition is absolute data sovereignty and privacy, QVAC was essential for running multiple heavy AI models entirely offline on the user's local hardware (GPU via Vulkan). 

Our architecture completely isolates the user's health data by using QVAC to handle four distinct AI pipelines without a single outbound network request:

### 1. Core Health LLM (`llama.cpp` integration)
We use QVAC to load and run quantized `.gguf` models (like Mistral/LLaMA) locally. The QVAC SDK handles the inference, and our Fastify backend streams the generated tokens back to the React frontend over WebSockets for a real-time, ChatGPT-like experience—all processed on-device.

### 2. Voice-to-Text (`whisper.cpp` integration)
When users dictate their symptoms, the frontend records a `.webm` audio blob and sends it to our local server. QVAC orchestrates a local Whisper model to transcribe the audio into text offline before passing it to the LLM.

### 3. Prescription Scanning (`ONNX` OCR integration)
Our "Scan" feature allows users to drag-and-drop images of their medication. We integrated QVAC's ONNX runtime capabilities to perform local optical character recognition (OCR). The SDK extracts the text from the image, which the local LLM then structures into a JSON object containing the drug name, dosage, instructions, and contraindications.

### 4. Offline Translation (`nmt.cpp` integration)
To make local healthcare accessible, we use QVAC's Neural Machine Translation (NMT) modules to translate the LLM's English output into languages like Tamil, Hindi, and Swahili. This happens as a post-processing step entirely within the local QVAC pipeline.

### Technical Architecture Summary
The React frontend never talks to the cloud. It communicates exclusively via REST and WebSockets to a local Fastify server (`localhost:3001`). That Fastify server utilizes the `@tether.io/qvac` Node package to load the `.gguf` and `.onnx` files from disk into VRAM, executing the inference locally and returning the results to the UI.
