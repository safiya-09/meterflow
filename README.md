# 🚀 MeterFlow – Usage-Based API Billing Platform

MeterFlow is a full-stack SaaS platform that enables developers to create, manage, and monetize APIs with **usage-based billing**, **rate limiting**, and **real-time analytics**.

Inspired by platforms like Stripe, RapidAPI, and OpenAI, MeterFlow simulates a real-world API monetization system with a powerful gateway layer.

---

## 🌐 Live Demo
Coming Soon...

---

## 📌 Features

### 🔐 Authentication & Authorization
- JWT-based login/signup
- Role-based access (Admin, API Owner, Consumer)
- Secure token handling

### ⚙️ API Management
- Create and manage APIs
- Store API metadata (base URL, version, description)
- CRUD operations for APIs

### 🔑 API Key System
- Generate API keys
- Revoke and rotate keys
- Secure hashed key storage

### 🚀 API Gateway (Core Feature)
- Central gateway for all API requests
- API key validation
- Request forwarding to external APIs
- Middleware-based architecture

### 📊 Usage Tracking & Logging
- Track every API request
- Store:
  - API key
  - Endpoint
  - Timestamp
  - Status code
  - Latency
- Real-time logs dashboard

### ⚡ Rate Limiting (Redis Powered)
- Per API key rate limiting
- Plan-based limits:
  - Free: 100 req/hour
  - Pro: 1000 req/hour
  - Enterprise: 10000 req/hour
- Redis-based atomic counters

### 💰 Billing Engine
- Usage-based billing system
- Tracks requests per user
- Calculates cost dynamically
- Monthly billing summary

### 💳 Payment Integration
- Stripe & Razorpay support
- Subscription plans (Free, Pro, Growth)
- Payment history
- Webhook-based verification

### 📈 Dashboard & Analytics
- Total requests
- Active APIs & API keys
- Revenue tracking
- Usage charts (Recharts)
- Error vs success metrics

---

## 🧱 Tech Stack

### Frontend
- React
- Tailwind CSS
- React Query
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Infrastructure
- Redis (Rate Limiting & Caching)
- Socket.io (optional realtime)
- BullMQ (for background jobs)

---

## 🗄️ Database Design

### Users
- id, email, password, role, plan

### APIs
- id, userId, name, baseUrl, description

### API Keys
- id, apiId, key (hashed), status, plan

### Usage Logs
- id, apiKey, endpoint, timestamp, statusCode, latency

### Billing
- userId, totalRequests, amountDue

### Payments
- provider, paymentId, amount, status

---

## 🏗️ Project Structure
