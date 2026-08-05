# 🚀 SHP (SubhanHostPanel)

![SHP Banner](https://via.placeholder.com/1200x500/0f0f1a/6366f1?text=SHP+SubhanHostPanel)

**SHP (SubhanHostPanel)** is a complete professional hosting management and billing platform.

It is a WHMCS-style alternative designed for hosting companies, allowing you to sell Minecraft hosting, VPS, game servers, bot hosting, and other digital services with automatic provisioning through Pterodactyl.

---

## ✨ Features

# 👤 User Features

### Authentication
- Login/Register with Email & Password
- Google Authentication
- Discord Authentication
- Firebase-powered secure authentication

### User Dashboard
- View active servers
- View orders
- View invoices
- Manage SHP Coins
- Account statistics

### Server Management
- Start servers
- Stop servers
- Restart servers
- View server information
- Automatic Pterodactyl synchronization

### Hosting Store
Users can purchase:

- Minecraft Hosting
- VPS Hosting
- Game Servers
- Bot Hosting
- Custom Products

### Billing System
- Order management
- Invoice system
- Payment history
- Server renewals

### SHP Coins System
Virtual currency system:

- Buy hosting using coins
- Receive signup rewards
- Daily rewards
- Referral rewards
- Admin coin management


---

# 🛠 Admin Features

## Admin Dashboard

- Total users statistics
- Total servers
- Revenue overview
- Order analytics

## User Management

- View users
- Edit users
- Ban users
- Manage roles

## Coin Management

Admins can:

- Add coins
- Remove coins
- Configure rewards
- Manage coin economy

## Product Management

Create and manage:

- Minecraft plans
- VPS plans
- Game server plans
- Bot hosting plans

Features:

- RAM
- CPU
- Storage
- Database limits
- Pricing
- Coin pricing


## Pterodactyl Management

- Connect multiple Pterodactyl panels
- Manage API keys
- Test panel connection
- Automatic server creation


---

# 🎨 White Label Customization

Fully customize your hosting panel:

- Change panel name
- Change logo
- Change favicon
- Change colors
- Custom themes
- Custom CSS
- Background customization

Supported backgrounds:

- Solid colors
- Gradients
- Images
- GIFs
- Videos


---

# ⚙️ Tech Stack

## Frontend

- React.js
- Vite
- React Router
- Zustand
- Bootstrap 5
- React Bootstrap
- Framer Motion
- React Icons


## Backend

- Node.js
- Express.js
- Prisma ORM
- MySQL / MariaDB
- Firebase Authentication
- Socket.IO
- Nodemailer


---

# 📦 Installation


## Requirements

- Node.js 18+
- MySQL 8+ / MariaDB 10.6+
- Firebase Project
- Pterodactyl Panel


---

## Clone Repository

```bash
git clone https://github.com/Subhanplays/SHP.git

cd SHP
````

---

# Backend Setup

```bash
cd backend

npm install
```

Create environment file:

```bash
cp .env.example .env
```

Configure:

```
DATABASE_URL

FIREBASE SETTINGS

JWT SECRET

SMTP SETTINGS
```

Run database:

```bash
npx prisma generate

npx prisma migrate dev
```

Start backend:

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd frontend

npm install
```

Create environment:

```bash
cp .env.example .env
```

Start frontend:

```bash
npm run dev
```

---

# 🔥 Firebase Setup

1. Create a Firebase project

[https://console.firebase.google.com](https://console.firebase.google.com)

2. Enable:

* Email Authentication
* Google Authentication
* Discord Authentication

3. Add Firebase configuration to frontend `.env`

4. Add Firebase Admin credentials to backend `.env`

---

# 🔐 Environment Variables

## Backend `.env`

```env
DATABASE_URL="mysql://user:password@localhost:3306/shp"

PORT=5000

NODE_ENV=development

JWT_SECRET="your-secret"


FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""


SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""


DISCORD_WEBHOOK_URL=""
```

## Frontend `.env`

```env
VITE_API_URL="/api"

VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_APP_ID=""
```

---

# 📁 Project Structure

```
SHP/

├── backend/

│   ├── prisma/

│   ├── src/

│   │   ├── routes/

│   │   ├── services/

│   │   ├── middleware/

│   │   └── server.js

│   └── package.json


├── frontend/

│   ├── public/

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   ├── store/

│   │   └── App.jsx

│   └── package.json


└── README.md
```

---

# 🔌 API Features

## Authentication

```
POST /api/auth/register

POST /api/auth/login

GET /api/auth/me
```

## Products

```
GET /api/products

GET /api/products/:id
```

## Orders

```
POST /api/orders/create

GET /api/orders
```

## Servers

```
GET /api/servers

POST /api/servers/:id/start

POST /api/servers/:id/stop

POST /api/servers/:id/restart
```

## Coins

```
GET /api/coins/balance

GET /api/coins/history
```

## Admin

```
GET /api/admin/dashboard

GET /api/admin/users

POST /api/admin/products

POST /api/admin/pterodactyl
```

---

# 🪙 SHP Coins System

SHP Coins are a virtual currency used inside the platform.

## Users Can Earn Coins

* Signup rewards
* Daily rewards
* Referral rewards
* Admin giveaways

## Users Can Spend Coins

* Purchase servers
* Renew servers
* Buy addons

Admins can control:

* Coin value
* Rewards
* User balances

---

# 🐳 Pterodactyl Integration

SHP automatically creates servers after purchase.

Process:

1. User buys hosting plan

2. SHP creates Pterodactyl user

3. SHP creates server

4. Resources are assigned:

* RAM
* CPU
* Disk
* Database

5. User receives server details

---

# 🔒 Security

Implemented security:

* Firebase Authentication
* JWT Authentication
* Role-based permissions
* Input validation
* Rate limiting
* Helmet.js
* CORS protection

---

# 📜 License

MIT License

---

# 💬 Support

For support:

Create a GitHub issue or contact:

[subhan@subhanplays.qzz.io](mailto:subhan@subhanplays.qzz.io)

---

<div align="center">

## Built with ❤️ by Subhan

### SHP - SubhanHostPanel
