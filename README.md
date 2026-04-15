# MindCare Frontend - AI-Powered Mental Health Platform

MindCare is a modern, responsive web application serving as the frontend interface for an AI-powered mental health classification system. The platform provides a safe space for individuals to express their feelings and uses Natural Language Processing paired with Explainable AI (XAI LIME) to visually explain the detection of **Depression**, **Anxiety**, and **Stress**.

## ✨ Key Features

- **Interactive Conversations**: Natively chat with the AI and receive insights about your psychological state.
- **XAI LIME Visualizations**: See exactly *why* a classification was made through precise word highlighting and probability percentage bars.
- **Dynamic Dashboard**: Track all past sessions with beautiful, custom-colored charts and metrics.
- **Glassmorphic UI Design**: A stunning, premium aesthetic featuring blurred animated orbs, semi-transparent frosted cards, and immersive styling.
- **Seamless Responsiveness**: fully optimized for desktop and mobile devices.

## 🛠 Tech Stack

Built strictly as a modern Single Page Application (SPA), emphasizing high performance and beautiful UI components.

- **React 18** & **TypeScript**
- **Vite** (Next-generation frontend tooling)
- **React Router 6** (SPA Routing infrastructure)
- **Tailwind CSS 3** (Utility-first styling system)
- **Shadcn/UI & Radix UI** (Accessible, headless UI primitives tailored for complete customization)
- **Recharts** (Visual data reporting for Dashboard charts)
- **Lucide React** (Clean SVG Icons)
- **TanStack React Query** (Data fetching and client-side caching)

## 🎨 Design System

Our frontend adheres strictly to specific psychological color combinations:
- **Depression**: Deep Blue (`#0369C2`)
- **Anxiety**: Calming Purple (`#8680C6`)
- **Stress**: Warning Red (`#F2393D`)

## 🚀 Getting Started

Follow these instructions to get the frontend development environment running locally.

### Prerequisites
- Node.js (v16+)
- `pnpm` Package Manager (`npm install -g pnpm`)

### Installation

1. Clone the frontend repository:
   ```bash
   git clone <frontend_repository_url>
   cd mental-health-classifier/client
   ```
   *(Note: Adjust the path if the client root is located at the top-level directory)*

2. Install the necessary dependencies:
   ```bash
   pnpm install
   ```

3. Spin up the Vite development server:
   ```bash
   pnpm dev
   ```

4. Alternatively, to check strict TypeScript typing and create a production build:
   ```bash
   pnpm typecheck
   pnpm build
   ```

5. Open your local host URL provided by Vite (e.g. `http://localhost:5173` or `http://localhost:8080`) in your browser.

## 🔗 Backend API Configuration
To operate fully, this frontend expects a connection to the MindCare Backend / API server. During development, you can configure the proxy rules in `vite.config.ts`, or utilize the `baseUrl` in your environmental variables (e.g. `.env.local`) to point to your live backend endpoint.

## 📜 Standard Scripts

- `pnpm dev`: Start Vite development server with HMR.
- `pnpm build`: Generate optimized production-ready static files.
- `pnpm preview`: Preview the production build locally.
- `pnpm typecheck`: Run TS strict checks.
- `pnpm test`: Execute frontend unit tests (via Vitest).
