📝 Task Tracker

A minimal full-stack Task Tracker built with Next.js (App Router) and API routes.
This project demonstrates practical judgment, clean structure, and attention to UX — perfect for quick assessments or hackathon-style demos.

⚡ Features

➕ Create new tasks

✅ Toggle task completion

❌ Delete tasks

🔍 Filter tasks (all, completed, pending, and search by query)

📡 Full-stack setup with API routes

🛠️ Tech Stack

Frontend: Next.js (App Router), React, TailwindCSS

Backend: Next.js API routes

State Management: React hooks (useState, useEffect)

📂 Folder Structure
task-tracker/
│── app/
│   ├── api/
│   │   └── todos/       # REST API for todos (GET, POST, PATCH, DELETE)
│   ├── page.js          # Main UI
│── components/
│   ├── CreateTodoForm.js
│   ├── Filters.js
│   ├── TodoList.js
│── public/
│── styles/
│── README.md

🚀 Getting Started
1️⃣ Clone the repo
git clone https://github.com/Kanojiapriyanshu/task-tracker
cd task-tracker

2️⃣ Install dependencies
npm install

3️⃣ Run development server
npm run dev


Open 👉 http://localhost:3000

🧪 API Endpoints
Method	Endpoint	Description
GET	/api/todos	Fetch all tasks (with filters)
POST	/api/todos	Add a new task
PATCH	/api/todos/:id	Toggle task completion
DELETE	/api/todos/:id	Delete a task
📸 Screenshots

(Add once UI is running)

👨‍💻 Author

Priyanshu Kanojia
Built for a 45-min full-stack technical assessment.