# Quick Deployment Steps

## 5-Minute Deployment Guide

### Step 1: Push to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend (Render) - 5 minutes
1. Go to https://render.com → Sign up/Login
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`
5. Add Environment Variables (copy from server/.env):
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://techsupport:tech902@cluster0.5uckqkq.mongodb.net/?appName=Cluster0
   JWT_SECRET=ajKHS8sja8273shs8HS8hs82hs$
   EMAIL_USER=techsupport@mecstudio.com
   EMAIL_PASSWORD=rvpy odwi hkxv kpgw
   ```
6. Click "Create Web Service"
7. **Copy your backend URL** (e.g., `https://slidexpress-backend.onrender.com`)

### Step 3: Deploy Frontend (Vercel) - 2 minutes
1. Go to https://vercel.com → Sign up/Login
2. Click "Add New" → "Project"
3. Import your GitHub repo
4. Settings:
   - Root Directory: `client`
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api
   ```
   (Replace with your actual Render URL from Step 2)
6. Click "Deploy"

### Step 4: Done!
Your app is now live:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`

---

## Important Notes

1. **First Load Delay**: Render free tier sleeps after 15 min inactivity. First request may take 30-60 seconds.

2. **MongoDB Access**: Ensure MongoDB Atlas allows connections from anywhere:
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (Allow from anywhere)

3. **Custom Domain** (Optional):
   - Vercel: Project Settings → Domains → Add domain
   - Render: Settings → Custom Domain

---

## Your URLs After Deployment

Fill these in after deployment:

- **Backend API**: `https://_____________________.onrender.com`
- **Frontend**: `https://_____________________.vercel.app`
- **MongoDB**: Already hosted on Atlas ✓

---

## Need Help?

Common Issues:
- **500 Error**: Check Render logs, verify env variables
- **Can't connect**: Check VITE_API_URL in Vercel settings
- **MongoDB Error**: Verify IP whitelist (0.0.0.0/0)
- **Slow loading**: Normal for Render free tier (cold starts)

See DEPLOYMENT_GUIDE.md for detailed troubleshooting.
