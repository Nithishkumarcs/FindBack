# FindBack — Lost & Found Network

> **"Connect. Verify. Recover."**
> A 100% Serverless, Pure JavaScript, Client-Side Lost & Found Network.
> Ready for **Direct 1-Click Deployment to GitHub Pages** (No Python, No Render, No Vercel needed!).

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Modern-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla_Design-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## Table of Contents
1. [Overview & Highlights](#overview--highlights)
2. [Instant 1-Click GitHub Pages Deployment Guide (English & தமிழ்)](#instant-1-click-github-pages-deployment-guide)
3. [Architecture: Pure JavaScript & LocalStorage Engine](#architecture-pure-javascript--localstorage-engine)
4. [100-Point Rule-Based Matching Engine (In Pure JS)](#100-point-rule-based-matching-engine)
5. [Key Features & User Workflows](#key-features--user-workflows)
6. [Demo Accounts & Pre-Seeded Dataset](#demo-accounts--pre-seeded-dataset)
7. [Running Locally](#running-locally)
8. [Automated Verification Tests](#automated-verification-tests)

---

## Overview & Highlights

**FindBack** is an enterprise-grade lost and found platform built entirely in **Pure HTML5, CSS3, and Vanilla JavaScript**. 

- **Zero Server Setup**: No Python, Flask, MySQL, Render, or Vercel required.
- **GitHub Pages Ready**: Host directly on GitHub for free in under 60 seconds.
- **Persistent Local Database**: Built-in browser `localStorage` engine with realistic pre-seeded data (users, categories, reports, matches, claims, notifications, audit logs).
- **Mathematical 100-Point Matching Engine**: Zero-AI deterministic matching combining category, geospatial distance (Haversine formula), date proximity, keyword tokens, and unique physical characteristics.
- **Ownership Verification & Dual Handover Confirmation**: Private questionnaires to verify genuine owners and two-party confirmation before closing cases.
- **QR Code Case System**: Generates and verifies official case labels with live smartphone camera QR codes.

---

## Instant 1-Click GitHub Pages Deployment Guide

### In English:
1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy FindBack to GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository on **GitHub.com**.
   - Click **Settings** (tab at the top right).
   - On the left sidebar, click **Pages**.
   - Under **Build and deployment** -> **Branch**:
     - Select `main`
     - Folder: `/(root)`
     - Click **Save**.
3. **Done!** In about 30 seconds, your site is live at:
   `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`

---

### தமிழில் (Tamil / Tanglish Instructions):
1. **GitHub-க்கு push பண்ணுங்க**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for FindBack"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. **GitHub Pages ஆன் பண்ணுங்க**:
   - உங்க GitHub repository-க்கு போங்க.
   - மேல உள்ள **Settings** கிளிக் பண்ணுங்க.
   - இடது பக்க மெனுவில் உள்ள **Pages**-ஐ கிளிக் பண்ணுங்க.
   - **Branch**-ல் `main` மற்றும் `/(root)` தேர்வு செய்து **Save** கொடுங்க.
3. **அவ்வளவுதான்!** 1 நிமிடத்தில் உங்க web app live-ஆ ஓடும்:
   `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`
   *(Render, Vercel, Python server எதுவும் தேவையில்லை!)*

---

## Architecture: Pure JavaScript & LocalStorage Engine

```
FindBack/
├── index.html               # Public Landing Page with Counters & Quick Search
├── login.html               # Sign In Page with 1-Click Demo Fill
├── register.html            # User Registration Page
├── dashboard.html           # User Dashboard with Match & Listing Previews
├── reports.html             # Network Search & Campus Keyword Filter
├── report-lost.html         # Report Lost Item with Campus Building/Room
├── report-found.html        # Report Found Item with Verification Questions
├── report-details.html      # Listing Details & Campus Location Box
├── matches.html             # 100-Point Rule-Based Match Inspector
├── claims.html              # Claims Management & Handover Dual-Confirmation
├── notifications.html       # In-App Notification Center
├── profile.html             # User Profile & Password Management
├── case.html                # Official QR Code Case Verification Page
├── admin/
│   ├── index.html           # Admin Dashboard & Campus Hotspot Analytics
│   ├── users.html           # User Account Management (Block / Unblock)
│   ├── reports.html         # Network Reports & Community Abuse Moderation
│   ├── claims.html          # Global Claims Oversight & Force Approval
│   └── audit-logs.html      # Immutable Security Event Trail
├── css/
│   ├── main.css             # Design Tokens & Theme
│   ├── components.css       # Buttons, Cards, Inputs, Badges, Modals
│   └── pages.css            # Custom Page Layouts & Responsive Grids
└── js/
    ├── db.js                # LocalStorage Database Engine (FindBackDB)
    ├── matching.js          # 100-Point Rule-Based Matching Engine
    ├── api.js               # Universal Client-Side API Router (apiFetch)
    ├── auth.js              # Auth State, Session Guard & Dynamic Navbar
    ├── reports.js           # Lost / Found Report Submission & Duplicate Check
    ├── claims.js            # Verification & Handover Coordination
    ├── search.js            # Search, Category Filter & Pagination
    ├── map.js               # Campus Location Utilities (Lightweight)
    └── admin.js             # Admin Telemetry, Moderation & Hotspots
```

---

## 100-Point Rule-Based Matching Engine

When an item is reported, the matching engine automatically compares it against active counter-reports:

$$\text{Total Score} = \text{Category} (25) + \text{Location} (25) + \text{Date} (15) + \text{Description} (20) + \text{Marks} (15)$$

1. **Category Similarity (25 Points)**:
   - Identical category: **25 pts**
   - Title token overlap across categories: **12 pts**
2. **Geospatial Distance (25 Points)**:
   - Uses the mathematical **Haversine Formula**:
     - $\le 0.5\text{ km}$: **25 pts**
     - $\le 2.0\text{ km}$: **20 pts**
     - $\le 5.0\text{ km}$: **15 pts**
     - $\le 15.0\text{ km}$: **8 pts**
     - Fallback: Location name token overlap (up to 25 pts)
3. **Date Similarity (15 Points)**:
   - Same calendar day: **15 pts**
   - 1 day difference: **12 pts**
   - $\le 3$ days: **8 pts**
   - $\le 7$ days: **4 pts**
4. **Description Overlap (20 Points)**:
   - Computes **Jaccard Token Similarity** after filtering common stopwords.
5. **Distinguishing Marks (15 Points)**:
   - Evaluates specific features (scratches, stickers, engravings, serial hints).

Matches with score $\ge 40\%$ are recorded. Matches $\ge 60\%$ automatically trigger in-app notifications.

---

## Demo Accounts & Pre-Seeded Dataset

The app initializes automatically with pre-seeded demo accounts on first visit. Use the **Quick Demo Fill** buttons on `login.html`:

| Account | Email | Password | Role | Description |
|---|---|---|---|---|
| **Sarah Jenkins** | `sarah.jenkins@example.com` | `User@123456` | `USER` | Has reported lost wallet & keys |
| **Michael Chen** | `michael.chen@example.com` | `User@123456` | `USER` | Has reported found wallet & laptop |
| **Emily Davis** | `emily.davis@example.com` | `User@123456` | `USER` | Reported found laptop & student ID |
| **System Admin** | `admin@findback.org` | `Admin@123456` | `ADMIN` | Full access to Admin Console & Heatmap |

---

## Running Locally

You can run FindBack on your local machine using **any** of these zero-setup methods:

### Option A: Double-Click `index.html`
Simply double-click `index.html` on your desktop to open it in Chrome, Edge, Safari, or Firefox!

### Option B: Using VS Code Live Server
Right-click `index.html` -> **Open with Live Server**.

### Option C: Using Node.js
```bash
npx serve .
# Opens at http://localhost:3000
```

---

## Automated Verification Tests

Run the included automated verification suite using Node.js:
```bash
node test_pure_js.js
```

### Output:
```
=== Testing FindBack Pure JavaScript Engine ===
[PASS] Categories seeded correctly (found 12)
[PASS] Users seeded correctly (found 5)
[PASS] Reports seeded correctly (found 7)
[PASS] Sarah logged in successfully (id: 2)
[PASS] Stats retrieved: lost_count=2
[PASS] Matching Engine evaluates Wallet pair with high confidence (Score: 80.6%)
[PASS] Category score: 25/25
[PASS] Location score: 25/25
[PASS] Date score: 15/15
[PASS] Duplicate detector flagged duplicate lost report
[PASS] Sensitive item detected for student ID
[PASS] Sensitive card number masked correctly
[PASS] Report created with Case ID: FB-2026-XXXXXX
[PASS] Claim submitted successfully
[PASS] Admin dashboard metrics loaded
[PASS] Admin recovery rate: 25%
[PASS] Admin heatmap points retrieved
[PASS] Admin audit logs retrieved
[PASS] Case QR resolver resolved FB-2026-001001

=== Verification Complete: 19 Passed, 0 Failed ===
```

---

## License

Released under the [MIT License](LICENSE).
Copyright &copy; 2026 FindBack Network. Connect. Verify. Recover.
