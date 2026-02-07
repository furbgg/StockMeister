# 🍽️ StockMeister

A modern restaurant management platform for inventory control, waste tracking, and seamless POS operations.

*Ein modernes Restaurant-Management-System für Lagerverwaltung, Abfallkontrolle und nahtlosen Kassenbetrieb.*

---

## What is StockMeister?

Running a restaurant means juggling a lot – keeping track of ingredients, managing recipes, reducing waste, and handling orders efficiently. StockMeister brings all of that together in one clean, easy-to-use interface.

Whether you're a small café or a busy restaurant kitchen, this system helps you stay on top of your stock levels, calculate recipe costs automatically, and keep an eye on where your money is going.

**Was ist StockMeister?**

Ein Restaurant zu führen bedeutet, viele Dinge gleichzeitig im Blick zu behalten – Zutaten verfolgen, Rezepte verwalten, Abfall reduzieren und Bestellungen effizient abwickeln. StockMeister bringt all das in einer übersichtlichen Oberfläche zusammen.

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| 📦 **Inventory Tracking** | Real-time stock levels with low-stock alerts |
| 🍳 **Recipe Management** | Cost calculation based on ingredient prices |
| 🗑️ **Waste Logging** | Track waste and get insights to reduce losses |
| 💳 **Point of Sale** | Quick order processing with multiple payment options |
| 👥 **Staff Management** | Role-based access for your team |
| 🌍 **Multi-Language** | English, German, Turkish, and Bosnian |

---

## Built With

**Backend:**
- Java 17, Spring Boot 3.2
- PostgreSQL, JPA/Hibernate
- JWT Authentication

**Frontend:**
- React 18, TypeScript
- Vite, TailwindCSS
- i18next for translations

**Infrastructure:**
- Docker for local development
- Railway-ready for deployment

---

## Getting Started

### What You'll Need
- Java 17+
- Node.js 18+
- Docker

### Setup

1. **Clone the project**
   ```bash
   git clone https://github.com/furbgg/StockMeister.git
   cd StockMeister
   ```

2. **Start the database**
   ```bash
   docker-compose up -d
   ```

3. **Run the backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Run the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - API: http://localhost:8080

### Configuration

For local development, everything works out of the box. For production deployment, create environment variables for sensitive data like database credentials and JWT secrets. Check `.env.example` for reference.

---

## API Overview

The backend exposes RESTful endpoints for all major operations:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `POST /auth/login` | User authentication |
| `GET/POST /api/ingredients` | Manage ingredients |
| `GET/POST /api/recipes` | Manage recipes |
| `GET/POST /api/waste` | Log and track waste |

Full API documentation available via the running application.

---

## Running Tests

```bash
cd backend
./mvnw test
```

The project includes unit tests for services, repository tests for database operations, and controller tests for API validation.

---

## Project Structure

```
StockMeister/
├── backend/          # Spring Boot application
│   ├── src/main/     # Application source code
│   └── src/test/     # Test suites
├── frontend/         # React application
│   ├── src/pages/    # Page components
│   ├── src/i18n/     # Translation files
│   └── src/stores/   # State management
└── docker-compose.yml
```

---

## What's Next? (v2.0 Roadmap)

Some ideas we're exploring for future versions:

- **AI Integration** – Demand forecasting and smart reorder suggestions
- **Enhanced POS** – Table management, split bills, receipt printing
- **Mobile Apps** – Native apps for waitstaff and kitchen displays
- **Advanced Analytics** – Profit margins, supplier comparisons, custom reports
- **Security Upgrades** – HTTPS, 2FA, automated backups

---

## License

This project was developed as part of a vocational training program (Ausbildung).

---

*Built with care for real-world restaurant operations.* 🍴
