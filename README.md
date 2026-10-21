# AuraSpend - Android Expense Tracker & Bank Sync 💰📱

A native-feel Android mobile application for daily expense tracking, real-time category budget monitoring, automated monthly reports, and daily credit/debit bank syncing in **Indian Rupees (₹ INR)**.

---

## 🌟 Key Features

- **📱 Android 15 / Material You Design**: Punch-hole camera notch, Android status bar (5G, Wi-Fi, battery %, clock), Material 3 cards, bottom navigation bar, and central Quick Entry FAB.
- **🇮🇳 Indian Rupee (₹) & Indian Banking Ecosystem**: Preconfigured with HDFC Bank (Salary A/C), ICICI Bank (RuPay Credit Card), State Bank of India (SBI Savings), and UPI / Paytm / PhonePe wallets.
- **⚡ Real-Time Budget Tracking**: Pacing gauges, category spending caps, daily safe burn-rate recommendations, and automated 80% / 100% threshold alerts.
- **📊 Automated Monthly Category Reports**: Interactive SVG Donut spend distributions, top merchant rankings, net savings rate KPIs, automated financial insights, and 1-click printable PDF reports.
- **🔄 Daily Bank Feed Sync Engine**: Open Banking / RBI Account Aggregator simulation reconciling daily debits and credits with duplicate detection.
- **📩 Bank SMS & Notification Parser**: Paste raw bank SMS or UPI payment alerts (HDFC, ICICI, SBI, GPay, Swiggy) to instantly parse and book ledger entries.
- **☁️ Cloud Storage Replication**: Client-side AES-encrypted snapshots with SHA-256 integrity hashes, automated backup scheduling, and JSON database export/import.
- **🔒 Security & Privacy First**: Local-first storage sandbox with zero third-party telemetry, no banking passwords or MPIN storage, and an interactive 4-digit Security PIN lock.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Runtime**: Vite 8
- **PWA & Mobile**: Android WebAPK Manifest (`manifest.json`), Service Worker (`sw.js`), Adaptive 512x512 SVG App Icon
- **Storage**: Local-First Web Storage Sandbox + Cloud Snapshot Engine

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/nandkumar1983/auraspend.git
cd auraspend

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📲 Installing on Android

### Method 1: Instant WebAPK Installation (via Chrome)
1. Open the web app on your Android device in **Google Chrome**.
2. Tap the browser menu (**⋮**).
3. Select **"Install app"** or **"Add to Home screen"**.
4. Android will automatically compile and install the native WebAPK with its launcher icon and offline cache.

### Method 2: Build Standalone APK via Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://<your-deployed-domain>/manifest.json
bubblewrap build
adb install -r app-release-signed.apk
```

---

## 🔒 Security Architecture

1. **No NetBanking Credentials or MPINs**: Bank syncing relies on read-only transaction alerts.
2. **Local-First Sandbox**: Ledger records are stored in the private application sandbox:
   `/data/data/com.auraspend.app/app_webview/Default/Local Storage`
3. **Encrypted Cloud Backups**: All exports are serialized with SHA-256 hashes.
4. **App-Level PIN Protection**: Built-in 4-digit security PIN lock.

---

## 📄 License
Apache-2.0
