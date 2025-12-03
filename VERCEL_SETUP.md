# Vercel Deployment Guide for FindAura

## 🚀 Quick Setup

Your website is now configured to work with Vercel! Follow these steps to complete the setup.

## Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your **findaura** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add the following variables:

### Required Environment Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `GMAIL_USER` | your-email@gmail.com | Your Gmail address |
| `GMAIL_APP_PASSWORD` | xxxx xxxx xxxx xxxx | Your 16-character Gmail App Password |
| `RECIPIENT_EMAIL` | your-email@gmail.com | Email where you receive submissions (optional, defaults to GMAIL_USER) |

### How to Generate Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select **"Mail"** and **"Other (Custom name)"**
5. Name it **"FindAura Vercel"**
6. Click **Generate**
7. Copy the **16-character password** (format: `xxxx xxxx xxxx xxxx`)
8. Paste it in Vercel (you can include or remove spaces)

## Step 2: Redeploy Your Project

After adding the environment variables:

1. Go to the **Deployments** tab in Vercel
2. Click on the **three dots (...)** next to the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional)
5. Click **Redeploy**

OR simply push a new commit to trigger automatic deployment:

```bash
cd /home/anis/findaura
git add .
git commit -m "Add Vercel serverless function for email"
git push
```

## Step 3: Test Your Form

1. Visit your live website: `https://your-project.vercel.app`
2. Fill out the contact form
3. Click Submit
4. Check your email inbox (and spam folder)

## 📁 What Changed?

### New Files:
- `/api/submit.js` - Vercel serverless function (replaces submit.php)
- `package.json` - Node.js dependencies (nodemailer)
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variables template

### Updated Files:
- `script.js` - Now sends to `/api/submit` instead of `submit.php`
- `.gitignore` - Added node_modules and .env files

### Files You Can Delete (Optional):
- `submit.php` - No longer needed (Vercel doesn't support PHP)
- `config.php` - Replaced by environment variables
- `config.example.php` - No longer needed

## 🔧 Troubleshooting

### Form still shows error?
1. Check that environment variables are set in Vercel
2. Make sure you redeployed after adding variables
3. Check Vercel Function Logs for errors

### Email not arriving?
1. Check spam folder
2. Verify Gmail App Password is correct
3. Make sure 2-Step Verification is enabled on Gmail
4. Check Vercel Function Logs for detailed errors

### How to view Vercel Function Logs:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click on **Functions** tab
6. Click on `/api/submit`
7. View the logs

## ✅ Checklist

- [ ] Added `GMAIL_USER` environment variable in Vercel
- [ ] Added `GMAIL_APP_PASSWORD` environment variable in Vercel
- [ ] Generated Gmail App Password from Google
- [ ] Enabled 2-Step Verification on Gmail
- [ ] Redeployed the project in Vercel
- [ ] Tested the form on live site
- [ ] Received test email successfully

## 🎉 You're Done!

Once you complete these steps, your contact form will work perfectly on Vercel!

---

**Need Help?**
- Vercel Documentation: https://vercel.com/docs
- Nodemailer Documentation: https://nodemailer.com/
