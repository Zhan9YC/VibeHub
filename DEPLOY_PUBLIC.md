# Public Deployment Guide

## 1. Temporary public page

If you only need a page that external users can open right now, upload this file to any static host:

- `public/vibehub-public.html`

Recommended quick uses:

- Cloudflare Pages static upload
- Netlify drag-and-drop deploy
- GitHub Pages
- Any object storage bucket with website hosting enabled

You can rename the file to `index.html` before uploading if your host expects a default entry file.

## 2. Full public deployment for the Next.js app

This project uses:

- Next.js 14
- Supabase Auth / Postgres / Storage

For the full site, deploy the whole app instead of only the HTML file.

### Required environment variables

Use these values in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-public-domain.com
ADMIN_EMAILS=your-admin@example.com
ADMIN_USER_IDS=your-admin-user-uuid
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Important auth updates

After you get a public URL or custom domain, update:

1. `NEXT_PUBLIC_SITE_URL`
2. Supabase Auth site URL
3. Supabase Auth redirect allow list
4. Google OAuth allowed redirect URLs if Google login is enabled

Use this callback path for production:

```text
https://your-public-domain.com/auth/callback
```

## 3. Recommended production path

### Option A: deploy the full app to Vercel

This is the most direct option for this repo because it is already a standard Next.js project.

Typical flow:

1. Import the repo into Vercel
2. Add the required environment variables
3. Deploy
4. Copy the generated public URL
5. Update `NEXT_PUBLIC_SITE_URL` and Supabase Auth URLs
6. Add your custom domain

## 4. Recommended immediate sharing path

If you want to let other people open the running local app before formal deployment:

1. Keep `npm run dev` running on `localhost:3000`
2. Use a temporary tunnel tool
3. Share the generated public URL

This is good for demos and testing, but not ideal for long-term production.
