# 🎓 Xebia LMS - Frontend

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)

This is the frontend codebase for the **Xebia Learning Management System (LMS)** and Assessment Module. It provides a fully responsive, interactive, and intelligent interface for both **Teachers** and **Students** to manage batches, create complex assessments (including a built-in code editor), and evaluate submissions with AI assistance.

---
## ✨ Key Features

### 👨‍🏫 For Teachers
- **Teacher Dashboard**: Get an overview of all active batches, pending evaluations, and recent assessments.
- **Batch Management**: Organize students into batches and manage batch-specific resources.
- **Assessment Builder**: Create rich assessments with drag-and-drop functionality for Multiple-Choice Questions (MCQs), Subjective questions, and Coding challenges.
- **AI-Powered Evaluation**: Automated grading and feedback for subjective and coding questions using **Google Gemini AI**.
- **Reports & Analytics**: Track student performance over time with insightful charts (powered by Recharts).

### 👨‍🎓 For Students
- **Student Dashboard**: Quick access to upcoming, pending, and completed assessments.
- **Interactive Assessments**: Seamless experience for taking quizzes and subjective tests.
- **Integrated Code Sandbox**: Built-in coding environment powered by **Monaco Editor** for solving programming challenges directly in the browser.
- **Leaderboards & Results**: See rankings and detailed results from completed assessments.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS 4 (Dark mode supported)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Code Editor:** Monaco Editor (for React)
- **Routing:** React Router DOM v7
- **Charting:** Recharts
- **AI Integration:** `@google/genai` (for Gemini API)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Xebia-Student-Trainer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
This project requires a Gemini API Key to enable the AI Evaluation and Autograding features.
1. Copy `.env.example` to `.env` or `.env.local`
2. Add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
*(Note: adjust the variable name if it differs in your `.env.example`)*

### Running Locally
To start the development server, run:
```bash
npm run dev
```
The application will typically be available at `http://localhost:3000` or `http://localhost:5173`.

---

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components (Header, Sidebar, Toast, UI components)
│   └── assessment-builder/ # Specific components for building assessments
├── context/             # Global React Context providers (Auth, Theme, etc.)
├── data/                # Mock data or constant files
├── pages/               # Main application pages
│   ├── AssessmentBuilder.jsx
│   ├── BatchManagement.jsx
│   ├── Evaluation.jsx
│   ├── Leaderboard.jsx
│   ├── Login.jsx
│   ├── TakeCoding.jsx
│   └── ...              # Other pages (TeacherDashboard, StudentDashboard, etc.)
├── utils/               # Utility functions and helpers
├── App.jsx              # Main App component with routing setup
├── main.jsx             # React application entry point
└── index.css            # Global styles and Tailwind configuration
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
