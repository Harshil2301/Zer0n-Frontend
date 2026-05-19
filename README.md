# ZerOn Platform — Enterprise Security Dashboard 🛡️

> **The Web3-native, AI-powered vulnerability management frontend for the ZerOn Protocol.**

ZerOn is a full-stack, production-grade React SPA that serves as the enterprise-facing interface for the ZerOn Bug Hunter engine. It combines Web3 biometric identity (Sybil resistance via face scanning), real-time vulnerability scanning via Socket.io, smart contract-based plan subscriptions, and a cyberpunk-aesthetic dark-mode dashboard — all built on React 18 + Vite 5 and Firebase.

---

## 📋 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Full Route Map](#-full-route-map)
3. [Component Reference](#-component-reference)
4. [The Web3 Identity & Sybil Resistance System](#-the-web3-identity--sybil-resistance-system)
5. [Enterprise Dashboard](#-enterprise-dashboard)
6. [Firebase Integration](#-firebase-integration)
7. [Web3 & Wallet Integration](#-web3--wallet-integration)
8. [Internationalization (i18n)](#-internationalization-i18n)
9. [Tech Stack](#-tech-stack)
10. [Installation & Setup](#-installation--setup)
11. [Environment Variables](#-environment-variables)
12. [Dev Bypass — Assessor Mode](#-dev-bypass--assessor-mode)
13. [Project Roadmap](#-project-roadmap)
14. [Firebase Data Model](#-firebase-data-model)

---

## 🏗️ Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                     ZerOn React SPA (Vite 5)                         │
│                      React Router v7 (CSR)                            │
└──────────────┬───────────────────────────────────────────────────────┘
               │
       ┌───────▼────────┐
       │  App.jsx (Root) │  — Theme loader (localStorage), Session check
       └───────┬─────────┘
               │ React Router Routes
    ┌──────────┼──────────────────────────────────────┐
    │          │                                       │
    ▼          ▼                                       ▼
  /           /face-scan          /dashboard?id={uuid}
Landing      FaceScan.jsx         Dashboard.jsx
Page         (Biometric KYC)      (Lazy tabs: NewScan,
             MediaPipe +           ScanHistory, Transaction,
             face-api.js           SettingsPage)
    │
    ├── /identity?id={uuid}     — 3-step onboarding (Firebase Auth)
    ├── /plan-selection?id={uuid} — Web3 wallet plan subscription
    ├── /roadmap               — 4-phase public roadmap
    ├── /whitepaper            — Assessor evaluation guide (PDF-style)
    ├── /contact               — Firebase Firestore contact form
    ├── /documentation         — Developer documentation hub
    └── /download              — ZERON.EXE download center

         Firebase Firestore ◄────────── All persistent state
         Firebase Auth      ◄────────── Google + Email/Password
         Socket.io-client   ◄────────── Live scan streaming
         Ethers.js + MetaMask ◄──────── Web3 wallet interaction
```

---

## 🗺️ Full Route Map

| Route | Component | Purpose |
|---|---|---|
| `/` | `HomePageWithLoader` | Landing page with animated loading screen (once per session via `sessionStorage`) |
| `/face-scan` | `FaceScan.jsx` | Biometric KYC entry point — liveness detection before dashboard access |
| `/identity?id={uuid}` | `Identity.jsx` | 3-step Firebase Auth onboarding: login method → personal info → professional info |
| `/plan-selection?id={uuid}` | `PlanSelection.jsx` | Web3 wallet-connected plan subscription (Basic/Pro/Enterprise) |
| `/dashboard?id={uuid}` | `Dashboard.jsx` | Main enterprise scanning dashboard with 4 lazy-loaded tabs |
| `/roadmap` | `Roadmap.jsx` | Public 4-phase product roadmap with progress indicators |
| `/whitepaper` | `Whitepaper.jsx` | Assessor guide — full project evaluation walkthrough |
| `/contact` | `Contact.jsx` | Contact form with Firebase Firestore submission storage |
| `/documentation` | `Documentation.jsx` | Developer portal with sidebar navigation |
| `/download` | `DownloadCenter.jsx` | ZERON.EXE CLI tool download center |

---

## 🧩 Component Reference

### Landing Page Components (`/`)

| Component | File | Description |
|---|---|---|
| **LoadingScreen** | `LoadingScreen.jsx` | Full-screen animated boot sequence shown once per browser session (`sessionStorage` guard). Typing animation effect with cyberpunk aesthetics. |
| **Navigation** | `Navigation.jsx` | Top navbar with links to Roadmap, Whitepaper, Documentation, Download, Contact. |
| **Hero** | `Hero.jsx` | Landing hero with animated headline, "Start Hunting" CTA (→ `/face-scan`), and "Dev Bypass" button (→ `/dashboard?id=dev-bypass`). |
| **HowItWorks** | `HowItWorks.jsx` | 3-step explainer: Init → Scan → Verify. Interactive animated cards. |
| **Features** | `Features.jsx` | Feature grid showcasing MoA Architecture, Biometric KYC, Web3 Payouts, Real-time Alerts. |
| **DualAudience** | `DualAudience.jsx` | Two-column layout targeting Enterprises (web dashboard) vs. Bot Operators (ZERON.EXE CLI). |
| **LiveDemo** | `LiveDemo.jsx` | Interactive animated scan simulation. Simulates the scanning terminal in real-time with typewriter output — no backend required. |
| **Footer** | `Footer.jsx` | Site footer with social links and copyright. |

### Utility Display Components

| Component | File | Description |
|---|---|---|
| **GlitchText** | `GlitchText.jsx` | CSS glitch animation wrapper for cyberpunk-style text effects. |
| **ParticleField** | `ParticleField.jsx` | Canvas-based animated particle background. Accepts `count` prop. Used in Roadmap page. |
| **NetworkPulse** | `NetworkPulse.jsx` | Animated SVG network grid background used behind the Roadmap. |
| **DataStream** | `DataStream.jsx` | Scrolling binary/hex data stream animation for the dashboard sidebar. |
| **TerminalEffect** | `TerminalEffect.jsx` | Typewriter terminal animation component with configurable text and speed. |
| **ErrorBoundary** | `ErrorBoundary.jsx` | React class component that catches render errors in lazy-loaded dashboard tabs and shows a fallback UI. |
| **VerificationPopup** | `VerificationPopup.jsx` | Animated modal popup for showing face scan success/error results. |
| **PlanWarningBanner** | `PlanWarningBanner.jsx` | Dashboard banner that warns users when they are approaching or have hit their domain scan limit. |
| **ProfileModal** | `ProfileModal.jsx` | Compact profile card modal accessible from the dashboard top bar. Shows avatar, name, plan, and Settings shortcut. |
| **NotificationPanel** | `NotificationPanel.jsx` | Slide-in notification panel showing scan completion alerts and security updates. |

---

## 🔐 The Web3 Identity & Sybil Resistance System

This is the most technically complex part of the platform. The full authentication flow operates in 3 stages:

### Stage 1 — Biometric Face Scan (`/face-scan` → `FaceScan.jsx`)

**Purpose:** Prevent Sybil attacks. One real human face = one account. No fake/duplicate accounts.

**Implementation (Enterprise Hardened):**
- **MediaPipe Face Mesh** runs at **30fps** via `requestAnimationFrame`, tracking **468 facial landmarks**.
- **Liveness & Anti-Spoofing:**
  1. **Eye Aspect Ratio (EAR)** — A blink is detected when EAR drops below `0.23` for 1–30 consecutive frames. **Two blinks required.**
  2. **Head Yaw/Pose** — Nose tip deviation from the eye midpoint is measured to confirm left/right head turns.
  3. **Texture Variance Check (LBP)** — Active analysis of pixel noise to detect photo/screen spoofing (variance must be > 350).
  4. **Ambient Lighting Gate** — Detects extreme lighting conditions that could degrade accuracy (luminance 55 - 225 range).
  5. **Face-Lost Recovery** — If no face is detected for 90 consecutive frames (3 seconds), the liveness challenge resets automatically.
- **Biometric Extraction (`face-api.js`)**: 
  - After passing liveness, a **Face Quality Gate** checks the bounding box (size > 150px, centered, both eyes visible) to prevent occlusions.
  - Extracts the **128-dimensional face embedding vector** via `TinyFaceDetector`.
  - Captures 5 discrete samples over 2 seconds and averages them into a single, mathematically robust 128-d master descriptor.
- **Cryptographic Storage & Verification**: 
  - The vector is sent securely to the backend via `POST /api/face/verify`.
  - Stored descriptors are **AES-256 encrypted at rest**. The backend decrypts in-memory and computes Euclidean distance.
  - **3-Zone Confidence System**: Distance < 0.45 = Direct Login. Distance 0.45 - 0.55 = `UNCERTAIN` zone triggering an MFA (Email/Password) fallback.
  - Successful match returns a **Biometric-Bound JWT token** which is injected into the headers for sensitive dashboard operations (like initiating scans).
- **Dev Bypass** skips all biometric checks and redirects to `/dashboard?id=dev-bypass`.

**Firebase collections written:**
- `faceVectors/{uuid}` — stores the AES-256 encrypted embedding vector (`encryptedVector`), UUID, and model version.

---

### Stage 2 — Identity Onboarding (`/identity` → `Identity.jsx`)

A 3-step wizard that completes the user's KYC profile after face scan.

| Step | Fields | Validation |
|---|---|---|
| Step 1 | Login Method (Google OAuth or Email/Password) | Google: `signInWithPopup`. Email: `createUserWithEmailAndPassword` + email verification link |
| Step 2 | Full Name, Email Address | Email regex validation. Google users auto-filled from `displayName`. |
| Step 3 | Phone, Organization, Role, Location | Phone regex validation. Profile saved to Firebase on submit. |

**Profile completion percentage** is calculated live with weighted fields:

| Field | Weight |
|---|---|
| Full Name | 15% |
| Email | 20% |
| Phone | 15% |
| Organization | 15% |
| Role | 10% |
| Location | 10% |
| Email Verified | 15% |

The percentage counter uses `requestAnimationFrame` with an **ease-out easing function** for a smooth animated count-up.

**Firebase collections written:**
- `users/{uuid}` — stores full profile, plan info, wallet address
- `users/{uid}` — (Firebase Auth UID path) for Google Sign-In users

---

### Stage 3 — Plan Selection (`/plan-selection` → `PlanSelection.jsx`)

Users select a subscription plan. Basic and Pro require **wallet signature/transaction**.

| Plan | Price | Domain Scans | Wallet Required |
|---|---|---|---|
| Basic | Free | 1 | ✅ Signature only |
| Pro | $29/month | 3 | ✅ Testnet transaction (0.01 ETH) |
| Enterprise | $99/month | 6 | ❌ (Manual contact) |

**Web3 Flow (Basic/Pro):**
1. Detects `window.avalanche` (Core Wallet) or `window.ethereum` (MetaMask) — platform-agnostic via `ethers.js`
2. Calls `eth_requestAccounts` to connect the wallet
3. **Cryptographic Proof of Ownership:** Calls `eth_personal_sign` to challenge the user to sign a message, proving they hold the private keys.
4. For Pro: calls `eth_sendTransaction` to the ZerOn Treasury address with value `0x2386F26FC10000` (0.01 ETH in hex wei)
5. Transaction hash and cryptographic signature are stored in `users/{uuid}` in Firestore
6. Redirects to `/dashboard?id={uuid}`

---

## 📊 Enterprise Dashboard

`Dashboard.jsx` is a full single-page application within the SPA. It uses **React lazy loading** and **AnimatePresence** for tab transitions.

### Dashboard Structure

```
Dashboard.jsx (shell)
├── Sidebar (collapsible, with plan badge)
│   ├── Security Scan → NewScan (lazy)
│   ├── Scan History → ScanHistory (lazy)
│   ├── Transactions → Transaction (lazy)
│   └── Settings → SettingsPage (inline, not lazy)
├── Top Bar
│   ├── ProfileModal (avatar + plan)
│   └── NotificationPanel (bell icon)
└── PlanWarningBanner (shown when domains used ≥ limit)
```

**Dev Bypass handling:** When `userId === 'dev-bypass'`, the dashboard injects mock data:
```js
{ type: 'premium', name: 'Premium Plan (Dev)', domains: 9, scansUsed: 0 }
```

---

### Tab 1 — Security Scan (`NewScan.jsx`)

The primary scan interface. Connects to the ZerOn Bug Hunter backend via **Socket.io**.

**Scan initiation flow:**
1. User enters domain + optional session cookie (for authenticated scanning)
2. Checks Firebase `users/{userId}` for plan limits (`domainsUsed < domains`)
3. `POST http://localhost:5000/api/scan/start` → receives `scanId`
4. Opens Socket.io connection to the backend
5. Subscribes to `progress_{scanId}` events → updates live terminal + progress bar
6. Subscribes to `scan_complete_{scanId}` → shows final summary
7. On complete: writes scan record to Firebase `scanreturn/{userId}` via `arrayUnion`

**Live Terminal:** Auto-scrolling log display with timestamps showing real-time phase updates from the backend's 5-phase pipeline.

**Advanced Options toggle:** Expands to show a session cookie input field (for authenticated scan testing on targets requiring login).

**"Deploy Autonomous Agent" button** — The primary CTA that triggers the scan.

**"Enable 24/7 Continuous AI Monitoring" toggle** — UI feature (stored in component state).

---

### Tab 2 — Scan History (`ScanHistory.jsx`)

Reads from two Firebase collections:
- `scanreturn/{userId}` → list of scan IDs and metadata
- `scans/{scanId}` → individual scan details and findings

**Features:**
- Filter tabs: All / Completed / In Progress
- **Recharts `PieChart`** showing vulnerability severity breakdown (Critical / High / Medium / Low) for each scan
- Download PDF Report button → calls `GET /api/scan/{scanId}/report.pdf`
- Sorted by `createdAt` descending (newest first)

---

### Tab 3 — Transactions (`Transaction.jsx`)

Reads plan and payment data from `users/{userId}` in Firestore.

**Displays:**
- Plan type with icon (Shield/Zap/Crown), color-coded by tier
- Wallet address linked
- **"Escrow Contract Deployed"** label with Etherscan link to the testnet transaction hash
- **IPFS Proof link** to simulated IPFS CID for the vulnerability report
- Status: `TESTNET TRANSACTION VERIFIED (IPFS Proof Attached)`

---

### Settings Tab (`SettingsPage.jsx`)

4 sub-sections accessible from a left mini-nav:

| Section | Features |
|---|---|
| **Profile** | Edit full name, email, phone, organization, role, location. Saves to Firebase. |
| **Security** | Change password fields (show/hide toggle via Eye icon). |
| **Notifications** | Toggle switches for: Email Notifications, Scan Alerts, Security Updates, Weekly Report. |
| **Appearance** | Dark / Light / Auto (System) theme selector. Writes to `localStorage('zeron_theme')`. Language selector (EN/ES/FR/DE). Writes to `localStorage('zeron_language')`. |

---

## 🔥 Firebase Integration

### Configuration (`src/config/firebase.js` + `firebase.config.js`)

Firebase is initialized once and reused via singleton pattern (`getApps().length === 0` guard).

### Firestore Collections

| Collection | Document Key | Stored Data |
|---|---|---|
| `users` | `{uuid}` | `profile`, `plan`, `walletAddress`, `transactionHash`, `transactionDate` |
| `faceVectors` | `{uuid}` | `vector` (128-d float array), `uuid`, `createdAt` |
| `scanreturn` | `{uuid}` | `scanResults[]` — array of `{ scanId, domain, createdAt, status }` |
| `scans` | `{scanId}` | Full scan object: `domain`, `status`, `progress`, `findings[]`, `userId`, `createdAt` |
| `contacts` | (auto-ID) | Contact form submissions: `name`, `email`, `subject`, `message`, `timestamp` |

### Utility Modules

| File | Exports | Purpose |
|---|---|---|
| `utils/auth.js` | `signInWithGoogle`, `registerWithEmail`, `signInWithEmail`, `resendVerificationEmail`, `onAuthStateChange` | All Firebase Auth operations |
| `utils/faceVerification.js` | `generateFaceVector`, `calculateSimilarity`, `storeFaceVector`, `checkExistingFaceVector`, `storeUserProfile`, `getUserProfile`, `updateUserProfile` | Face vector CRUD + cosine similarity calculation |
| `utils/firestore.js` | `saveUserProfile`, `getUserProfile` | Generic Firestore profile operations |
| `utils/uuid.js` | `generateUserId`, `isValidUUID`, `getUUIDFromURL`, `redirectWithUUID` | UUID v4 management passed via URL query params |

---

## 🦊 Web3 & Wallet Integration

**Library:** `ethers.js v6` (pure JS, browser-compatible)

**Wallet Detection:**
```js
const provider = window.avalanche || window.ethereum;
```
Supports MetaMask, Core Wallet, and any EIP-1193 compatible wallet.

**Operations performed:**
- `eth_requestAccounts` — connect wallet
- `eth_sendTransaction` — send testnet transaction (Pro plan)
- Transaction hash stored in Firebase and displayed on the Transactions tab with a live Etherscan link

**Network:** Ethereum Sepolia testnet (or Avalanche Fuji testnet when using Core Wallet)

---

## 🌍 Internationalization (i18n)

**Implementation:** Custom React Context — no external library.

**File:** `src/contexts/LanguageContext.jsx`

**Supported languages:**

| Code | Language |
|---|---|
| `en` | English (default) |
| `es` | Español |
| `fr` | Français |
| `de` | Deutsch |

**How it works:**
- `LanguageProvider` wraps the app in `main.jsx`
- Language stored in `localStorage('zeron_language')`
- `useLanguage()` hook returns `{ language, setLanguage, t }` — `t(key)` resolves a translation key to the current locale string
- Falls back to English if key missing in current locale
- Covers: all Dashboard sidebar labels, scan page text, history page text, settings page labels, plan banner

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | React | 18.2 |
| **Build Tool** | Vite | 5.0 |
| **Routing** | React Router DOM | 7.9 |
| **Animations** | Framer Motion | 10.16 |
| **Icons** | Lucide React | 0.294 |
| **Charts** | Recharts | 3.8 |
| **Lottie** | lottie-react | 2.4 |
| **Web3** | ethers.js | 6.15 |
| **Face Detection** | face-api.js | 0.22 |
| **Face Mesh** | @mediapipe/face_mesh | 0.4 |
| **Firebase** | firebase (client SDK) | 12.4 |
| **Real-time** | socket.io-client | 4.8 |
| **PDF Generation** | jspdf + html2canvas | 4.2 / 1.4 |
| **UUID** | uuid | 13.0 |
| **Big Numbers** | big.js | 7.0 |
| **State** | React Context API (no Redux) | — |
| **Styling** | Vanilla CSS (module-per-component) | — |

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MetaMask or Core Wallet browser extension (for plan selection)
- ZerOn Bug Hunter backend running on `http://localhost:5000`

### 1. Clone and Install
```bash
git clone https://github.com/your-org/ZerOn-main.git
cd ZerOn-main
npm install
```

### 2. Download face-api.js Models
The FaceScan component requires model weights in `public/models/`. Download from the [face-api.js repository](https://github.com/vladmandic/face-api/tree/master/model):
```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── face_landmark_68_model-weights_manifest.json
├── face_recognition_model-weights_manifest.json
└── face_expression_model-weights_manifest.json
```

### 3. Configure Firebase
Edit `src/config/firebase.config.js` with your Firebase project credentials.

### 4. Set Environment Variables
Create a `.env` file at the project root:
```env
VITE_API_URL=http://localhost:5000
```

### 5. Start Development Server
```bash
npm run dev
```
Frontend starts on `http://localhost:3000`.

> **Note:** The ZerOn Bug Hunter backend must be running on port 5000 for live scanning to work.

### 6. Build for Production
```bash
npm run build
```
Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

---

## ⚙️ Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | ZerOn Bug Hunter backend URL for scan API and Socket.io |

---

## 🔑 Dev Bypass — Assessor Mode

The Dev Bypass is a shortcut specifically designed for assessors and evaluators who need to explore the full dashboard without completing the biometric face scan.

**How to access:**
1. Click the **"Dev Pass"** button on the landing page Hero section, OR
2. Navigate directly to: `http://localhost:3000/dashboard?id=dev-bypass`

**What Dev Bypass unlocks:**
- Full dashboard access with **Premium Plan** pre-loaded
- **9 domain scans** available (set to `domains: 9` in `NewScan.jsx`)
- Pre-populated Transactions tab showing mock wallet address and Etherscan link
- All 4 dashboard tabs (Scan, History, Transactions, Settings) fully functional
- Can initiate real scans against any domain

**Dev Bypass is also available on the FaceScan page** as a red "DEV BYPASS" button in the top-right corner of the camera feed.

---

## 🗺️ Project Roadmap

| Phase | Period | Status | Progress |
|---|---|---|---|
| **Phase 1** — Foundation & Core Infrastructure | Q1-Q2 2025 | ✅ Completed | 100% |
| **Phase 2** — Autonomous Detection & Automation | Q3-Q4 2025 | ✅ Completed | 100% |
| **Phase 3** — AI Integration & Scaling | Q1-Q2 2026 | 🔄 In Progress | 85% |
| **Phase 4** — Decentralized Security Network | Q3-Q4 2026 | 📋 Planned | 15% |

### Phase 1 Deliverables (Completed)
- Web3 Biometric Authentication (FaceScan)
- Basic Vulnerability Detection Engine
- Interactive Dashboard UI & Analytics
- Core Smart Contract Architecture
- Secure Session & State Management

### Phase 2 Deliverables (Completed)
- Automated Target Crawling & Discovery
- Real-time Threat Reporting Engine
- Role-based Access Control (Dev Bypass / Assessor Mode)
- IPFS Proof Storage Integration
- Web3 Crypto Wallet Integration (MetaMask/Core)
- Multi-language Support (EN/ES/FR/DE)

### Phase 3 (In Progress — 85%)
- Mixture of Agents (MoA) LLM swarm backend (see ZerOn Bug Hunter)
- Zero-Day Pattern Recognition
- Multi-chain Smart Contract Deployment
- Automated Bounty Payouts

### Phase 4 (Planned)
- Decentralized Autonomous Organization (DAO) governance
- $ZERON token integration
- ZERON.EXE cross-platform CLI tool
- SOC2 / GDPR compliance framework

---

## 🗄️ Firebase Data Model

### `users/{uuid}`
```json
{
  "walletAddress": "0xabc...123",
  "transactionHash": "0x8f2a...",
  "transactionDate": "2025-06-01T10:00:00Z",
  "plan": {
    "type": "pro",
    "name": "Pro",
    "domains": 3,
    "domainsUsed": 1,
    "selectedAt": "2025-06-01T10:00:00Z",
    "status": "active"
  },
  "profile": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "organization": "Acme Corp",
    "role": "Security Engineer",
    "location": "San Francisco, CA"
  },
  "account": {
    "status": "active",
    "plan": "pro",
    "createdAt": "2025-06-01T09:00:00Z",
    "credits": 10
  }
}
```

### `faceVectors/{uuid}`
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "encryptedVector": "a8f3b2c... (AES-256 ciphertext of the 128-d vector)",
  "model": "ssd_mobilenetv1_v2",
  "timestamp": "2025-06-01T09:00:00Z"
}
```

### `scanreturn/{uuid}`
```json
{
  "scanResults": [
    {
      "scanId": "uuid-v4",
      "domain": "testphp.vulnweb.com",
      "createdAt": "2025-06-01T10:05:00Z",
      "status": "completed",
      "findings": 7
    }
  ]
}
```

---

## 📜 License

MIT © ZerOn Technologies
