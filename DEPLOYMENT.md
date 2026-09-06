# Deployment

## 1. Rotate local secrets

The local `.env` contains credentials. Rotate the database, Google OAuth, Bakong, Telegram, and JWT values before deploying or pushing the repository.

## 2. Create the Supabase database

1. Create a Supabase project.
2. Open **Connect > JDBC**.
3. Copy the session pooler JDBC URL and use it as `DB_URL`.
4. Set `DB_USER` and `DB_PASSWORD` from Supabase.
5. Run the schema/data migration required by this project.

Use a URL like:

```text
jdbc:postgresql://<host>:5432/postgres?sslmode=require
```

## 3. Deploy with Render Blueprint

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select the repository and use `render.yaml`.
4. Enter every variable marked `sync: false` in the Render dashboard.
5. Deploy the backend first and copy its public URL.

Set the frontend variables to:

```text
VITE_API_URL=https://<backend-name>.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<Google client ID>
VITE_GOOGLE_REDIRECT_URI=https://<frontend-name>.onrender.com/oauth2/callback
```

Set the backend variables to:

```text
FRONTEND_URL=https://<frontend-name>.onrender.com
GOOGLE_REDIRECT_URI=https://<frontend-name>.onrender.com/oauth2/callback
```

## 4. Configure Google OAuth

In Google Cloud Console, add these values to the OAuth client:

- Authorized JavaScript origins: `https://<frontend-name>.onrender.com`
- Authorized redirect URI: `https://<frontend-name>.onrender.com/oauth2/callback`

The redirect URI must match exactly.

## 5. Configure product images

The current application stores uploads in the local `uploads/` directory. Render web-service storage is ephemeral, so product images can disappear after redeploys or restarts. Integrate Cloudinary before production use and store the Cloudinary URL or public ID in `productImg`.

## 6. Verify deployment

Check these URLs after deployment:

```text
https://<backend-name>.onrender.com/api/products
https://<frontend-name>.onrender.com/login
```

Then test registration, login, cart checkout, KHQR payment, and the OAuth callback.
