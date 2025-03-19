# Idea Management System

A full-stack application for managing ideas with user roles and notifications.

## Tech Stack

- Frontend: React.js with Material UI
- Backend: Node.js with Express
- Database: SQLite with Prisma ORM

## Features

- User Authentication
- Role-based Access Control (Admin, Employee, HR, Approver)
- CRUD Operations for Ideas
- Idea Status Management
- File Attachments
- Notification System

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up the database:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Start the development servers:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## User Roles and Permissions

- **Admin**: Full access to all features
- **Employee**: Can submit and manage their own ideas
- **HR**: Can review and manage ideas
- **Approver**: Can review and approve/reject ideas

## Environment Variables

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
``` 