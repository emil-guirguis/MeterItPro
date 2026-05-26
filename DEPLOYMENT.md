# Cloudflare Pages Deployment Guide

This guide will help you deploy your MeterIt Pro application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Your domain name added to Cloudflare
3. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Cloudflare to access your repository
5. Select the `MeterItPro` repository

### 2. Configure Build Settings

In the Cloudflare Pages setup, use these settings:

- **Project name**: `meteritpro` (or your preferred name)
- **Production branch**: `main` (or `master` depending on your default branch)
- **Build command**: `npm run build:client`
- **Build output directory**: `client/frontend/dist`
- **Root directory**: `/` (leave as root)
- **Environment variables**: Add any required environment variables (see below)

### 3. Environment Variables

Add these environment variables in Cloudflare Pages settings:

- `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://api.yourdomain.com/api` or your backend server URL)
  - **Important**: Include the `/api` path if your backend serves the API at that path
  - Example: `https://api.yourdomain.com/api` or `https://your-backend.railway.app/api`
- Any other environment variables your frontend needs

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser.

**How to add environment variables in Cloudflare Pages:**
1. Go to your project in Cloudflare Pages
2. Click on **Settings** → **Environment variables**
3. Add `VITE_API_BASE_URL` with your backend URL
4. Make sure to add it for both **Production** and **Preview** environments if needed

### 4. Custom Domain Setup

1. In Cloudflare Pages, go to your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name (e.g., `yourdomain.com` or `www.yourdomain.com`)
4. Cloudflare will automatically configure DNS records

### 5. DNS Configuration

If your domain is already on Cloudflare:

- Cloudflare will automatically create the necessary DNS records
- The site will be available at your domain within a few minutes

If your domain is not on Cloudflare:

1. Add your domain to Cloudflare
2. Update your domain's nameservers to Cloudflare's nameservers
3. Cloudflare Pages will automatically configure DNS

## Backend Deployment

Your backend API (`client/backend`) needs to be deployed separately. Options:

### Option 1: Cloudflare Workers (Recommended for serverless)

1. Install Wrangler CLI: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy your backend as a Cloudflare Worker

**Note**: Your current Express backend may need modifications to work with Cloudflare Workers, as they use a different runtime.

### Option 2: Traditional Hosting

Deploy your backend to:
- Railway
- Render
- Heroku
- DigitalOcean
- AWS EC2
- Any Node.js hosting service

Then update your frontend's `VITE_API_URL` environment variable to point to your backend URL.

### Option 3: Cloudflare Tunnel (For self-hosted backend)

If you want to keep your backend on your own server:

1. Install `cloudflared` on your server
2. Create a Cloudflare Tunnel
3. Expose your backend through the tunnel

## Post-Deployment Checklist

- [ ] Verify frontend is accessible at your domain
- [ ] Test all frontend routes (SPA routing should work)
- [ ] Verify API calls are working (check browser console)
- [ ] Test authentication flow
- [ ] Verify environment variables are set correctly
- [ ] Check that HTTPS is enabled (Cloudflare enables this by default)
- [ ] Test on mobile devices

## Troubleshooting

### SPA Routing Not Working

The `_redirects` file in `client/frontend/public/` should handle this. If routes aren't working:

1. Verify `_redirects` file exists in the build output
2. Check Cloudflare Pages Functions (may need to add a function for routing)

### API Calls Failing

1. Check CORS settings on your backend
2. Verify `VITE_API_URL` environment variable is set correctly
3. Check browser console for errors
4. Ensure your backend is accessible from the internet

### Build Failures

1. Check build logs in Cloudflare Pages dashboard
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is compatible (Cloudflare Pages uses Node 18 by default)

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
