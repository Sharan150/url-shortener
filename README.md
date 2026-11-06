# Premium URL Shortener

🚀 **Live Demo:** [https://premium-url-shortener-frontend.onrender.com](https://premium-url-shortener-frontend.onrender.com/)

*(Backup / Vercel mirror: [https://url-shortener-ivory-two.vercel.app](https://url-shortener-ivory-two.vercel.app/))*

A high-performance, enterprise-grade URL shortener built with Spring Boot, Next.js, PostgreSQL, and Redis. a robust Spring Boot backend designed for high concurrency, and a stunning, responsive Next.js frontend.

## 🚀 Tech Stack

### Backend (API & Core Logic)
* **Java 21 & Spring Boot 3**: The core application framework.
* **PostgreSQL**: The primary relational database for persistent storage.
* **Redis**: Used as a high-speed caching layer to handle massive read traffic and defend against cache penetration.
* **Spring Data JPA & Redis**: For seamless database and cache interactions.

### Frontend (User Interface)
* **React (Next.js 15)**: The modern UI framework using App Router.
* **Tailwind CSS 4**: For rapid, beautiful, and responsive styling.
* **Framer Motion**: For fluid, natural micro-interactions and layout animations.
* **Lucide React**: Clean, modern iconography.

### Infrastructure & Deployment
* **Docker & Docker Compose**: The entire stack is containerized for easy local development and single-server deployments.
* **Cloud-Ready Configuration**: Built to deploy seamlessly to platforms like Vercel (Frontend) and Render (Backend) with zero-configuration environment variables.

## 🌟 Key Features

* **Pre-generated Keys (Hydration Pattern)**: The backend pre-computes Base62 encoded Snowflake IDs into a queue, ensuring lightning-fast URL creation with zero database collisions.
* **Cache Penetration Defense**: Protects the database from malicious requests by intelligently caching negative lookups (null values) for short intervals.
* **Premium Editorial UI**: A non-robotic, warm, and highly crafted frontend aesthetic. No harsh generic colors—just smooth transitions and elegant typography.

## 🛠️ Local Development

### Prerequisites
* Java 21
* Node.js (v20+)
* Docker (for the database and cache)

### Starting the Infrastructure
First, start PostgreSQL and Redis using Docker:
```bash
docker compose up -d postgres redis
```

### Starting the Backend (Spring Boot)
Open a new terminal and run:
```bash
./mvnw spring-boot:run
```
*The API will run on `http://localhost:8080`.*

### Starting the Frontend (Next.js)
Open a new terminal and run:
```bash
cd frontend
npm install
npm run dev
```
*The UI will run on `http://localhost:3000`.*

## ☁️ One-Click Deployment

Because your code is already on GitHub, you can deploy the frontend and backend instantly by clicking the buttons below!

### 1. Deploy the Backend
Click this button to deploy the Spring Boot API to Render. It will automatically ask you for your database passwords.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Sharan150/url_shortener)

*Note: You will need to enter your `SPRING_DATASOURCE_URL` (the `jdbc:postgresql://db.aqjukgt...` URL you got from Supabase), your Supabase password, and your Upstash Redis credentials.*

### 2. Deploy the Frontend
Once your backend is running, copy its URL and click this button to deploy the Next.js UI to Vercel. 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSharan150%2Furl_shortener&root-directory=frontend)

*Note: Vercel will ask you for a `BACKEND_URL` environment variable. Paste the URL that Render gave you in the previous step!*
404