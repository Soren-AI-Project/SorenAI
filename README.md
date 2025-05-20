# SorenAI

SorenAI is a web application designed for agricultural management. It allows users (Admins, Technicians, and Farmers) to manage land plots, track crop analysis, and facilitate communication between different user roles. The application is built using Next.js for the frontend and Supabase for backend services and database.

## Tech Stack

*   Next.js
*   React
*   TypeScript
*   Tailwind CSS
*   Supabase (Authentication, PostgreSQL Database)

## Features

*   **User Authentication:** Secure login, logout, and password reset functionality.
*   **Role-Based Access Control:** Differentiated experiences for Admin, Technician, and Farmer roles.
*   **Dashboard:** Centralized overview of plots, messages, and recent activity.
*   **Parcela (Plot) Management:** View a list of plots and detailed information for each.
*   **Crop Analysis:** Functionality to initiate and review crop analyses (placeholder for "Analizar cultivos" button).

## Database Schema Overview

The database is managed using Supabase (PostgreSQL). The key tables include:

*   `empresa`: Stores information about companies.
*   `admin`: Manages administrator users, linked to an `empresa`.
*   `tecnico`: Manages technician users, linked to an `admin`.
*   `agricultor`: Manages farmer users, potentially linked to a `tecnico`.
*   `parcela`: Stores details about land plots, linked to an `agricultor`.
*   `analitica`: Stores results and data from crop analyses, linked to a `parcela`.

(Refer to `bbdd.sql` for the complete schema details.)

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up Supabase:**
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   In your Supabase project, navigate to 'Project Settings' > 'API'.
    *   Find your Project URL and your `anon` public key.
    *   Create a new file named `.env.local` in the root of your cloned project.
    *   Add the following lines to `.env.local`, replacing the placeholders with your actual Supabase credentials:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Execute the `bbdd.sql` script in your Supabase SQL editor (Navigate to 'SQL Editor' > 'New query' in your Supabase project dashboard) to set up the necessary database tables and relationships.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application should now be running on [http://localhost:3000](http://localhost:3000).

## Available Scripts

In the project directory, you can run:

*   `npm run dev` or `yarn dev`
    *   Runs the app in development mode using Next.js with Turbopack.
    *   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

*   `npm run build` or `yarn build`
    *   Builds the application for production usage.

*   `npm run start` or `yarn start`
    *   Starts a Next.js production server.

*   `npm run lint` or `yarn lint`
    *   Runs the Next.js linter (`next lint`).
