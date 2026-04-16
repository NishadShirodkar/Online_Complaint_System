# Online Complaint Management System

This is a Next.js App Router project for submitting and reviewing complaints. Complaints are stored in MongoDB, categorized through Groq-powered AI, and assigned a priority before being shown in the UI.

## Tech Stack

- Next.js 16 App Router
- React 19
- MongoDB Atlas with mongoose
- Groq API through the OpenAI Node SDK
- Tailwind CSS

## Features

- Submit complaints from the homepage
- Auto-categorize complaints with AI
- Assign priority based on complaint volume
- View complaints in sorted order

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Atlas connection string
- Groq API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root with these variables:

```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` - start the local development server
- `npm run lint` - run ESLint
- `npm run build` - create a production build
- `npm start` - start the production server after building

## Project Structure

- `app/page.tsx` - complaint form and complaint list UI
- `app/api/complaints/route.js` - complaint API route
- `lib/dbConnect.js` - reusable MongoDB connection helper
- `lib/ai.js` - complaint categorization helper
- `models/Complaint.js` - mongoose complaint model

## API Endpoints

- `POST /api/complaints` - create a complaint
- `GET /api/complaints` - fetch all complaints

## Notes for Team Members

- The app expects `MONGO_URI` and `GROQ_API_KEY` to be set locally before running.
- Complaints are sorted by priority and then by newest first in the backend.
- The AI helper falls back to `Other` if categorization fails.
