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
2. install dependencies
    npm install
3.start the application 
    # development mode (with auto-restart)
    npm run dev

    #production mode
    npm start
4.Access the application 
    open browser and go to http://localhost:3000


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