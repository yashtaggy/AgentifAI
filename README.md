# 🤖 Agentic API Copilot

**Agentic API Copilot** is a high-performance, AI-driven developer tool designed to transform static OpenAPI/Swagger documentation into an interactive, intelligent workspace. It bridges the gap between reading API docs and actually writing code by using LLMs to understand, test, and generate implementations in real-time.

---

## 🚀 Key Capabilities

- **Intelligent Spec Parsing**: Instantly fetches and normalizes OpenAPI (v2 or v3) JSON specifications. It handles complex schemas and nested parameters automatically.
- **Interactive Sandbox**: Provides a "Playground" for every endpoint. You can fill in parameters, edit JSON request bodies in a professional Monaco-powered editor, and execute live API calls.
- **AI Assistant Chat**: A dedicated sidebar where you can ask natural language questions about the API. It can write implementation scripts, explain error messages, and suggest payload structures.
- **Bulletproof Fetching**: Built-in server-side proxy to bypass CORS restrictions, allowing you to load specifications from almost any public URL.
- **Developer-First UI**: Features an asymmetrical bento-box design, premium glassmorphism aesthetics, and a seamless Light/Dark mode toggle.

---

## 🛠️ How to Use It

1.  **Paste your URL**: Enter any public OpenAPI/Swagger JSON URL (e.g., from GitHub, APIs.guru, or your own server) into the landing page input.
2.  **Explore Endpoints**: Use the sidebar to browse through categorized API paths. Clicking an endpoint reveals its full documentation and a playground.
3.  **Test Live**: Fill in the required parameters and click "Execute Request" to see the real-time response from the API server.
4.  **Pair Program with AI**: Use the Chatbot on the right to say things like *"Write a Python script for this endpoint"* or *"What is the difference between these two parameters?"*

---

## 💎 Why Devs Benefit

- **Zero-Config Onboarding**: No need to set up Postman collections or local environments just to see if an API works.
- **Rapid Prototyping**: Go from an OpenAPI URL to a working Python/NodeJS snippet in under 30 seconds.
- **Self-Healing Insight**: When an API call fails, ask the AI to analyze the response. It identifies missing fields or malformed JSON instantly, saving hours of debugging.
- **Unified Workflow**: Documentation, testing, and code generation all happen in a single, beautiful dashboard.

---

*Built for the modern developer who values speed, aesthetics, and intelligence.*
