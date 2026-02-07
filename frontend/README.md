# StockMeister - Restaurant Management System

StockMeister is a full-stack web application designed to help restaurants manage their stock, calculate costs, and minimize waste efficiently. This repository contains the **Frontend** of the application, built with modern web technologies.

## 🚀 Tech Stack

* **Core:** React 19 + Vite (Fast & Modern Build Tool)
* **UI Framework:** Material UI (MUI) v6
* **HTTP Client:** Axios
* **Routing:** React Router DOM (v7)
* **State Management:** React Hooks (useState, useEffect)

## 🏗️ Project Structure

The frontend communicates with the Java Spring Boot Backend via RESTful APIs.

* **Port:** Runs on `http://localhost:5173` by default.
* **Backend Connection:** Configured to talk to `http://localhost:8080`.

## 🛠️ Installation & Setup

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the local URL provided by Vite.

## ✅ Current Features

* **Backend Health Check:** Real-time connection testing with the Spring Boot backend to ensure system integrity.
* **Responsive UI:** Built with Material UI components for a clean and mobile-friendly experience.

## 🔜 Future Roadmap

* User Authentication (Login/Register screens with JWT).
* Dashboard for stock visualization.
* Recipe costing modules.

---
*Developed for the StockMeister Project.*