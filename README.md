# Finance Control - Frontend

A React + TypeScript personal finance management application built with Vite. This PWA-ready frontend connects to a Spring Boot backend API.

## 🚀 Features

- **Authentication**: Login and Register with Basic Auth
- **Wallets Management**: Create and view wallets
- **Transactions**: Create, list, filter, and delete transactions
- **PWA Ready**: Installable on mobile devices with offline support
- **Responsive Design**: Works on desktop and mobile

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (Spring Boot)

## 🛠️ Installation

```bash
# Clone the repository (if not already done)
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

## ⚙️ Configuration

Edit `.env.local` to configure the API URL:

```bash
# Local development (default)
VITE_API_URL=http://localhost:8080

# Docker (reaching host from container)
VITE_API_URL=http://host.docker.internal:8080

# Production
VITE_API_URL=https://your-api-domain.com
```

## 🏃 Running Locally

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

## 🔨 Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🐳 Docker

### Build and Run with Docker Compose

```bash
# Build and start the container
docker compose up --build

# The app will be available at http://localhost:5173
```

### Build Docker Image Manually

```bash
# Build the image
docker build -t financecontrol-frontend .

# Run the container
docker run -p 5173:80 financecontrol-frontend
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icon-*.png         # PWA icons (placeholders)
├── src/
│   ├── components/
│   │   ├── NavBar.tsx     # Navigation bar
│   │   └── Toast.tsx      # Toast notifications
│   ├── context/
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/
│   │   └── api.ts         # API client helpers
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── WalletsPage.tsx
│   │   └── WalletDetailPage.tsx
│   ├── types/
│   │   └── dtos.ts        # TypeScript interfaces
│   ├── App.tsx            # Main app with routes
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose config
├── nginx.conf             # Nginx config for SPA
└── package.json
```

## 🔐 Authentication

This app uses **HTTP Basic Authentication**. Credentials are stored in `sessionStorage` as base64 encoded `username:password`.

### How it works:
1. User enters username/password on login page
2. Credentials are encoded and stored in sessionStorage
3. All API requests include `Authorization: Basic <credentials>` header
4. On logout, credentials are cleared from sessionStorage

### Testing with curl:
```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login (using Basic Auth)
curl -X POST http://localhost:8080/api/auth/login \
  -u testuser:password123

# Get wallets (authenticated)
curl http://localhost:8080/api/wallets \
  -u testuser:password123
```

## 🌐 API Endpoints

The frontend interacts with these backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Validate credentials |
| GET | `/api/wallets` | List user's wallets |
| POST | `/api/wallets` | Create new wallet |
| GET | `/api/wallets/{id}` | Get wallet details |
| GET | `/api/wallets/{id}/transactions` | List transactions |
| POST | `/api/wallets/{id}/transactions` | Create transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |

### Query Parameters for Transactions:
- `type`: Filter by DEBIT or CREDIT
- `fromDate`: Filter from date (YYYY-MM-DD)
- `toDate`: Filter to date (YYYY-MM-DD)

## 📱 PWA Installation

The app can be installed as a Progressive Web App:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use "Add to Home Screen" on mobile

**Note**: Replace the placeholder icons in `/public/icon-192.png` and `/public/icon-512.png` with actual PNG images.

## 🧪 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🔧 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing
- **CSS Variables** - Theming

## 📝 Notes

- The app uses `sessionStorage` for credentials (cleared on browser close)
- API errors are handled and displayed via Toast notifications
- All forms have client-side validation
- The app is responsive and mobile-friendly

## 🐛 Troubleshooting

### CORS Issues
Make sure your backend allows requests from `http://localhost:5173`

### API Connection
Verify `VITE_API_URL` is set correctly and the backend is running

### Docker on Linux
Add this to docker-compose.yml if `host.docker.internal` doesn't work:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

## 📄 License

MIT
