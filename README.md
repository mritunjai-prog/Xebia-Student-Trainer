# 🎓 Xebia Assessment Portal

**A production-grade, full-stack Assessment & Evaluation Platform**  
Built with React 19, Spring Boot 3, and PostgreSQL — driven by Microservices.

<p align="center">
  <a href="setup.md">📖 Setup Guide</a> •
  <a href="assessment_workflow.html">📚 Architecture Flowchart</a>
</p>

## 📋 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Microservices Architecture](#-microservices-architecture)
- [Project Structure](#-project-structure)
- [Portal Walkthroughs](#%EF%B8%8F-portal-walkthroughs)
- [Quick Start](#-quick-start)

---

## 🌟 About the Project
Xebia Assessment Portal (Student Trainer) is a highly scalable evaluation platform built to streamline the entire lifecycle of student testing and performance tracking. It provides a robust **Trainer Portal** for assessment creation, batch management, and manual evaluation, alongside an intuitive **Student Portal** for taking quizzes, writing code, and reviewing automated feedback. 

The platform is powered by a Java microservices backend, ensuring secure and resilient handling of student submissions, alongside a React 19 frontend that integrates seamlessly with AI (Google Gemini) for automatic question generation and features Monaco Editor for live coding environments.

---

## 🔥 Key Features

### 🛡️ Trainer / Admin Portal
- **AI-Powered Question Builder** — Leverages Google Gemini AI to auto-generate MCQ and Coding questions directly into your assessment canvas.
- **Enterprise Assessment Builder** — A comprehensive builder to configure exam rules, time limits, negative marking, strictness levels, and pass percentages.
- **Batch Management** — Organize students into cohorts, track batch-wide performance metrics, and assign bulk assessments.
- **Excel Import / Export** — Upload questions instantly using a standard XLSX template, or export any built assessment directly back to Excel.
- **Manual Evaluation System** — Trainers can review descriptive and coding submissions, award marks, and leave feedback for students.
- **Leaderboards & Reports** — Enterprise-grade reporting with charts to track student progress and cohort health.

### 🎓 Student Portal
- **Interactive Dashboard** — Welcome metrics, recent scores, pending assessments, and interactive charts visualizing subject-wise performance.
- **Assessment Hub** — Browse all assigned assessments, view deadlines, and check attempt statuses.
- **Live Exam Environment** — Full quiz canvas with strict rules, timer tracking, and anti-cheating mechanisms.
- **Coding Arena** — Integrated Monaco Editor to solve programming challenges right in the browser with multi-language support.
- **Detailed Results Audit** — Review performance question-by-question, verify correct answers, and read trainer feedback post-evaluation.

---

## 🛠️ Tech Stack

### Frontend
| Category | Technology |
|----------|------------|
| **Framework** | React 19 + Vite |
| **Routing** | React Router DOM v7 |
| **Styling** | Tailwind CSS v4 + Design Tokens |
| **Animations** | Framer Motion |
| **AI Integration** | Google GenAI SDK (Gemini) |
| **Code Editor** | Monaco Editor React |
| **Data / Files** | XLSX SheetJS |
| **Charts** | Recharts |
| **Icons** | Lucide React |

### Backend
| Category | Technology |
|----------|------------|
| **Language** | Java 21 |
| **Framework** | Spring Boot 3 |
| **API Layer** | Spring Web MVC (REST) |
| **Database ORM** | Spring Data JPA + Hibernate |
| **Database** | PostgreSQL |
| **Gateway** | Spring Cloud Gateway |
| **Architecture**| Microservices (API Gateway, User, Batch, Assessment) |

---

## 🏗️ Microservices Architecture

```text
Browser (React Frontend)
         │
         ▼
  ┌─────────────────────────────┐
  │   API Gateway               │  ← Routes all /api/* requests
  └─────────────┬───────────────┘
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────────┐
│  User   ││  Batch  ││ Assessment  │  ← Core Business Logic Services
│ Service ││ Service ││   Service   │
└────┬────┘└────┬────┘└──────┬──────┘
     │          │            │
     ▼          ▼            ▼
  ┌─────────────────────────────┐
  │  PostgreSQL Databases       │  ← Isolated schemas per service
  └─────────────────────────────┘
```

**Service Responsibilities**
| Service | Purpose |
|---------|---------|
| `api-gateway` | Edge routing, CORS management, and reverse proxying |
| `user-service` | Authentication, student/trainer profiles |
| `batch-service` | Cohort management, student mapping, batch metrics |
| `assessment-service` | Exam configurations, submissions, evaluations, scores |

---

## 📁 Project Structure

```text
Xebia-Student-Trainer/
├── 📁 src/                          # React Frontend Source
│   ├── 📁 components/               # Reusable UI elements
│   │   ├── 📁 assessment-builder/   # AI generation, Config, Excel parsers
│   │   ├── 📁 layout/               # Sidebar, Header, Page Wrappers
│   │   └── 📁 ui/                   # Buttons, Cards, Inputs
│   ├── 📁 context/                  # Global State (LMSContext)
│   ├── 📁 pages/                    # Route-level views
│   │   ├── AssessmentBuilder.jsx    
│   │   ├── BatchManagement.jsx      
│   │   ├── Evaluation.jsx           
│   │   ├── Results.jsx              
│   │   ├── StudentDashboard.jsx     
│   │   ├── TakeCoding.jsx           
│   │   └── TakeQuiz.jsx             
│   ├── 📁 services/                 # AI service, API clients
│   ├── 📁 utils/                    # Data formatters, helpers
│   ├── App.jsx                      # Main Router definitions
│   └── index.css                    # Tailwind tokens & globals
│
├── 📁 backend/                      # Java Backend Monorepo
│   ├── 📁 api-gateway/              # Spring Cloud Gateway
│   ├── 📁 assessment-service/       # Core assessments & submissions
│   ├── 📁 batch-service/            # Batch management logic
│   └── 📁 user-service/             # Profiles & Auth logic
│
├── README.md                        # This file
└── assessment_workflow.html         # 📚 Interactive architecture flowchart
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Java 21 (JDK)**
- **PostgreSQL** running on port `5432`
- **Redis** running on port `6379` (Required for AI generation queues)

### 1. Clone the Repository
```bash
git clone https://github.com/mritunjai-prog/Xebia-Student-Trainer.git
cd Xebia-Student-Trainer
```

### 2. Start Databases
Ensure your local **PostgreSQL** server is running and matches the credentials in the backend services (`application.properties`). You must also have **Redis** running. If using Docker, you can spin them up quickly:
```bash
docker run --name postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres
docker run --name redis -p 6379:6379 -d redis
```

### 3. Start the Backend Microservices
We have provided a handy PowerShell script that will automatically launch all 4 microservices (`api-gateway`, `user-service`, `batch-service`, `assessment-service`) in separate windows using Maven.

**On Windows:**
```powershell
cd backend
.\start_backend.ps1
```
*(Alternatively, you can manually `cd` into each service folder and run `./mvnw spring-boot:run`)*

### 4. Start the React Frontend
Open a new terminal at the project root (`Xebia-Student-Trainer/`):
```bash
npm install
npm run dev
```

### 5. Configure Environment Variables
Create a `.env` file in the root folder with the following:
```env
VITE_API_URL=http://localhost:8080
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you're in! 🎉

---

## 🖥️ Portal Walkthroughs

### Trainer Portal
The trainer dashboard (`/trainer`) is the core command center for educators. 
- **Assessment Builder**: The crown jewel of the portal. Use the Gemini AI integration to instantly spawn MCQ and Coding questions by providing a prompt, or bulk-upload via Excel.
- **Batch Management**: View all cohorts, assign assessments to specific batches, and monitor collective health and completion rates.
- **Manual Evaluation**: For descriptive and coding questions, trainers can step into the evaluation view, review code, execute it mentally or locally, and provide specific marks and feedback.
- **Leaderboards**: Track top-performing students across the platform.

### Student Portal
The student portal (`/student`) provides a distraction-free exam environment.
- **Dashboard**: Track upcoming deadlines and view interactive charts displaying subject mastery.
- **Take Quiz Canvas**: A strict environment tracking time remaining and presenting questions one by one.
- **Take Coding Canvas**: Features the Monaco Editor (the core of VS Code) inside the browser, allowing syntax highlighting and real-time coding for technical assessments.
- **Results Audit**: After evaluation, students receive a highly detailed breakdown of their exam, identifying exactly where they went wrong and showcasing the trainer's manual feedback.
