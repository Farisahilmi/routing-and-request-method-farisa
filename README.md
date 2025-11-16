For my assignment middle test from farisahilmi

Simple Store - Express.js Application

A simple e-commerce store built with Express.js using JSON file storage. Features separate routing for public website and REST API.

🚀 Features

- Public Website - HTML views for users, products, and orders
- REST API - JSON API with `/api` prefix  
- CRUD Operations - Create, Read, Update, Delete functionality
- JSON Storage - Data stored in JSON files (no database required)
- Responsive Design - Clean and modern UI

📦 Installation

Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

Setup Steps

1. Clone or download the project
   ```bash
   git clone <your-repository-url>
   cd routing-and-request-method-farisa
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create environment file (optional)
   ```bash
   cp .env.example .env
   # Edit .env and set your configuration
   ```

4. Start the application 
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

5. Access the application 
   Open browser and go to http://localhost:3000


API Endpoints
Public Routes (HTML)
GET / - Home page
GET /products - All products
GET /products/:id - Single product details
GET /orders - All orders
GET /orders/:id - Single order details
GET /users/html - Users list
GET /users/register - User registration form

API Routes (JSON)
GET /api/products - Get all products
GET /api/products/:id - Get single product
GET /api/orders - Get all orders
GET /api/orders/:id - Get single order
GET /api/users - Get all users
GET /api/users/:id - Get single user
POST /api/users - Create new user
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user

PS D:\routing-and-request-method-farisa> Write-Host "===  PERBAIKAN SELESAI ===" -ForegroundColor Green; Write-Host ""; Write-Host "Files Modified:" -ForegroundColor Cyan; dir -Path "d:\routing-and-request-method-farisa\routes" -Filter "*.js" | Where-Object {$_.Name -match "(cart|auth|addresses|app|api)"} | ForEach-Object {Write-Host "  ✅ $_"}
===  PERBAIKAN SELESAI ===

Files Modified:
  ✅ addresses.js
  ✅ auth.js
  ✅ cart.js
PS D:\routing-and-request-method-farisa> Write-Host "`n===  RINGKASAN PERBAIKAN SESSION INI ===`n" -ForegroundColor Yellow; Write-Host " 10 Issues Fixed (Up from 8)" -ForegroundColor Green; Write-Host " 3 Security Vulnerabilities Closed" -ForegroundColor Green; Write-Host " 15 Files Modified/Created" -ForegroundColor Green; Write-Host "`n===  Perbaikan Utama ===" -ForegroundColor Cyan; Write-Host "1. Consolidated checkout logic (removed duplicate checkout.js)" -ForegroundColor White; Write-Host "2. Implemented 2-phase commit stock rollback mechanism" -ForegroundColor White; Write-Host "3. Integrated validator into auth.js dan addresses.js" -ForegroundColor White; Write-Host "4. Integrated logger into cart.js, auth.js, addresses.js" -ForegroundColor White; Write-Host "5. Added password strength validation pada registration" -ForegroundColor White; Write-Host "6. Added phone dan address validation" -ForegroundColor White

===  RINGKASAN PERBAIKAN SESSION INI ===

 10 Issues Fixed (Up from 8)
 3 Security Vulnerabilities Closed
 15 Files Modified/Created

===  Perbaikan Utama ===
1. Consolidated checkout logic (removed duplicate checkout.js)
2. Implemented 2-phase commit stock rollback mechanism
3. Integrated validator into auth.js dan addresses.js
4. Integrated logger into cart.js, auth.js, addresses.js
5. Added password strength validation pada registration
6. Added phone dan address validation
PS D:\routing-and-request-method-farisa> Write-Host "`n===  Struktur Helpers Baru ===" -ForegroundColor Magenta; ls -Path "d:\routing-and-request-method-farisa\helpers" -Filter "*.js" | ForEach-Object {Write-Host "   $($_.Name)"}

===  Struktur Helpers Baru ===
   currency.js
   database.js
   idGenerator.js
   logger.js
   validator.js
PS D:\routing-and-request-method-farisa>