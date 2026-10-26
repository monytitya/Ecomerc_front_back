# Ecomerc

An e-commerce application with a React + Vite frontend and a Java 21 / Spring Boot backend. The backend uses PostgreSQL, Spring Data JPA, and JWT authentication.

## Recommended deployment

Deploy each part to the service that best fits it:

| Part | Host | Purpose |
| --- | --- | --- |
| PostgreSQL database | [Supabase](https://supabase.com/) | Managed PostgreSQL database |
| Spring Boot API | [Render](https://render.com/) | Runs the Java backend and connects to PostgreSQL |
| React frontend | [Vercel](https://vercel.com/) | Builds and serves the Vite single-page application |

The browser talks to the Render API. Only the backend connects to Supabase; database credentials must never be placed in frontend environment variables.

## Deployment order

Deploy in this order so each service has the URL or connection details required by the next:

1. Create the Supabase PostgreSQL project and collect its connection details.
2. Deploy the backend to Render and configure its environment variables.
3. Deploy the frontend to Vercel using the Render API URL.
4. Add the final Vercel URL to Render's CORS setting and configure Google OAuth, if enabled.

### 1. Create the Supabase database

1. Create a Supabase project and save its database password securely.
2. In the Supabase dashboard, open **Connect** and select the **Session pooler** connection details. The session pooler is a suitable choice for a long-running backend service such as Render.
3. Use the pooler's host, port, and database name to create the JDBC URL:

   ```text
   jdbc:postgresql://<pooler-host>:<port>/<database>?sslmode=require
   ```

   Use the username shown for that pooler connection. Supabase pooler usernames may include the project reference, so use the displayed value rather than assuming it is just `postgres`.
4. Keep the database password separate; Render receives it through `DB_PASSWORD`.

The application currently uses Hibernate `ddl-auto=update` to create/update its tables at startup. Before production use, plan a versioned schema migration process (for example, Flyway) and enable regular database backups.

### 2. Deploy the backend to Render

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint** and select this repository. Render reads [`render.yaml`](./render.yaml), which defines the backend service with the Docker runtime and root [`Dockerfile`](./Dockerfile). If creating a web service manually instead, set **Language** to **Docker**, **Dockerfile Path** to `./Dockerfile`, and the build context to the repository root. Do not configure `./mvnw` as a Render build command; Maven runs inside the Docker build.
3. Set the backend's environment variables in Render:

   | Variable | Value |
   | --- | --- |
   | `SPRING_PROFILES_ACTIVE` | `prod` (set by the Blueprint) |
   | `DB_URL` | The Supabase JDBC URL from the previous step |
   | `DB_USER` | The username shown for the Supabase session pooler |
   | `DB_PASSWORD` | The Supabase database password |
   | `FRONTEND_URL` | The Vercel site origin, e.g. `https://your-shop.vercel.app` (no trailing slash) |
   | `JWT_SECRET` | Use Render's generated value; do not use the development default |
   | `JWT_EXPIRATION` | Milliseconds; the Blueprint defaults to `86400000` (24 hours) |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID, if Google sign-in is enabled |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret, if Google sign-in is enabled |
   | `GOOGLE_REDIRECT_URI` | `https://your-shop.vercel.app/oauth2/callback` |
   | `KHQR_MERCHANT_ID`, `KHQR_API_TOKEN` | Configure if KHQR payment is used |
   | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Configure if Telegram notifications are used |

   `KHQR_MERCHANT_NAME` and `KHQR_CITY` have Blueprint defaults. Do not commit production secrets or put secrets in any `VITE_*` variable; Vite values are included in browser-delivered files.
4. Deploy the service. Its health check is `/api/products`. Copy the public service URL, for example `https://your-api.onrender.com`.

The production profile requires `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, and `FRONTEND_URL` to be configured on Render; it does not fall back to local database or signing-secret values. The Blueprint generates `JWT_SECRET`. Use the intended Vercel origin for `FRONTEND_URL`, then update it and redeploy the backend after the frontend is deployed if the final origin differs. Local runs default to the `dev` profile; do not copy local `.env` credentials into Render or Vercel.

**Render build troubleshooting:** If the build log says `./mvnw: No such file or directory` or detects Elixir, the web service is using a native runtime/build command instead of this repository's Docker configuration. The repository does not include a Maven wrapper; the [`Dockerfile`](./Dockerfile) uses Maven directly in its Java build image. Create or replace the service from the Blueprint above, or create a Docker web service manually with the root Dockerfile. Keep the existing service until the replacement is healthy, then update integrations to the replacement URL.

The Spring Boot production profile uses Render's `PORT` environment variable when provided. The Docker image's port `9090` is the local/default port.

### 3. Deploy the frontend to Vercel

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to `Frontend`.
3. Use the Vite defaults or set:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add these environment variables for the Production environment:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://your-api.onrender.com/api` |
   | `VITE_GOOGLE_CLIENT_ID` | The same Google OAuth client ID as the backend, if Google sign-in is enabled |
   | `VITE_GOOGLE_REDIRECT_URI` | `https://your-shop.vercel.app/oauth2/callback` |

5. Deploy. The [`Frontend/vercel.json`](./Frontend/vercel.json) rewrite sends SPA routes (including `/oauth2/callback`) to the app entry point.

The Vercel build requires `VITE_API_URL` to be the full HTTPS Render API URL ending in `/api`; it stops with a clear error if the value is missing or invalid. A relative `/api` URL would send requests to Vercel instead of Render. Vite variables are read at build time, so redeploy the frontend after changing them. Set the final Vercel URL as `FRONTEND_URL` in Render and redeploy the backend so its CORS allow-list matches the frontend origin.

### 4. Configure Google OAuth (optional)

In Google Cloud Console, configure the OAuth client:

- **Authorized JavaScript origin:** `https://your-shop.vercel.app`
- **Authorized redirect URI:** `https://your-shop.vercel.app/oauth2/callback`

The redirect URI must exactly match both `GOOGLE_REDIRECT_URI` on Render and `VITE_GOOGLE_REDIRECT_URI` on Vercel. If you add a custom domain, update these URLs, `FRONTEND_URL`, and the Vercel environment variables, then redeploy both services.

## Verify the deployment

1. Open `https://your-api.onrender.com/api/products`. Confirm the API responds.
2. Open `https://your-shop.vercel.app` and refresh a nested route to verify the SPA rewrite.
3. Test account registration and login, product browsing, image upload, checkout, and payment integrations that you enabled.
4. If Google sign-in is enabled, test the full OAuth redirect and return to the site.

## Production considerations

- **Uploaded files:** The application writes uploads under a local `uploads/` directory. Render's local filesystem is ephemeral, so uploaded product/customer images can disappear after a restart or deploy. Use durable object storage (such as Cloudinary or an S3-compatible service) before relying on uploads in production.
- **Cold starts and availability:** Check the current Render plan's sleep, resource, and availability behavior; a sleeping service may delay the first API request.
- **Database safety:** Take backups and move from automatic Hibernate schema updates to reviewed, versioned migrations as the production schema evolves.
- **Secrets:** Store credentials only in Render's environment settings or a secret manager. Rotate credentials from any local `.env` file that has been shared or committed. Never commit `.env` files or expose database passwords, JWT secrets, or provider tokens to the Vite frontend.

## Running locally

- Backend: run the Spring Boot application with Java 21 and Maven.
- Frontend: from `Frontend`, run `npm ci`, then `npm run dev`.
- For local PostgreSQL and containers, see [`docker-compose.yml`](./docker-compose.yml). Keep local credentials in ignored `.env` files and do not reuse development secrets in production.

For deployment-only notes, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).
