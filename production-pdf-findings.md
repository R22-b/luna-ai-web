# Production PDF findings

The attached three-page PDF shows the Luna AI Settings page on `luna-ai-frontend.onrender.com`.

Observed errors:

- Hugging Face test: request to `https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3` failed with a DNS-style `getaddrinfo ENOTFOUND api-inference.huggingface.com` message (the screenshot text is partially clipped, but the hostname is visible as `api-inference.huggingface.com`).
- Groq test: `groq HTTP 400`.
- Google Gemini test: `gemini HTTP 404`.

The provider cards show Groq and Gemini as configured/healthy before testing, so keys are reaching the backend session. The remaining problems are provider endpoint/model compatibility and error classification, not merely failure to save the key.

Repository observations:

- Backend provider definitions are in `backend/services/brain-manager.js`.
- Groq uses `https://api.groq.com/openai/v1` and an old registry model `llama-3.1-70b-versatile`.
- Gemini uses `https://generativelanguage.googleapis.com/v1beta` and registry model `gemini-1.5-flash`.
- Hugging Face uses `https://api-inference.huggingface.co/models`.
- The frontend currently displays only the backend error string; the prior patch now surfaces it.
