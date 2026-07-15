# AlignGrade Git Commit Analysis

This document provides a detailed breakdown of the three specified commits from the AlignGrade repository, describing their intent, the files modified, and their impact on the codebase.

---

## 1. Commit: `176ce528cc4cf68fdca9ed299ae6591e02db4321`

### **Summary**
Configures the frontend application to dynamically resolve the Backend API base URL via environment variables rather than relying on a hardcoded string.

### **Files Modified**
* [frontend/.env.example](file:///Users/karanrawat/Desktop/a_g/frontend/.env.example) (Documented `VITE_API_BASE_URL` with default value `http://localhost:5001/api`)
* [frontend/src/constants/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/index.js) (Swapped hardcoded `API_BASE` value with environment fallback)

### **What It Does**
* Introduces the environment variable `VITE_API_BASE_URL` in [frontend/.env.example](file:///Users/karanrawat/Desktop/a_g/frontend/.env.example).
* Updates the `API_BASE` constant in [frontend/src/constants/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/index.js) to resolve to `import.meta.env.VITE_API_BASE_URL` first, falling back to `'http://localhost:5001/api'` if the variable is undefined.
* Enables production build flexibility, allowing the API URL to be injected at deployment time without requiring modifications to the source code.

---

## 2. Commit: `d9d63cc926b21467affc95b9212875165b88ad35`

### **Summary**
Updates backend database initialization logs and connection checks to support local MongoDB connections.

### **Files Modified**
* [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js) (Altered database check conditions and warn log details)

### **What It Does**
* Simplifies the condition in [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js) that decides whether to instantiate Prisma or fallback to the in-memory mock client.
* **Before**: Checked `if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost"))`. This bypassed Prisma and forced the mock database if `localhost` was present in the connection string.
* **After**: Simply checks `if (process.env.DATABASE_URL)`. This allows developers to use local MongoDB deployments (including those hosted on `localhost` or `127.0.0.1`) with the real Prisma client instead of being locked into the mock database sandbox.
* Updates the warning logging statement to read `"DATABASE_URL not found. Using mock client fallback."` when `DATABASE_URL` is completely absent.

---

## 3. Commit: `15fb441e8a2f883864ecdf45320c5fbcda17239d`

### **Summary**
Implements subdomain-based routing to partition user experiences and enforce role-based access gates.

### **Files Modified**
* [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx) (Enforces access gate checking based on hostnames)
* [frontend/src/features/Auth/AuthView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/AuthView.jsx) (Redirects buttons to subdomains and mounts portal picker modal)

### **What It Does**
* **Subdomain Extraction**: Reads `window.location.hostname` inside [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx) to distinguish between:
  * Landing Host (`aligngrad.com` or `www.aligngrad.com`)
  * Student Portal (`career.aligngrad.com`)
  * Recruiter Portal (`hire.aligngrad.com`)
* **Role-Based Access Gates**:
  * For users navigating to `career.aligngrad.com` (Student Portal) who do not have the `STUDENT` role (e.g. recruiters), the application intercepts rendering and displays an "Access denied" warning overlay.
  * For users navigating to `hire.aligngrad.com` (Recruiter Portal) who do have the `STUDENT` role, it renders an equivalent "Access denied" warning overlay.
* **Landing Redirects & Picker**:
  * Modifies action buttons on the landing page in [frontend/src/features/Auth/AuthView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/AuthView.jsx) ("Join as a Candidate", "Hire Verified Students") to redirect the browser to their respective subdomains instead of opening the generic login drawer.
  * Replaces the navigation bar "Sign In" and "Get Started" buttons with a modal dialog picker, letting users select between Candidate and Recruiter portals and forwarding them to `career.aligngrad.com` or `hire.aligngrad.com` respectively.
