# SnapCla-Pro


AI-powered nutrition tracker that analyzes food images using Google's Gemini API.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables by copying `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini API keys to `.env.local`:
   ```
   GEMINI_API_KEY=your_primary_api_key
   GEMINI_API_KEY_BACKUP=your_backup_api_key (optional)
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

## Features

- 📸 Food image recognition using Gemini AI
- 📊 Real-time nutrition analysis
- 💾 Food history tracking
- 🎯 Daily nutrition goals
- 🔄 Dual API key support for reliability

