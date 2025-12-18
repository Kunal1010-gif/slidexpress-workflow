# Slidexpress Workflow - Free Deployment Guide

This guide will help you deploy your full-stack application for free.

## Prerequisites
- GitHub account (to push your code)
- Render account (sign up at https://render.com)
- Vercel account (sign up at https://vercel.com)

---

## Part 1: Deploy Backend to Render (Free)

### Step 1: Push Your Code to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Create Web Service on Render
1. Go to https://render.com and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `slidexpress-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables on Render
In the Render dashboard, go to "Environment" section and add:
- `PORT` = `5000`
- `MONGO_URI` = `mongodb+srv://techsupport:tech902@cluster0.5uckqkq.mongodb.net/?appName=Cluster0`
- `JWT_SECRET` = `ajKHS8sja8273shs8HS8hs82hs$`
- `EMAIL_USER` = `techsupport@mecstudio.com`
- `EMAIL_PASSWORD` = `rvpy odwi hkxv kpgw`

### Step 4: Deploy
Click "Create Web Service" and wait for deployment to complete (5-10 minutes).

After deployment, you'll get a URL like: `https://slidexpress-backend.onrender.com`

**IMPORTANT:** Copy this URL! You'll need it for the frontend deployment.

---

## Part 2: Deploy Frontend to Vercel (Free)

### Step 1: Deploy to Vercel
1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Add Environment Variable
In the Vercel project settings, go to "Environment Variables" and add:
- **Key**: `VITE_API_URL`
- **Value**: `https://YOUR-RENDER-URL.onrender.com/api`
  (Replace with your actual Render URL from Part 1)

### Step 3: Deploy
Click "Deploy" and wait for deployment (2-3 minutes).

After deployment, you'll get a URL like: `https://slidexpress-workflow.vercel.app`

---

## Part 3: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try logging in with your credentials
3. Verify all features work correctly

---

## Important Notes

### Free Tier Limitations:
- **Render Free Tier**:
  - Server spins down after 15 minutes of inactivity
  - First request after inactivity may take 30-60 seconds
  - 750 hours/month free

- **Vercel Free Tier**:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Automatic SSL certificates

### Security Recommendations:
1. After deployment, consider rotating your credentials
2. Use different MongoDB user for production
3. Generate a stronger JWT_SECRET
4. Enable MongoDB IP whitelist (allow all for Render: `0.0.0.0/0`)

---

## Alternative Free Hosting Options

### Backend Alternatives:
- **Railway**: https://railway.app (Free $5 credit/month)
- **Cyclic**: https://cyclic.sh (Simple Node.js hosting)
- **Fly.io**: https://fly.io (Free tier with 256MB RAM)

### Frontend Alternatives:
- **Netlify**: https://netlify.com (Similar to Vercel)
- **Cloudflare Pages**: https://pages.cloudflare.com
- **GitHub Pages**: For static sites only

---

## Troubleshooting

### Backend won't start:
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### Frontend can't connect to backend:
- Verify VITE_API_URL is set correctly in Vercel
- Check CORS settings in server (should allow your Vercel domain)
- Open browser console to see network errors

### Cold starts (Render free tier):
- First request after inactivity takes time
- Consider upgrading to paid tier for always-on service
- Or use a cron job to ping your API every 14 minutes

---

## Support

If you encounter issues:
1. Check Render deployment logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify all environment variables are correct
