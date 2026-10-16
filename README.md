# ETHMem

ETHMem is a powerful, privacy-first local memory manager for AI chatbots. It gives your favorite AI models (like ChatGPT, Claude, and Gemini) long-term memory by automatically extracting important facts and user preferences from your conversations and securely storing them purely in your browser's local storage. When you start a new conversation, ETHMem intelligently injects relevant past context, ensuring your AI assistant remembers who you are and what you need.

## Key Features

*   **Universal Compatibility:** Works seamlessly across major AI platforms including ChatGPT, Claude, Gemini, and ASI1.
*   **100% Local Storage:** All memories are securely stored in your browser using IndexedDB. No cloud storage, no IPFS, and no external backends are used, ensuring your data remains completely private.
*   **Intelligent Extraction:** Uses advanced AI (including Gemini API and local WebGPU fallback models) alongside robust pattern-based matching to accurately identify and extract meaningful memories (locations, preferences, facts, etc.) from chat interactions.
*   **Contextual Injection:** Automatically finds and seamlessly injects relevant stored memories into your active chat sessions to maintain context over time.
*   **Intuitive Dashboard:** A dedicated frontend web application to view, manage, and delete your stored memories.

## Project Structure

This repository consists of two main components:

### 1. The Browser Extension (`/extension`)
A Manifest V3 Chrome extension that acts as the core engine. It injects scripts into supported AI chat interfaces, intercepts chat payloads, extracts memories in the background using intelligent models, and stores them in your local browser instance. 

### 2. The Frontend Dashboard (`/frontend`)
A Next.js application that serves as the visual interface and settings panel for ETHMem. It allows users to browse their stored memories, configure model settings, and view analytics related to their memory usage.

## Getting Started

### Prerequisites
*   Node.js (for running the frontend)
*   Google Chrome, Microsoft Edge, or a Chromium-based browser (for the extension)

### Installing the Extension

1.  Open your Chromium browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
2.  Enable **Developer mode** (usually a toggle in the top right corner).
3.  Click the **Load unpacked** button.
4.  Select the `extension` folder located inside this repository.
5.  The ETHMem extension is now installed. You should see its icon in your browser toolbar.

### Running the Frontend Dashboard

1.  Open a terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required dependencies:
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    ```
4.  Open `http://localhost:3000` in your browser to view the dashboard.

## Usage

1.  Navigate to a supported AI chat platform (e.g., chatgpt.com or gemini.google.com).
2.  Start chatting normally. For example, tell the AI, "I live in Tokyo and I love spicy food."
3.  The ETHMem extension will passively monitor the conversation, extract these facts, and log them into its local IndexedDB storage.
4.  You can click the ETHMem extension icon or use the web dashboard to view your newly saved memories.
5.  In future conversations, ETHMem will automatically inject relevant facts into your prompts to provide the AI with your personal context.

## Memory Schema

Memories are stored locally with the following structured format:

```javascript
{
  id: "mem-timestamp-random",
  timestamp: 1697712000000,
  source: "I live in Tokyo",
  category: "location",
  entity: "Tokyo",
  context: {
    conversationId: "chatgpt-...",
    platform: "chatgpt"
  },
  metadata: {
    confidence: 0.85,
    modelUsed: "gemini-1.5-flash",
    extractionVersion: "1.0"
  },
  status: "local"
}
```
