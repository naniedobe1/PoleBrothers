# Cloudflare Worker - R2 Presigned URLs

This Cloudflare Worker generates presigned URLs for uploading images to R2.

## Setup Instructions

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### 3. Install Dependencies

From the `cloudflare-worker` directory:

```bash
cd cloudflare-worker
npm install
```

### 4. Configure Environment Variables

Set these secrets using Wrangler (they won't be visible in the code):

```bash
wrangler secret put R2_ACCESS_KEY_ID
# Paste: 90b54eba183c0ae862aecb95848999ca

wrangler secret put R2_SECRET_ACCESS_KEY
# Paste: ee3dee45dca3ac25f80e88abe67906261676a8697f725166d52e1ea57b94b8b9

wrangler secret put R2_ACCOUNT_ID
# Paste: 53b4b7104287c4b4d1c76fd9a2f52876

wrangler secret put R2_BUCKET_NAME
# Paste: pole-brothers-app

wrangler secret put R2_PUBLIC_URL
# This is the URL where your images will be accessible
# Format: https://pub-[hash].r2.dev OR your custom domain
# For now, use: https://53b4b7104287c4b4d1c76fd9a2f52876.r2.cloudflarestorage.com/pole-brothers-app
```

### 5. Enable Public Access (If Needed)

If you want images to be publicly accessible:

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click **Settings** tab
3. Under **Public Access**, click **Allow Access**
4. Copy the public bucket URL (format: `https://pub-[hash].r2.dev`)
5. Use that as your `R2_PUBLIC_URL`

OR set up a custom domain for better URLs.

### 6. Deploy the Worker

```bash
npm run deploy
```

After deployment, Wrangler will show you the Worker URL, something like:
```
https://pole-brothers-r2-worker.[your-subdomain].workers.dev
```

### 7. Update Mobile App

Add the Worker URL to your app's `.env` file:

```env
CLOUDFLARE_WORKER_URL=https://pole-brothers-r2-worker.[your-subdomain].workers.dev
```

## Testing

Test the worker with curl:

```bash
curl -X POST https://pole-brothers-r2-worker.[your-subdomain].workers.dev \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}'
```

Expected response:
```json
{
  "uploadUrl": "https://...[presigned URL]",
  "publicUrl": "https://...[public URL]",
  "filename": "poles/1234567890-test.jpg"
}
```

## How It Works

1. Mobile app requests a presigned URL by sending: `{filename, contentType}`
2. Worker generates a presigned PUT URL valid for 1 hour
3. Mobile app uploads image directly to R2 using the presigned URL
4. Mobile app saves the public URL to Supabase

## Troubleshooting

**CORS errors?**
- The worker includes CORS headers for all origins
- Check browser console for specific errors

**Upload fails?**
- Verify R2 credentials are correct
- Check bucket name is correct
- Ensure presigned URL hasn't expired (1 hour)

**Images not accessible?**
- Enable public access on your R2 bucket
- Or set up a custom domain
