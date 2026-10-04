# TenderVault - Tender Management System

TenderVault is a full-stack web application that manages the tender procurement process from start to finish, from posting a tender to awarding the contract. It gives **Contractors** and **Bidders** separate dashboards so the process stays transparent and efficient.

## Features

- Automates the procurement lifecycle: posting tenders, receiving bids, and awarding contracts
- Separate dashboards for **Contractors** and **Bidders**
- Centralized platform for tender and bid information, supporting transparent, data-driven decisions
- Minimalist, modern user interface built with React.js
- Relational data stored in MySQL

<!-- TODO: add or remove features so this list matches exactly what your app does,
     e.g. login/signup, tender deadlines, bid comparison, document upload, status tracking. -->

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MySQL |

## Screenshots

<!-- TODO: add 3-4 screenshots (login page, contractor dashboard, bidder dashboard, tender list).
     Create a folder called "screenshots" in the repo, upload the images, and use:
     ![Contractor Dashboard](screenshots/contractor-dashboard.png) -->

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later) and npm
- [MySQL](https://dev.mysql.com/downloads/) server

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/palak-2526/tendervault.git
   cd tendervault
   ```

2. **Set up the database**
   - Create a MySQL database (for example `tendervault`).
   - Import the SQL file from the repo, if there is one:
     ```bash
     mysql -u root -p tendervault < database.sql
     ```
   <!-- TODO: replace database.sql with your real SQL file name, or list the tables to create. -->

3. **Set up and run the backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file with your database details:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tendervault
   PORT=5000
   ```
   Then start the server:
   ```bash
   npm start
   ```

4. **Set up and run the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. Open the URL shown in the terminal (usually `http://localhost:3000`).

<!-- TODO: check the folder names (backend / frontend), the .env variable names, and the start
     commands against your project, and fix anything that is different. -->

## Project Structure

```
tendervault/
├── backend/     # Express.js server and API routes
├── frontend/    # React.js application
└── README.md
```

<!-- TODO: update this to match your real folders. -->

## Future Improvements

- Email notifications for new tenders and bid results
- Document upload for bid submissions
- Search and filters for tenders
- Deployment to a live URL

<!-- TODO: keep only the ideas you actually plan to build. -->

## Author

**Palak Dwivedi**
B.Tech Computer Science Engineering, Parul University

[GitHub](https://github.com/palak-2526) | [LinkedIn](https://www.linkedin.com/in/palak-dwivedi-a355712a9/) | dpalak256@gmail.com
