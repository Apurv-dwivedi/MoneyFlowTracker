# 💸 Money Flow Tracker

A robust, production-ready Full-Stack Personal Finance Management application designed to track expenses, manage budgets, and provide intelligent financial insights. Built with a secure Spring Boot backend and a responsive, dynamic HTML/JS frontend.

## ✨ Key Features

### 🛡️ Security & Authentication
* **JWT-Based Authentication:** Secure login and registration system with stateless sessions.
* **BCrypt Password Encryption:** Passwords are fully encrypted in the database.
* **OTP Password Recovery:** Secure "Forgot Password" flow with automated OTP emails.
* **Hidden Vault:** PIN-protected compartment to hide sensitive transactions.

### 📊 Financial Management
* **Dynamic Transactions:** Track Income, Expenses, Savings, Rent, and Emergency Funds.
* **Custom Categories:** Add and delete personalized expense categories (saved to DB).
* **50/30/20 Budgeting Engine:** Real-time visual tracking of Needs, Wants, and Savings limits.
* **Executive Advisory Engine:** Automated financial telemetry and capital compounding forecasts based on daily spending habits.

### ☁️ Cloud & Database Integration
* **Persistent User Profiles:** Upload and save high-res profile avatars, bios, and occupations directly to MySQL.
* **Automated Email Scheduler:** Spring Boot `@Scheduled` cron jobs send automated monthly financial check-in emails to users.
* **Global Error Handling:** Clean API error responses using `@ControllerAdvice`.

### 🎨 UI / UX & Exports
* **Glassmorphic Design:** Modern, adaptive UI with Light/Dark mode toggles.
* **Advanced Analytics:** 15-day trend lines and category-wise pie charts (using Chart.js).
* **Data Export:** Download complete financial reports in multi-page PDF format or export raw data to CSV.

---

## 🛠️ Tech Stack

**Backend:**
* Java 17+
* Spring Boot (v4.1.1)
* Spring Security & JWT
* Spring Data JPA / Hibernate
* Jakarta Mail (for automated emails)

**Frontend:**
* HTML5, CSS3, JavaScript (ES6+)
* Chart.js (Data Visualization)
* html2canvas & jsPDF (Report Generation)

**Database:**
* MySQL (Relational Database)

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
* JDK 17 or higher
* Maven
* MySQL Workbench / Server

### 1. Database Setup
Create a new database in MySQL:
```sql
CREATE DATABASE money_tracker;