# Casa - Couple App 🏠❤️

A minimalist and private web application designed for couples to organize their daily lives, featuring a shared calendar with intelligent event styling, conflict detection, and a real-time synchronized shopping list.

## ✨ Features

*   **Shared Calendar**: View events in Month, Week, Day, or Agenda formats.
*   **Dynamic Styling**: Events automatically get categorized with vibrant colors and icons based on keywords (e.g., "médico", "cena", "gym", "viaje").
*   **Overlap Prevention**: Built-in backend validation prevents scheduling conflicts and overlapping events.
*   **Shopping List**: A synchronized, real-time checklist to keep track of groceries and shared needs.
*   **Dark Mode Support**: Full global toggle between Light and Dark themes for comfortable viewing at any hour.
*   **Private Spaces**: Secure authentication system with "Invite Codes" to link two accounts into a single shared space.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, Lucide React, React Big Calendar.
*   **Backend**: Node.js, Express.js, Prisma ORM (v6).
*   **Database**: SQLite (via Prisma).
*   **Authentication**: JSON Web Tokens (JWT) & bcrypt.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/leobv/CalendarForCouples.git
cd CalendarForCouples
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and initialize the database:
```bash
cd backend
npm install

# Initialize Prisma SQLite Database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**(Optional) Seed the database:**
If you want to create a test user (`test@test.com` / `password123`) with some sample calendar events and shopping items:
```bash
npm run seed
```

**Start the Backend Server:**
```bash
npm run dev
```
The API will run on `http://localhost:5000`.

---

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the development server:
```bash
cd frontend
npm install

# Start the React App
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📝 Usage

1. Open `http://localhost:5173` in your browser.
2. In the "**Crear espacio**" tab, enter your Name, Email, and Password. Leave the Invite Code blank to generate a new space.
3. Once logged in, you can add events to the calendar or items to the shopping list.
4. To link your partner's account, look at your database or backend logs for the generated `inviteCode` (or implement a UI to share it), and have them sign up using that code.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is open source.
