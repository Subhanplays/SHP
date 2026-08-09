# SHP (SubhanHostPanel)

A complete professional hosting management and billing platform - a WHMCS-style alternative designed for hosting companies.

## Screenshots

### Landing Page
![SHP Landing Page](https://media.discordapp.net/attachments/1529937923456110694/1536078993701212201/Screenshot_2026-08-09_232400.png?ex=6a7a188b&is=6a78c70b&hm=80fb08bc5b8b63bc906c2d570b9a9f37391cc22c242288a6814d00ffcd753552&=&format=webp&quality=lossless&width=2048&height=1119)

### Dashboard
![SHP Dashboard](https://media.discordapp.net/attachments/1529937923456110694/1536078994040946840/Screenshot_2026-08-09_232447.png?ex=6a7a188b&is=6a78c70b&hm=e14287944767816d2f4a9e5b6e6e65d92ad5facdeb404302384e8ad2cee89ef3&=&format=webp&quality=lossless&width=2048&height=1119)

### My Server
![SHP My Server](https://media.discordapp.net/attachments/1529937923456110694/1536078994494062673/Screenshot_2026-08-09_232456.png?ex=6a7a188b&is=6a78c70b&hm=2516566d00ce5759bf56346cd0ba9b2353e063c15f04352988c00a2244945ac9&=&format=webp&quality=lossless&width=2048&height=1119)

### Products
![SHP Products](https://media.discordapp.net/attachments/1529937923456110694/1536078995324543149/Screenshot_2026-08-09_232504.png?ex=6a7a188b&is=6a78c70b&hm=a59d934ccf87da0b7ef3f737f80773d85f1510ea6aab9a616d942bf8455090b1&=&format=webp&quality=lossless&width=2048&height=1131)

### Order
![SHP Order](https://media.discordapp.net/attachments/1529937923456110694/1536078995727319210/Screenshot_2026-08-09_232514.png?ex=6a7a188b&is=6a78c70b&hm=800d477cc78fbc798063e30f6e92124d4bbeec584322510497cacd43b357c9a2&=&format=webp&quality=lossless&width=2048&height=1113)

### Billing Page
![SHP Billing Page](https://media.discordapp.net/attachments/1529937923456110694/1536078996247420988/Screenshot_2026-08-09_232523.png?ex=6a7a188b&is=6a78c70b&hm=fd59592ad17f0529a56282775affe0eeb02c2f2bdf8ca04ce03afab28d90cb86&=&format=webp&quality=lossless&width=2048&height=1116)

### Profile
![SHP Profile](https://media.discordapp.net/attachments/1529937923456110694/1536078996712849550/Screenshot_2026-08-09_232533.png?ex=6a7a188b&is=6a78c70b&hm=b167ab253785b428e41e12b69482c8173610ef115c3ef31875a89318ccf9a82d&=&format=webp&quality=lossless&width=2048&height=1110)

## Features

### User Features
- **Authentication**: Register and login with email + password
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
- **SQLite** (via Node's built-in `node:sqlite` - no external database needed)
- **JWT** + **bcrypt** authentication (email/password)
- **Socket.IO** for real-time updates
- **Nodemailer** for emails

## Installation

### Prerequisites
- Node.js 22.5+ (SQLite support built in; tested on Node 24)

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
# - JWT_SECRET (change this!)
# - ADMIN_EMAIL / ADMIN_PASSWORD (initial admin account)
# - Email settings (optional)

# Create the admin user and default settings
npm run seed

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### 4. Log In
Open http://localhost:5173 and sign in with the admin account created by
`npm run seed` (defaults: `admin@shp.com` / `admin123`).

## Environment Variables

### Backend (.env)
```env
# JWT Secret (change this!)
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Initial admin account (used by `npm run seed`)
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@shp.com"
ADMIN_PASSWORD="admin123"

# SQLite database file (optional - defaults to ./data/shp.db)
DATABASE_PATH="./data/shp.db"

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

# OAuth (Optional - Google & Discord social login)
BACKEND_URL="http://localhost:5000"
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:5000/api"
```

## Project Structure

```
SHP/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/            # Configuration files (SQLite database layer)
â”‚   â”‚   â”œâ”€â”€ middleware/        # Express middleware
â”‚   â”‚   â”œâ”€â”€ routes/            # API routes
â”‚   â”‚   â”œâ”€â”€ services/          # Business logic
â”‚   â”‚   â”œâ”€â”€ utils/             # Utility functions
â”‚   â”‚   â””â”€â”€ server.js          # Entry point
â”‚   â”œâ”€â”€ scripts/               # Setup scripts (seed.js)
â”‚   â”œâ”€â”€ data/                  # SQLite database file
â”‚   â”œâ”€â”€ uploads/               # Uploaded files
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ api/               # API client
â”‚   â”‚   â”œâ”€â”€ components/        # Reusable components
â”‚   â”‚   â”œâ”€â”€ layouts/           # Page layouts
â”‚   â”‚   â”œâ”€â”€ pages/             # Page components
â”‚   â”‚   â”œâ”€â”€ store/             # Zustand stores
â”‚   â”‚   â”œâ”€â”€ App.jsx            # Main app
â”‚   â”‚   â””â”€â”€ main.jsx           # Entry point
â”‚   â””â”€â”€ package.json
â”‚
â””â”€â”€ README.md
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
- `POST /api/coins/daily-reward` - Claim daily reward
- `GET /api/coins/referral` - Get referral code and referrals

### Coupons
- `GET /api/coupons/validate` - Validate a coupon code
- `GET /api/coupons` - List active public coupons
- `POST /api/coupons/admin` - Create coupon (admin)
- `PUT /api/coupons/admin/:id` - Update coupon (admin)
- `DELETE /api/coupons/admin/:id` - Delete coupon (admin)

### Payments
- `POST /api/payments/checkout` - Create a checkout session
- `POST /api/payments/complete` - Confirm a payment
- `POST /api/payments/buy-coins` - Purchase SHP Coins
- `POST /api/payments/webhook` - Payment provider webhook

### Media
- `GET /api/media` - List uploaded files
- `POST /api/media/upload` - Upload a file (admin)
- `DELETE /api/media/:id` - Delete a file (admin)

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting (admin)
- `PATCH /api/settings/bulk` - Update multiple settings (admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/coins` - Give/remove coins
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/servers` - List all servers
- `POST /api/admin/servers/:id/suspend` - Suspend server
- `POST /api/admin/servers/:id/unsuspend` - Unsuspend server
- `DELETE /api/admin/servers/:id` - Delete server
- `POST /api/admin/servers/:id/provision` - Retry provisioning
- `GET /api/admin/coins/transactions` - List coin transactions
- `GET /api/admin/logs` - View activity logs
- `GET /api/admin/pterodactyl` - List Pterodactyl panels
- `POST /api/admin/pterodactyl` - Add Pterodactyl panel
- `PUT /api/admin/pterodactyl/:id` - Update panel
- `DELETE /api/admin/pterodactyl/:id` - Delete panel
- `POST /api/admin/pterodactyl/test` - Test panel connection

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
1. Go to Admin â†’ Pterodactyl
2. Click "Add Panel"
3. Enter panel details:
   - Name
   - Panel URL
   - Application API Key
   - (Optional) Client API Key
4. Click "Test Connection" to verify
5. Save

### Automatic Server Creation
When a user purchases a product:1. SHP creates a Pterodactyl user (if needed)
2. Creates a server with the product's specifications
3. Assigns resources (RAM, CPU, Disk)
4. Sends connection details to the user

## Social Login (Google & Discord)

Optional OAuth sign-in is supported. After the OAuth flow, the backend redirects
to `${FRONTEND_URL}/auth/social` with a signed-in session.

### Google
1. Create a project at https://console.cloud.google.com -> APIs & Services -> Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Copy the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### Discord
1. Create an app at https://discord.com/developers/applications -> OAuth2
2. Add redirect: `http://localhost:5000/api/auth/discord/callback`
3. Copy the client ID/secret into `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`

Then restart the backend. The Google/Discord buttons appear on the login and
register pages.

## Security

- JWT tokens for API authentication
- bcrypt password hashing
- Role-based access control (user, admin, superadmin)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js for security headers

## SQLite Data Model

The app uses a single-file SQLite database (default `backend/data/shp.db`),
created automatically on first start. Tables are created automatically - no
database setup is required.

The data layer in `backend/src/config/database.js` exposes a Prisma-style API
(`db.user.findMany({ where, include, orderBy, ... })`) built on Node's built-in
`node:sqlite` module, so no ORM or external database server is needed.

Tables: `users`, `products`, `orders`, `order_items`, `servers`, `invoices`,
`payments`, `coin_transactions`, `media`, `settings`, `pterodactyl_panels`,
`coupons`, `referrals`, `logs`, `notifications`.

Relations are stored as foreign-key columns (e.g. `order.userId`,
`server.orderId`) and resolved at query time. Settings use the setting `key` as
the primary key.

## License

MIT License - See LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact support@subhanhostpanel.com.

---

Built with love by Subhan
