# SHP (SubhanHostPanel)

A complete professional hosting management and billing platform - a WHMCS-style alternative designed for hosting companies.

![SHP Dashboard](https://via.placeholder.com/800x400/0f0f1a/6366f1?text=SHP+Dashboard)

## Features

### User Features
- **Authentication**: Login with Email, Google, or Discord
- **Dashboard**: Overview of servers, orders, and SHP Coins
- **Server Management**: Start, stop, restart servers via Pterodactyl
- **Products**: Browse and purchase Minecraft, VPS, Game, and Bot hosting
- **Billing**: View invoices, orders, and payment history
- **SHP Coins**: Virtual currency system for purchases and renewals
- **Profile**: Manage account settings and connected accounts

### Admin Features
- **Dashboard**: Platform overview with statistics
- **User Management**: View, edit, and manage users
- **Coin Management**: Give/remove SHP Coins from users
- **Product Management**: Create, edit, delete hosting products
- **Order Management**: View and manage all orders
- **Server Management**: Suspend, unsuspend, delete servers
- **Pterodactyl Integration**: Connect multiple Pterodactyl panels
- **Settings**: Customize branding, theme, and coin settings

### White-Label Customization
- Change panel name, logo, and branding
- Customize colors, fonts, and theme
- Custom CSS editor
- Background builder (color, gradient, image, GIF, video)

## Tech Stack

### Frontend
- **React.js** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **React Bootstrap** & **Bootstrap 5** for UI components
- **Framer Motion** for animations
- **React Icons** for icons

### Backend
- **Node.js** with Express.js
- **Prisma ORM** for database
- **MySQL/MariaDB** database
- **Firebase Authentication**
- **Socket.IO** for real-time updates
- **Nodemailer** for emails

## Installation

### Prerequisites
- Node.js 18+
- MySQL 8+ or MariaDB 10.6+
- Firebase project

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/shp.git
cd shp
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# - DATABASE_URL
# - Firebase credentials
# - JWT_SECRET
# - Email settings

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Firebase config
# VITE_FIREBASE_API_KEY
# VITE_FIREBASE_AUTH_DOMAIN
# etc.

# Start development server
npm run dev
```

### 4. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google)
3. Copy the Firebase config to your frontend `.env`
4. Generate a service account key for the backend
5. Add the service account credentials to backend `.env`

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/shp_db"

# Firebase Admin SDK
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@yourpanel.com"

# Payment Gateways (Optional)
STRIPE_SECRET_KEY="sk_test_..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# Discord Webhook (Optional)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Frontend (.env)
```env
VITE_API_URL="/api"
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"
```

## Project Structure

```
SHP/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── server.js          # Entry point
│   ├── uploads/               # Uploaded files
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # Reusable components
│   │   ├── config/            # Configuration
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand stores
│   │   ├── App.jsx            # Main app
│   │   └── main.jsx           # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories/list` - List categories

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details

### Servers
- `GET /api/servers` - List user servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `POST /api/servers/:id/restart` - Restart server
- `POST /api/servers/:id/renew` - Renew server

### Coins
- `GET /api/coins/balance` - Get coin balance
- `GET /api/coins/transactions` - Get transaction history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/coins` - Give/remove coins
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `GET /api/admin/servers` - List all servers
- `POST /api/admin/servers/:id/suspend` - Suspend server
- `GET /api/admin/pterodactyl` - List Pterodactyl panels
- `POST /api/admin/pterodactyl` - Add Pterodactyl panel

## SHP Coins System

SHP Coins is a virtual currency that users can use to purchase hosting services.

### Earning Coins
- **Signup Bonus**: New users receive coins on registration
- **Daily Login**: Users can claim daily rewards
- **Referral**: Earn coins when referred users make purchases
- **Admin Grant**: Admins can manually add coins

### Spending Coins
- Purchase hosting products
- Renew existing servers
- Buy addons

### Configuring Coins
Admins can configure coin settings in the admin panel:
- Enable/disable coins
- Signup reward amount
- Daily reward amount
- Referral reward amount

## Pterodactyl Integration

SHP integrates with Pterodactyl Panel for server management.

### Setting Up Pterodactyl
1. Go to Admin → Pterodactyl
2. Click "Add Panel"
3. Enter panel details:
   - Name
   - Panel URL
   - Application API Key
   - (Optional) Client API Key
4. Click "Test Connection" to verify
5. Save

### Automatic Server Creation
When a user purchases a product:
1. SHP creates a Pterodactyl user (if needed)
2. Creates a server with the product's specifications
3. Assigns resources (RAM, CPU, Disk)
4. Sends connection details to the user

## Security

- Firebase Authentication for secure login
- JWT tokens for API authentication
- Role-based access control (user, admin, superadmin)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js for security headers

## License

MIT License - See LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact support@subhanhostpanel.com.

---

Built with ❤️ by Subhan#   S H P  
 #   S H P  
 #   S H P  
 #   S H P  
 