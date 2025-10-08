# 🚀 CSV Sensei Dashboard - Vercel Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ A Vercel account (free tier is sufficient)
- ✅ Your project pushed to GitHub
- ✅ Environment variables ready (MongoDB URI, OpenAI API Key, etc.)

## 🔧 Changes Made for Vercel Deployment

I've made the following changes to optimize your project for Vercel:

### 1. **vercel.json Configuration**

- Created `vercel.json` to handle multiple backend services
- Configured routing for frontend, main API, and chatbot API
- Set up proper build configurations

### 2. **Updated vite.config.ts**

- Fixed proxy configuration for chatbot API
- Added production build optimizations
- Configured manual chunks for better performance

### 3. **Enhanced CORS Settings**

- Updated both backend services to accept Vercel domains
- Added support for `*.vercel.app` and your specific domain

### 4. **Build Scripts**

- Added `vercel-build` script for comprehensive building
- Optimized build process for production

## 📝 Step-by-Step Deployment Guide

### Step 1: Prepare Your Repository

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Create Vercel Project

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**:
   - Select your CSV Sensei Dashboard repository
   - Click "Import"

### Step 3: Configure Project Settings

1. **Project Name**: `csv-sensei-dash` (or your preferred name)
2. **Framework Preset**: Select "Vite"
3. **Root Directory**: Leave as default (should be the root)
4. **Build Command**: `npm run vercel-build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`

### Step 4: Set Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

#### Frontend Variables:

```
VITE_CHATBOT_API_URL = /chatbot-api/chat
```

#### Backend Variables:

```
MONGODB_URI = your_mongodb_connection_string
PORT = 4000
NODE_ENV = production
```

#### Chatbot Backend Variables:

```
OPENAI_API_KEY = your_openai_api_key
OPENAI_MODEL = gpt-4
FRONTEND_URL = https://your-project-name.vercel.app
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

### Step 5: Deploy

1. **Click "Deploy"** in the Vercel dashboard
2. **Wait for deployment** to complete (usually 2-5 minutes)
3. **Check deployment logs** for any errors

### Step 6: Verify Deployment

1. **Visit your deployed URL** (e.g., `https://csv-sensei-dash.vercel.app`)
2. **Test the following features**:
   - ✅ Frontend loads correctly
   - ✅ File upload works
   - ✅ Dashboard displays data
   - ✅ Chatbot responds to messages
   - ✅ All dashboards (Compliance, Billing, Doctor Roster) work

## 🔍 Troubleshooting Common Issues

### Issue 1: Build Failures

**Solution**: Check the build logs in Vercel dashboard

- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation
- Check for missing environment variables

### Issue 2: API Routes Not Working

**Solution**:

- Verify `vercel.json` routing configuration
- Check environment variables are set correctly
- Ensure CORS settings include your domain

### Issue 3: Chatbot Not Responding

**Solution**:

- Verify `OPENAI_API_KEY` is set correctly
- Check chatbot API health endpoint
- Ensure rate limiting isn't blocking requests

### Issue 4: MongoDB Connection Issues

**Solution**:

- Verify `MONGODB_URI` is correct
- Ensure MongoDB allows connections from Vercel IPs
- Check if MongoDB Atlas is configured properly

## 📊 Project Architecture on Vercel

```
Your Vercel Deployment:
├── Frontend (Static) → https://your-app.vercel.app/
├── Main API → https://your-app.vercel.app/api/*
├── Chatbot API → https://your-app.vercel.app/chatbot-api/*
└── Static Assets → https://your-app.vercel.app/assets/*
```

## 🎯 Features That Will Work on Vercel

✅ **All Frontend Features**:

- Multi-dashboard system (Compliance, Billing, Doctor Roster, General BI)
- File upload and CSV processing
- Data validation and AI suggestions
- Interactive charts and visualizations
- Dark/light mode toggle
- Responsive design

✅ **Backend Services**:

- MongoDB data storage
- AI-powered insights
- Data analysis and processing
- User authentication

✅ **Chatbot Integration**:

- OpenAI-powered AI assistant
- Context-aware responses
- Conversation history
- Rate limiting and security

## 🔄 Updating Your Deployment

To update your deployment:

1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```
3. **Vercel will automatically redeploy** (if auto-deploy is enabled)
4. **Or manually trigger** deployment from Vercel dashboard

## 📈 Performance Optimizations

Your deployment includes:

- **Code splitting** for faster loading
- **Manual chunks** for vendor libraries
- **Compression** for API responses
- **Caching** for static assets
- **Rate limiting** for API protection

## 🛡️ Security Features

- **CORS protection** with specific domain allowlist
- **Rate limiting** on chatbot API
- **Input validation** on all endpoints
- **Helmet.js** security headers
- **Environment variable protection**

## 📞 Support

If you encounter any issues:

1. **Check Vercel deployment logs**
2. **Verify environment variables**
3. **Test locally** with production settings
4. **Check MongoDB and OpenAI API status**

## 🎉 Success!

Once deployed, your CSV Sensei Dashboard will be available at:
`https://your-project-name.vercel.app`

All features including the chatbot, multiple dashboards, file upload, and AI-powered insights will work exactly as they do locally!

---

**Happy Deploying!** 🚀📊
