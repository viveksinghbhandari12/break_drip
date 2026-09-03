# BREAK & DRIP — Full-Stack E-Commerce Platform

Streetwear store built with React (Vite), Node/Express, MySQL, and Stripe Checkout.

See `docs/PROJECT_SPEC.md` for the full spec, design tokens, and API surface.

## Structure

```
break-drip/
├── backend/          Express API (auth, products, cart, wishlist, reviews, coupons, checkout, orders)
├── frontend/          React app (Vite + Tailwind)
└── docs/              Project spec
```

## 1. Database setup

Install MySQL 8 locally (or use a hosted instance), then run:

```bash
mysql -u root -p < backend/config/schema.sql
```

This creates the `break_drip` database, all tables, and seeds 5 sample products with variants and 2 coupons (`DRIP10`, `BREAK20`).

To make yourself an admin, after registering an account through the app run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

**If you already ran the old schema (Stripe version):** run this migration instead of re-creating the DB:
```sql
ALTER TABLE orders DROP COLUMN stripe_session_id;
ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(255);
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set DB_PASSWORD, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
npm install
npm run dev
```

API runs on `http://localhost:5000`.

**Razorpay keys:** get test-mode keys from the Razorpay dashboard (dashboard.razorpay.com → Settings → API Keys). For the webhook, go to Settings → Webhooks, add `https://your-backend-url/api/checkout/webhook`, subscribe to `payment.captured` and `payment.failed`, and set a webhook secret — put it in `RAZORPAY_WEBHOOK_SECRET`. For local testing, use a tunnel (ngrok, Cloudflare Tunnel) to expose `localhost:5000` since Razorpay's dashboard needs a public URL — it can't forward to localhost the way the Stripe CLI could.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173` and proxies `/api` calls to the backend.

## 4. Test checkout

Use Razorpay's test card: `4111 1111 1111 1111`, any future expiry, any CVC. For UPI testing, use `success@razorpay` as the UPI ID in test mode.

## 5. Product images

Seeded products reference `/assets/*.jpg` placeholders — swap `image_url` in the `products` table for real hosted image URLs (S3, Cloudinary, etc.) once you have product photography.

## 6. Deployment notes

- **Frontend:** Vercel/Netlify (`npm run build` → deploy `dist/`)
- **Backend:** Render/Railway/Fly.io (Node host with env vars set)
- **Database:** PlanetScale, Railway MySQL, or AWS RDS
- Set `CLIENT_URL` in backend `.env` to your deployed frontend URL, and update the webhook endpoint URL in the Razorpay dashboard once the backend is live.
- Switch `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to live-mode keys only when ready to accept real payments (requires KYC approval from Razorpay first).

## 7. Figma

This build ships design tokens (colors, type, layout concept) in `docs/PROJECT_SPEC.md` §1 — paste these into Figma as local variables/styles to keep a design file in sync with the coded UI. I can't generate a `.fig` file directly from this environment.

## What's stubbed vs. complete

**Fully implemented:** auth (JWT + bcrypt), product catalog + filtering, variants/stock, cart, wishlist, reviews, coupons, address book, Razorpay checkout (client-side signature verification + server-side webhook as a backup path) with order fulfillment and stock decrement, order history with shipping address.

**You'll want to add before production:** email notifications (order confirmation/shipping), image upload pipeline, admin UI (routes exist on the backend — `/api/admin/orders`, product CRUD — but there's no dedicated admin dashboard page yet), pagination controls on the shop page (API supports `page`/`limit`, UI doesn't call it yet), and rate limiting on auth routes.
