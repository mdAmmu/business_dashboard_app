# Zaid Traders - Voice-to-Order System

A comprehensive voice-to-order application tailored for *Zaid Traders*. It processes customer voice messages, transcribes them to text, extracts product information using AI, checks stock availability, handles authentication, and generates automated bills.

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Application

This project uses a **Dual-Server Backend Architecture**. You must run three separate terminal processes to start the application properly.

**1. Start the Voice/Order Backend** (Terminal 1)
This server runs on port `3001` and handles AI transcription, product extraction, and stock management.
```bash
npm run server
```

**2. Start the Authentication Backend** (Terminal 2)
This server runs on port `4000` and handles all login, signup, and user role management via SQLite.
```bash
node server/auth.js
```

**3. Start the Frontend** (Terminal 3)
The Vite frontend automatically proxies API requests to the correct backend ports.
```bash
npm run dev
```

4. **Access the application**:
   - Navigate to the frontend URL provided in Terminal 3 (usually `http://localhost:5173` or `http://localhost:5174`).
   - You can sign up via the UI to create your first account.


## Features

### Core Functionality
- **Voice Processing**: Upload audio files or record voice messages directly in the browser.
- **Speech-to-Text**: Integration with OpenAI Whisper for accurate transcription.
- **AI Product Extraction**: Uses GPT-3.5-turbo to intelligently extract product names and quantities.
- **Stock Management**: Real-time inventory tracking with low stock alerts.
- **Automated Billing**: Generates bills with available items and handles out-of-stock scenarios.
- **Secure Authentication**: Role-based access control (Admin vs User) using JWT and SQLite.

### User Interface
- **Modern Dashboard**: Beautiful, responsive design with real-time analytics.
- **Order Processing**: Intuitive interface for handling voice orders.
- **Stock Manager**: Easy-to-use inventory management with inline editing.
- **Bill Viewer**: Comprehensive bill search and detailed view capabilities.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express (Dual Server Architecture)
- **Database**: SQLite (for User Authentication) & JSON (for Products/Bills)
- **AI Integration**: OpenAI GPT-3.5-turbo & Whisper
- **Audio Processing**: Web Audio API + MediaRecorder

## Quick Start (Crucial Setup)

### Prerequisites
- Node.js 18+
- OpenAI API key


## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Analytics and overview
│   │   ├── OrderProcessor.tsx     # Voice order processing
│   │   ├── StockManager.tsx       # Inventory management
│   │   ├── BillViewer.tsx         # Bill search and details
│   │   └── LoginSignup.tsx        # Authentication flow
│   ├── App.tsx                    # Main application & Routing
│   └── main.tsx                   # Entry point
├── server/
│   ├── index.js                   # Voice & Order Express Server (Port 3001)
│   ├── auth.js                    # Authentication Express Server (Port 4000)
│   ├── data/
│   │   ├── app.db                # SQLite database for users
│   │   ├── stock.json            # Product inventory
│   │   └── bills.json            # Generated bills
│   └── uploads/                   # Temporary audio files
├── vite.config.ts                 # Dev server proxy configuration
└── package.json
```

## Usage Guide

### Logging In & Signing Up
The system enforces Role-Based Access Control (RBAC). Admin users have access to the Dashboard, Stock Manager, and Bill Viewer. Regular users (employees) only have access to Voice Order Processing.

### Processing Voice Orders
1. **Navigate to "Process Orders"** in the sidebar.
2. **Enter customer name** (required).
3. **Choose input method**:
   - Upload an audio file.
   - Record directly using your microphone.
   - Enter text order manually.
4. **Click "Process Order"** to extract items and fulfill the order.

### Managing Stock (Admin Only)
1. **Go to "Manage Stock"** section.
2. **Edit products** by clicking the edit icon to update quantities and prices inline.
3. **Monitor low stock alerts**.

## Troubleshooting

### "EADDRINUSE: address already in use :::3001"
If you get this error when starting the Voice Backend, it means a previous Node process is stuck running in the background. 
**Fix:** Run `taskkill /f /im node.exe` in your Windows command prompt, then restart the three servers.

### "POST /api/signup 404/500 Error"
Ensure that you have actually started `node server/auth.js` in a separate terminal. The frontend relies on port `4000` being active for authentication.

---
Built with React, Node.js, and OpenAI.