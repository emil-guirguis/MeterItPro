# Quick Start: Deploy to Cloudflare Pages

## 🚀 Quick Deployment Steps

### 1. Build Your Frontend Locally (Test First)
```bash
npm run build:client
```

This will create the production build in `client/frontend/dist/`

### 2. Deploy to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard (Recommended)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Connect your repository
4. Use these build settings:
   - **Root directory**: `/` (the project root)
   - **Build command**: `npm run build:client`
   - **Build output directory**: `client/frontend/dist`
   - **Node version**: 18 (or higher)

#### Option B: Via Wrangler CLI
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy client/frontend/dist --project-name=your-project-name
```

### 3. Set Environment Variables

In Cloudflare Pages → Your Project → **Settings** → **Environment variables**:

Add:
- **Variable name**: `VITE_API_BASE_URL`
- **Value**: Your backend API URL (e.g., `https://api.yourdomain.com/api`)

### 4. Connect Your Domain

1. In Cloudflare Pages → Your Project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Cloudflare will auto-configure DNS

### 5. Deploy Your Backend

Your backend needs to be deployed separately. See `DEPLOYMENT.md` for options.

## ✅ Verification Checklist

After deployment:
- [ ] Frontend loads at your domain
- [ ] All routes work (try navigating to different pages)
- [ ] API calls work (check browser console)
- [ ] Environment variable `VITE_API_BASE_URL` is set correctly
- [ ] HTTPS is enabled (automatic with Cloudflare)

## 🔧 Troubleshooting

**Routes return 404?**
- The `_redirects` file should handle this. Verify it's in `client/frontend/public/`

**API calls fail?**
- Check `VITE_API_BASE_URL` is set correctly
- Verify backend CORS allows your domain
- Check browser console for errors

**Build fails?**
- Check build logs in Cloudflare dashboard
- Ensure all dependencies are in `package.json`
- Try building locally first: `npm run build:client`

## 📚 Full Documentation

See `DEPLOYMENT.md` for complete deployment guide and backend deployment options.
