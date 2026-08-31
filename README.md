# DevFlow

Full Stack Project Management Platform built with React, Express and SQLite.

## About

DevFlow is a project management platform designed to help teams track projects, tasks, priorities and delivery status in a Kanban workflow. It includes authentication, project creation, task filtering, drag and drop style movement and dashboard metrics.

## Features

- User registration and login
- Project creation and editing
- Task creation, editing and deletion
- Kanban workflow with status updates
- Filtering by project, priority, assignee and status
- Search by task title
- Project progress calculation
- Dashboard with metrics
- Responsive interface

## Tech Stack

- Front-end: React + Vite
- Back-end: Node.js + Express
- Database: SQLite
- Auth: JWT + bcrypt

## Project Structure

- frontend: Vite React app
- backend: Express REST API

## Database

Core tables:

- users
- projects
- project_members
- tasks

## API

Main endpoints:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/projects
- POST /api/projects
- PUT /api/projects/:id
- DELETE /api/projects/:id
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- GET /api/dashboard

## Run locally

1. Navigate to backend folder.
2. Copy .env.example to .env and adjust values.
3. Run npm install
4. Run npm run dev
5. Navigate to frontend folder.
6. Run npm install
7. Run npm run dev

## Environment variables

Backend .env:

PORT=3002
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d

Frontend .env:

VITE_API_URL=http://localhost:3002/api

## Deployment

The project is prepared for deployment in Vercel or Netlify for the frontend, and Render or Railway for the backend.

## Screenshots

Add screenshots here after running the app locally.

## Future improvements

- Team invitations
- Comments on tasks
- Activity timeline
- Role-based permissions
- File attachments

## Author

Your Name
