# MiEstilo Luxury Linen ERP — Production Deployment Guide

This guide details step-by-step instructions for taking **MiEstilo Luxury Linen Inventory & Order Management System** from development into production.

---

## Architecture Overview

- **Frontend & API**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.
- **Database**: MongoDB (MongoDB Atlas M0/M10 or dedicated MongoDB 7.0+ Replica Set).
- **Ledger Invariant**: Immutable stock movement audit ledger + real-time stock balance projections.
- **Images & Static Assets**: Genuine 30-product photography bundled in `public/products/`.

---

## Method 1: Deploy to Vercel + MongoDB Atlas (Recommended — 10 Minutes)

Because this application is built on Next.js 16, Vercel provides zero-configuration deployment, automatic SSL, edge caching, and global performance.

### Step 1: Set Up MongoDB Atlas (Production Database)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Create a new Cluster (the free `M0` sandbox is great to start, or `M10` for high concurrency).
3. Under **Security > Database Access**:
   - Add a new user (e.g. `miestilo_admin`) with a strong password.
4. Under **Security > Network Access**:
   - Add IP `0.0.0.0/0` (Allow access from anywhere) so Vercel's serverless nodes can reach the cluster.
5. Click **Connect > Drivers > Node.js**:
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://miestilo_admin:<password>@cluster0.abcde.mongodb.net/miestilo_production?retryWrites=true&w=majority
     ```

### Step 2: Push Repository to GitHub
If you haven't already linked your Git repository to GitHub:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/miestilo-inventory.git
git branch -M master
git push -u origin master
```

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository (`miestilo-inventory`).
3. Under **Environment Variables**, add the following:
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | `mongodb+srv://miestilo_admin:<password>@cluster0.abcde.mongodb.net/miestilo_production?retryWrites=true&w=majority` |
   | `MONGODB_DB_NAME` | `miestilo_production` |
   | `AUTH_SECRET` | *(Generate a 32-char secret or run `openssl rand -base64 32`)* |
   | `APP_NAME` | `MiEstilo Luxury Linen Inventory` |
   | `DEFAULT_TIMEZONE` | `Asia/Kolkata` |
   | `DEFAULT_CURRENCY` | `INR` |
   | `NODE_ENV` | `production` |
4. Click **Deploy**. Vercel will build and deploy your application to a live `https://*.vercel.app` URL.

### Step 4: Seed Production Data
Once deployed, seed the production database with all 30 genuine MiEstilo products, warehouses, and staff accounts:
- **Option A (Terminal)**: Run locally pointing to production URI:
  ```bash
  MONGODB_URI="mongodb+srv://miestilo_admin:<password>@cluster0.abcde.mongodb.net/miestilo_production?retryWrites=true&w=majority" npm run seed
  ```
- **Option B (One-Click In-App)**: Open your deployed application, navigate to the sidebar footer, and click **"Reset MiEstilo Data"** (or make a `POST` request to `https://your-domain.com/api/v1/seed`).

---

## Method 2: Deploy to Self-Hosted VPS (DigitalOcean / AWS / Linode with Docker)

For maximum control or hosting within private VPCs.

### Prerequisites on Server:
- Ubuntu 22.04 / 24.04 LTS
- Docker & Docker Compose installed

### Step 1: Clone Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/miestilo-inventory.git /opt/miestilo
cd /opt/miestilo
```

### Step 2: Configure Production Environment
```bash
cp .env.production.example .env
nano .env
```
Set your `AUTH_SECRET` and confirm ports.

### Step 3: Build & Launch with Docker Compose
```bash
docker compose up -d --build
```

### Step 4: Run Initial Seed Inside Container
```bash
docker compose exec app npm run seed
```

### Step 5: Nginx & SSL (Certbot)
Point your custom domain (e.g. `inventory.miestilogroup.com`) to your server IP, and setup Nginx reverse proxy:
```nginx
server {
    server_name inventory.miestilogroup.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Run `sudo certbot --nginx -d inventory.miestilogroup.com` to obtain free SSL.

---

## Method 3: Deploy to Railway / Render

1. Create a new project on **Railway** or **Render**.
2. Connect your GitHub repository.
3. Add a **MongoDB** plugin service or paste your **MongoDB Atlas** connection string.
4. Set Environment Variables (`MONGODB_URI`, `AUTH_SECRET`, `NODE_ENV=production`).
5. Set start command: `npm run start` and build command: `npm run build`.
6. Railway / Render will automatically deploy with a public HTTPS URL.

---

## Production Security & Operational Checklist

- [ ] **Rotate Default Password**: Log in as `owner@miestilo.com` (`Misterio@2026`) and change to a strong administrative password.
- [ ] **Unique Secrets**: Ensure `AUTH_SECRET` is a secure 32+ character random string in production.
- [ ] **MongoDB Automated Backups**: If using Atlas, verify continuous backups or snapshot schedules are enabled.
- [ ] **Health Monitoring**: Monitor uptime using the built-in health endpoint:
  ```bash
  curl https://your-domain.com/api/v1/health
  ```
- [ ] **Custom Domain**: Set up CNAME `inventory.miestilogroup.com` pointing to your Vercel or VPS deployment.
