<h1 align="center">
  <img src="https://img.icons8.com/clouds/100/000000/learning.png" alt="Portal Logo" width="100"/>
  <br/>
  <b>Xebia Assessment Portal</b>
</h1>

<p align="center">
  <strong>A modern, AI-powered assessment platform for Students and Trainers</strong><br/>
  Built with React 18, Vite, Tailwind CSS, and Groq AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-00D8FF?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq_AI-FF6B35?style=for-the-badge&logo=ai&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white"/>
</p>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Portal Walkthroughs](#-portal-walkthroughs)
  - [Trainer Portal](#trainer-portal)
  - [Student Portal](#student-portal)
- [Quick Start](#-quick-start)

---

## 🌟 About the Project

**Xebia Assessment Portal** is a sophisticated frontend application designed to facilitate seamless assessment creation, distribution, and evaluation. It features **two distinct user portals** — a comprehensive **Trainer Portal** for instructors to build and manage exams, and a focused **Student Portal** for learners to take coding challenges, quizzes, and view their performance.

The platform integrates directly with the **Groq AI API** to power automated assessment generation, intelligent test descriptions, and instant automated grading with feedback for student submissions.

---

## 🔥 Key Features

### 👨‍🏫 Trainer Portal
- **AI-Powered Assessment Builder** — Automatically generate questions and assessment instructions using Groq AI based on a simple topic prompt.
- **Rich Question Types** — Build tests using multiple formats: MCQ, Multiple Select, True/False, Short Answer, Paragraph, File Upload, and integrated Coding Challenges.
- **Batch & Course Management** — Assign assessments to specific student batches with configurable schedules, durations, and passing marks.
- **Automated AI Grading (Evaluation)** — Instantly grade student coding and text submissions with AI-driven feedback identifying logic errors and areas for improvement.
- **Comprehensive Dashboards & Analytics** — Track student performance, leaderboard rankings, and assessment completion rates with modern visual charts.

### 🎓 Student Portal
- **Interactive Dashboard** — Quick-action cards showing active exams, upcoming schedules, and personal leaderboard ranking.
- **Live Coding Environment** — Take coding assessments in a dedicated IDE-like interface tailored for technical evaluations.
- **Instant Results & Feedback** — Review graded assessments immediately with specific insights and feedback provided by the automated AI evaluation system.
- **Responsive Design** — Fully optimized for desktop and responsive across various screen sizes.

---

## 💻 Tech Stack

- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS & Vanilla CSS (Custom Scrollbars, Glassmorphism)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API (`useLMS`)
- **AI Integration**: Groq API (Chat Completions)
- **Animations**: Framer Motion (motion/react)

---

## 🚀 Quick Start

Follow these steps to run the portal locally:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Xebia-Student-Trainer.git
cd Xebia-Student-Trainer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure AI Integration
Create a `.env` file in the root directory and add your Groq API key:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start the Development Server
```bash
npm run dev
```

The application will automatically launch and be available at `http://localhost:3000`. 
*(Note: Use the dropdown in the sidebar to simulate logging in as a "Student" or "Trainer".)*

---

<p align="center">
  <i>Built to modernize and streamline technical assessments and learning evaluation.</i>
</p>
