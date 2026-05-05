# Deploy Dice Bot to Railway

## Step-by-Step Instructions for Your Own Account

### 1. **Prerequisites**
   Before starting, have ready:
   - Your own **Telegram Bot Token** from @BotFather
   - Your own **Firebase Service Account Key** (JSON file)
   - GitHub account with access to this repository
   - Railway account (sign up at https://railway.app)

### 2. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Sign in with **your own GitHub account**
   - Click **"+ New Project"** button

### 3. **Create New Project from GitHub**
   - Click **"Deploy from GitHub"**
   - Find and select the **pv8cn876ys-cmd/dice** repository
   - Click **"Deploy Now"**
   - Railway will start building your project

### 4. **Set Environment Variables**
   Once the project is created and shows in Railway:
   - Click on your project
   - Go to **"Variables"** tab
   - Add these environment variables:

   #### Get Your Telegram Bot Token:
   1. Open Telegram and search for **@BotFather**
   2. Send `/start` then `/mybots`
   3. Select your bot
   4. Click **API Token**
   5. Copy and paste it here as `TELEGRAM_BOT_TOKEN`

   #### Get Your Firebase Service Account Key:
   1. Go to [Firebase Console](https://console.firebase.google.com/)
   2. Select your project
   3. Click **Project Settings** (⚙️ icon)
   4. Go to **Service Accounts** tab
   5. Click **Generate New Private Key** (or use existing)
   6. A JSON file downloads — open it and add these variables:

   **Variables to set in Railway:**
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...entire key content...\n-----END PRIVATE KEY-----\n
   ```

   ⚠️ **Important for FIREBASE_PRIVATE_KEY:**
   - Copy the entire key from the JSON file
   - Replace `\n` characters with actual newlines like this: `\n` stays as-is in Railway (it will convert automatically)
   - Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### 5. **Configure the Start Command**
   In Railway:
   - Go to **"Settings"** tab
   - Look for **"Start Command"** or **"Runtime"**
   - Set it to: `npm start`
   - Or manually: `node telegram-bot/bot.js`

### 6. **Deploy**
   - Click **"Deploy"** button
   - Railway will install dependencies and start your bot
   - Wait for it to complete (watch the logs)
   - You should see: ✅ Telegram bot started

### 7. **Verify It's Running**
   - You should see logs like: `✅ Telegram bot started - monitoring groups for Dice commands`
   - Your bot will now run **24/7 for FREE** on Railway!

---

## Cost
- **FREE** - Railway gives you $5/month free credits
- Your bot uses ~$0.50-$1/month max
- No payment required unless you exceed free tier

## What Happens Now
- ✅ Bot runs 24/7 in the cloud
- ✅ Responds to "Dice" and 🎲 in Telegram groups
- ✅ Stores user data in your Firebase project
- ✅ Frontend and backend working together

---

## Troubleshooting

### Bot doesn't start?
1. Check logs in Railway dashboard
2. Verify all environment variables are set correctly
3. Make sure `TELEGRAM_BOT_TOKEN` is correct (no spaces, complete)
4. Verify `FIREBASE_PRIVATE_KEY` has proper formatting with `\n` characters
5. Check that the repository is connected and deployed

### "Cannot find token" error?
- The `TELEGRAM_BOT_TOKEN` environment variable is not set
- Go to Variables tab and add it from @BotFather

### "Firebase credentials error"?
- Check that `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are all set
- Make sure the private key includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
- Verify no extra spaces or characters

---

## Next Steps
1. ✅ Connect your GitHub repo to Railway
2. ✅ Set your environment variables in Railway dashboard
3. ✅ Deploy and verify logs
4. 📱 Add bot to Telegram groups and test!

Need help? Check the logs in Railway dashboard for specific errors.
