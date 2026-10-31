# Deployment

The recommended deployment is documented in the root [README](./README.md#recommended-deployment): Supabase for PostgreSQL, Render for the Spring Boot API, and Vercel for the React frontend.

## Before deploying

A database credential was previously present in tracked application configuration. Removing it from the current source does not remove it from Git history. Rotate the Supabase database password before going live, then update `DB_PASSWORD` in Render. Rotate any other credentials if they were committed or shared.

Do not commit `.env` files or enter database credentials in Vercel. The root `.dockerignore` excludes local environment files and non-backend folders from the Render Docker build context.

## Deploy the backend

1. Push the updated repository to GitHub.
2. In Render, create a Blueprint from the repository. Render reads [`render.yaml`](./render.yaml) and creates the Docker-based Spring Boot web service.
   - The Blueprint selects the Docker runtime and root `Dockerfile`. If creating a web service manually, set **Language** to **Docker**, **Dockerfile Path** to `./Dockerfile`, and the build context to the repository root.
   - Do not set a native build command such as `./mvnw clean package`. This repository has no Maven wrapper; the Dockerfile installs/runs Maven in its Java build image.
   - If logs show `./mvnw: No such file or directory` or detect Elixir, the existing service is configured with the wrong runtime/build command. Create a replacement from the Blueprint or as a Docker web service. Keep the old service until the replacement deploys and passes its health check.
3. Set the required environment values in the Render service:
   - `DB_URL`: Supabase JDBC URL using the connection details shown by Supabase. For a long-running Render service, use the Supabase session pooler and include `sslmode=require`.
   - `DB_USER` and `DB_PASSWORD`: pooler username and the newly rotated database password.
   - `FRONTEND_URL`: the deployed Vercel origin, with no trailing slash. Multiple exact origins can be comma-separated, for example `https://your-shop.vercel.app,https://your-preview.vercel.app`. Avoid wildcard origins; use the stable production domain where possible.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` if Google sign-in is enabled.
   - Payment and Telegram values only for integrations you use.
4. Keep Render's generated `JWT_SECRET`; do not replace it with a development value. The Blueprint sets the production profile and the service health check.
5. Wait for the Render deploy to report healthy, then open `https://<your-render-service>/api/products`. The API should return a products response. The admin login endpoint only accepts `POST`; opening `/api/auth/admin/login` directly in a browser sends `GET` and is expected to return “Request method 'GET' is not supported.”
6. Set the Vercel `VITE_API_URL` to `https://<your-render-service>/api`, deploy the frontend, and then set that Vercel site origin as Render's `FRONTEND_URL`. Redeploy the backend after changing CORS or OAuth settings.

Use the full variable list and frontend, OAuth, and end-to-end verification steps in the root [README](./README.md#recommended-deployment). Render's local disk is ephemeral: product/customer uploads need durable object storage before relying on them in production.
