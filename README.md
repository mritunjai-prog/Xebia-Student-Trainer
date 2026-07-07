# Xebia LMS - Frontend

This is the frontend codebase for the Xebia Learning Management System (LMS) and Assessment Module. 
It provides a fully responsive interface for both **Teachers** and **Students** to manage batches, create complex assessments (including a built-in code editor), and evaluate submissions with AI assistance.

## Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS 4 (Dark mode supported)
- **Icons:** Lucide React
- **Code Editor:** Monaco Editor
- **Routing:** React Router DOM
- **Charting:** Recharts

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository
2. Navigate to the directory and install dependencies:
`npm install`

### Running Locally
To start the development server, run:
`npm run dev
`

### Environment Variables
This project requires a Gemini API Key to enable the AI Evaluation and Autograding features.
1. Copy .env.example to .env or .env.local
2. Add your key:
`env
GEMINI_API_KEY=your_api_key_here
`

## Features
- **Role-based Dashboards:** Separate experiences for students and teachers.
- **Assessment Builder:** Drag-and-drop creation for multiple-choice, subjective, and coding questions.
- **IDE Sandbox:** Built-in code execution interface for programming assessments.
- **AI Autograding:** Automated grading and feedback using Gemini.
- **Responsive Layout:** Optimized for desktop, tablet, and mobile viewing.
