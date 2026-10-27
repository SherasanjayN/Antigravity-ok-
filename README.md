# Magalir Connect AI
### A Smart Loan and Group Management System for Rural Women's Self-Help Groups with Tamil

A full-stack, AI-powered web application built to streamline the operations of Women's Self-Help Groups (Magalir Kuzhu), empowering rural women with bilingual (Tamil + English) SHE AI assistance, group allocation, real-time group communication, official announcements, and a transparent **3-step loan approval pipeline** with automated email notifications and live EMI calculations.

---

## 🌟 Key Features & Workflow Architecture

### 1. Multi-Tier Role-Based Access Control (RBAC)
- **Super Admin (`SUPER_ADMIN`)**:
  - Master administrative console with real-time statistics (total members, active groups, sanctioned funds, pending actions).
  - **Pending Member Onboarding**: Smart auto-suggestion of groups based on the registrant's **Area** and **District**, with role assignment (Member or Group Admin).
  - **Group & Admin Management**: Create new Self-Help Groups, assign/change Group Admins (leaders), view roster.
  - **3-Step Loan Approval Pipeline**: Final sanction stage with automated real email dispatch to the member's registered address.
  - **Broadcast Announcements**: Publish official directives and schemes visible to all group members.
  - **Email Dispatch Audit Log**: View all sent loan sanction emails with Ethereal preview links.

- **Group Admin (`GROUP_ADMIN`)**:
  - Dedicated group dashboard displaying group information, designated area/district, and active member roster.
  - **Loan Verification**: Preliminary assessment of member loan requests with the ability to forward to Super Admin or reject with feedback.
  - **Real-Time Group Chat**: Interactive messaging channel dedicated exclusively to members of that specific group.
  - **Announcements Feed**: Real-time broadcast alerts from Super Admin.

- **Member (`USER`)**:
  - Personal dashboard displaying assigned group, Group Admin contact info, and fellow members.
  - **Loan Application System**:
    - Capped at ₹10,000 per Magalir Kuzhu policy.
    - Choice of payment mode: **UPI** (requires registered email verification) or **CASH**.
    - Live timeline tracking (`PENDING_GROUP_ADMIN` ➔ `PENDING_SUPER_ADMIN` ➔ `APPROVED` / `REJECTED`).
  - **Real-Time Group Chat**: Group communication channel with fellow members and Group Admin.
  - **Announcements**: Live notices and updates.

### 2. 3-Step Loan Approval Pipeline
1. **Submission**: Member submits loan application (<= ₹10,000) with payment mode selection and verification. Initial status: `PENDING_GROUP_ADMIN`.
2. **Group Admin Review**: Group Admin inspects loan application from their own group and forwards to Super Admin. Status updates to `PENDING_SUPER_ADMIN`.
3. **Super Admin Final Sanction & Email Dispatch**: Super Admin grants final sanction. Status updates to `APPROVED` and triggers an automated confirmation email to the member's registered email with the exact notification:
   > *"Dear [Member Name], Your loan request of ₹[Amount] has been sanctioned successfully!"*

---

## 👥 Verified Test Credentials

| Role | Name | Email | Password | Group / Scope |
|---|---|---|---|---|
| **Super Admin** | Super Admin | `sherasanjayn@gmail.com` | `Admin@12345` | Master Platform Control |
| **Group Admin** | Kavitha Murugan | `kavitha.m@example.com` | `Kavitha@123` | Mylapore Sakthi Kuzhu (Leader) |
| **Member** | Lakshmi Raman | `lakshmi.r@example.com` | `Lakshmi@123` | Mylapore Sakthi Kuzhu |

*New users can also self-register via the portal registration form; new accounts land on a **Pending Approval** screen until reviewed by Super Admin.*

---

## 🛠️ Technology Stack

- **Client (`/client`)**:
  - React 19
  - Vite 8
  - Lucide React Icons
  - Custom CSS Design System (Bilingual Tamil & English typography, responsive layout, status badges, modal dialogs)
- **Server (`/server`)**:
  - Node.js & Express
  - **MongoDB Database**: Connected via official `mongodb` driver to `mongodb://localhost:27017/magalir_kuzhu`
  - Dual persistent storage: Live MongoDB collections (`users`, `groups`, `loans`, `repayments`, `repayment_schedules`, `messages`, `announcements`, `notifications`, `email_outbox`, `audit_logs`) + backup file persistence
  - JWT (JSON Web Tokens) & bcryptjs password hashing
  - Nodemailer email engine (integrated with Ethereal SMTP with outbox audit tracking & retry mechanism)
- **Combined Full-Stack Architecture**:
  - Unified server serving the production React 19 single-page application and backend API routes simultaneously on `http://localhost:5000`

---

## 🚀 How to Run Locally

### 1. Unified Combined Mode (Frontend + Backend on single port)
```bash
# 1. Start MongoDB on localhost:27017
# Ensure MongoDB service is running

# 2. Build frontend & start combined server from root
npm run build
npm run server
# Or simply:
npm start
```
Access the complete application at **`http://localhost:5000/`**.

### 2. Independent Development Mode
- **Backend API**: `cd server && npm start` (runs on `http://localhost:5000`)
- **Frontend Dev**: `cd client && npm run dev` (runs on `http://localhost:3000`)


### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Backend Server
```bash
cd server
npm install
npm start
```
*Server runs on port `5000` (http://localhost:5000).*

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
*Client runs on port `3000` (http://localhost:3000), automatically proxying `/api` requests to the backend.*
