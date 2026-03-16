# 🔷 Polystore

**A Unified Cloud Storage Interface & Multi-Tenant SaaS Platform.**

Polystore abstracts the complexity of managing multiple cloud storage providers into a single, seamless, web-based application. Originally conceived as a TypeScript library, Polystore is now a full-fledged enterprise SaaS that allows organizations to securely plug in their cloud credentials and manage files across **AWS S3, Google Cloud Storage, and Azure Blob Storage** with a unified Drive-like experience.

### ✨ Key Features

- **Multi-Cloud Engine:** Provider-agnostic file management using the Adapter and Factory design patterns.
- **Multi-Tier Multi-Tenancy:** Tenant Admins can create and manage isolated storage environments (Organizations) for different clients or departments.
- **Zero-Trust Security:** All AWS/GCP/Azure API keys are secured via AES-256-GCM encryption at rest. Credentials are never exposed to the frontend.
- **Role-Based Access Control (RBAC):** Granular permissions (Super Admin, Tenant Admin, Manager, Viewer) to protect sensitive cloud assets.
- **Modern UI/UX:** A responsive, Angular + Tailwind CSS frontend featuring virtual scrolling for massive file lists, drag-and-drop uploads, and seamless light/dark themes.

### 🛠️ Tech Stack

- **Frontend:** Angular, Tailwind CSS, Headless UI / CDK
- **Backend:** NestJS, Node.js
- **Database:** MongoDB (Mongoose)
- **Architecture:** REST API, Domain-Driven Design (DDD), SOLID Principles
