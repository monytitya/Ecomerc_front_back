# Deploy Ecomerc with Cloudflare

This guide uses Cloudflare for the frontend, domain DNS, and traffic controls. It keeps the existing Java backend on Render and PostgreSQL database on Supabase:

| Component | Service | Example address |
| --- | --- | --- |
| React + Vite frontend | Cloudflare Pages | `https://electronic.com` |
| Spring Boot API | Render | `https://api.electronic.com` |
| PostgreSQL database | Supabase | Used privately by the backend |
| DNS, TLS settings, analytics, and traffic rules | Cloudflare | `electronic.com` zone |

Cloudflare Pages serves the built frontend. It does not run this repository's Spring Boot application. No Cloudflare Worker is needed for this deployment. The dashboard message **“No Workers connected”** is informational and does not mean the website failed to deploy.

## Before starting

- Confirm the current Render API works at `https://<your-service>.onrender.com/api/products`.
- Confirm the Vercel or other current frontend works, if you already have one. Keep it until the Cloudflare version passes the checks below.
- Have access to the Cloudflare account, the domain registrar, Render, Supabase, and GitHub.
- Do not put database passwords, JWT secrets, payment tokens, or other private credentials in Cloudflare Pages variables. Values beginning with `VITE_` are delivered to users' browsers and are public.
- If a private credential has been pasted into a chat, ticket, or source file, rotate it with its provider before production use. Never paste replacement credentials into chat.
- If you use email on `electronic.com`, record and preserve its MX, SPF, DKIM, and DMARC DNS records before changing nameservers.

## 1. Activate Cloudflare DNS for the domain

Your Cloudflare Overview screenshot showed **“Waiting for your registrar to propagate your new nameservers.”** Cloudflare is not authoritative for the domain until the registrar change is made.

1. In Cloudflare, select `electronic.com` and open **Overview**. Copy the two assigned Cloudflare nameservers shown there.
2. Sign in to the company where you registered `electronic.com`, open its nameserver settings, replace the existing nameservers with those exact two Cloudflare nameservers, and save.
   - Public registration data currently identifies [Spaceship](https://www.spaceship.com/) as the registrar. Sign in to the Spaceship account that manages the domain, open **Domain Management**, select `electronic.com`, and look for its **Nameservers** settings. If you bought the domain through a reseller, use the account where the domain is actually managed.
   - Public DNS currently lists `ns1.eftydns.com` and `ns2.eftydns.com`; this confirms the registrar change has not propagated yet. Replace them with the pair Cloudflare shows for your zone.
   - The supplied Cloudflare zone export lists `braelyn.ns.cloudflare.com` and `sullivan.ns.cloudflare.com`; use these only if they still match the pair shown on the Cloudflare Overview page.
   - Change nameservers at the registrar. Do not add these as ordinary DNS records.
3. Before or after the change, review **Cloudflare → DNS → Records** and make sure records for services you still use (especially email) are present. A nameserver change moves DNS authority to Cloudflare; it does not automatically move hosting or email.
4. Wait for Cloudflare Overview to show the domain as **Active**, then select **Check nameservers now** if needed. Updates often take a few hours and can take up to 24 hours.

Cloudflare can provide DNS even when a record is **DNS only** (gray cloud). DNS-only records do not pass website traffic through Cloudflare's HTTP proxy.

## 2. Deploy the frontend to Cloudflare Pages

1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** (dashboard wording may change).
2. Connect the GitHub repository that contains this application and select its production branch (`main` in the current checkout).
3. Configure the Vite build:

   | Pages setting | Value |
   | --- | --- |
   | Root directory | `Frontend` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Production build variable `VITE_API_URL` | `https://ecomerc-front-back.onrender.com/api` until the custom API domain is verified; then use `https://api.electronic.com/api` |

   If Google sign-in is enabled, also set `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_REDIRECT_URI` as described in step 5. Do not add server-side secrets here.
   
   The build validates that `VITE_API_URL` is an absolute HTTPS URL ending in `/api`. The current Render hostname from the project's environment configuration is `ecomerc-front-back.onrender.com`; its URL must include `/api`. The API custom domain can be used after Render verifies it and public DNS resolves it.
4. Start the deployment and wait for Pages to report success. Open its generated `*.pages.dev` address and check that the app loads.
5. In the Pages project, open **Custom domains**, add `electronic.com`, and follow the displayed instructions. Add `www.electronic.com` too if you want that hostname. Assign one hostname as canonical and configure the other to redirect to it.
6. If Pages asks for DNS records, use the exact values it displays. When the domain and Pages project are in the same Cloudflare account, Pages may create the DNS record for you. Avoid guessing an IP or copying an old hosting IP. Do not remove email records.
7. Wait until Pages shows the custom domain as active and HTTPS is ready. Test the chosen canonical URL.

The frontend is a Vite single-page application. Cloudflare Pages normally serves SPA routes using its default fallback behavior when no top-level `404.html` is present. Verify by directly opening and refreshing a route such as `/login`.

## 3. Give the Render API its own custom hostname

Use `api.electronic.com` for the backend. Do not point the root website hostname at the backend.

1. In Render, open the Spring Boot web service **Settings → Custom Domains**, add `api.electronic.com`, and save.
2. In Cloudflare **DNS → Records**, add the CNAME target using the actual Render service hostname shown in its dashboard:

   | Type | Name | Target | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `api` | `<your-service>.onrender.com` | DNS only (gray cloud) |

   Remove or replace conflicting records for the `api` name. Do not use a guessed IP address. Keep the root and `www` records assigned to the Pages frontend.
3. In Cloudflare **SSL/TLS → Overview**, select **Full** for the Render custom-domain setup.
4. Return to Render and verify `api.electronic.com`. Keep the API record DNS-only while Render verifies the hostname and issues its TLS certificate.
5. When Render reports the domain as verified and HTTPS works, test `https://api.electronic.com/api/products`. Keeping it DNS-only is a valid, simple configuration. Proxying it through Cloudflare is optional; only consider that after the direct hostname works and you have tested API requests, authentication, and uploads.

Do not add a Cloudflare cache rule that caches API responses. Product APIs may be public, but login, customer, admin, cart, payment, and other personalized endpoints must not be cached as shared content.

## 4. Set the production URLs and redeploy

Use the same canonical frontend hostname everywhere. The examples below assume the canonical site is `https://electronic.com`:

| Service | Setting | Value |
| --- | --- | --- |
| Cloudflare Pages production environment | `VITE_API_URL` | `https://api.electronic.com/api` |
| Render backend environment | `FRONTEND_URL` | `https://electronic.com` (no trailing slash) |

Save changes and redeploy Pages after changing any `VITE_*` setting; Vite includes these values in the built frontend. Save changes and redeploy the Render backend after changing `FRONTEND_URL` or OAuth configuration. Do not remove the Render service's generated `JWT_SECRET` or Supabase connection settings.

## 5. Update Google sign-in (if enabled)

Use the exact same callback URL in the frontend, backend, and Google Cloud Console:

| Location | Setting | Value |
| --- | --- | --- |
| Cloudflare Pages | `VITE_GOOGLE_REDIRECT_URI` | `https://electronic.com/oauth2/callback` |
| Render | `GOOGLE_REDIRECT_URI` | `https://electronic.com/oauth2/callback` |
| Google Cloud Console | Authorized JavaScript origin | `https://electronic.com` |
| Google Cloud Console | Authorized redirect URI | `https://electronic.com/oauth2/callback` |

Use the `www` hostname instead only if it is your canonical site, and use that hostname consistently. Redeploy Pages and Render after changing these values.

## 6. Verify the complete deployment

- Cloudflare Overview reports `electronic.com` as **Active**.
- Pages reports the deployment and custom domain as healthy, with HTTPS ready.
- `https://electronic.com` loads, and refreshing `https://electronic.com/login` still loads the app.
- `https://api.electronic.com/api/products` returns the expected API response over HTTPS.
- Register, sign in, browse products, and exercise checkout and payment integrations you enabled.
- Test file/image uploads. Render's local filesystem is ephemeral; use durable object storage before relying on uploaded files in production.
- If enabled, complete a Google sign-in and confirm the browser returns to the canonical domain.
- Check the browser developer console and network panel for failed API requests, CORS errors, or mixed-content (HTTP/HTTPS) errors.

## What Cloudflare lets you manage

- **DNS:** Control which service receives each hostname. Use separate records for the Pages site and the Render API.
- **TLS/HTTPS:** Review Cloudflare's **SSL/TLS** settings. Pages manages certificates for its custom domains; Render manages the certificate for its verified custom domain.
- **Deployments:** Pages can automatically build from the selected Git branch. Use the Pages project to inspect deployment logs and roll back to a previous deployment.
- **Traffic and security:** Use Cloudflare analytics to inspect traffic. You can later add carefully tested WAF or rate-limit rules. Start with conservative rules so checkout, sign-in, API calls, and payment callbacks continue working.
- **Caching:** Pages serves static frontend assets. Do not use broad “cache everything” rules for the API or user-specific routes.
- **Redirects:** Choose one canonical frontend hostname and redirect the other to it to avoid split URLs and OAuth mismatches.

Cloudflare nameservers alone do not move your application or database to Cloudflare. In this setup, the browser loads static files from Pages, calls the Spring API on Render, and the backend connects to Supabase.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Cloudflare says it is waiting for nameservers | The registrar must use the exact two nameservers shown in Cloudflare Overview. Wait for propagation; check that the change was saved at the registrar. |
| Pages domain is invalid | Confirm the hostname was added to the correct Pages project and follow the exact DNS instructions in Pages. Remove only conflicting web records; preserve email records. |
| API hostname does not verify | Confirm Render has `api.electronic.com` listed and Cloudflare's `api` CNAME targets the correct `onrender.com` service. Keep it DNS-only until verification completes. |
| Frontend loads but API calls fail | Check `VITE_API_URL` is `https://api.electronic.com/api`, redeploy Pages, and set Render `FRONTEND_URL` to the exact canonical frontend origin. |
| Google sign-in fails | Compare the callback URL in Pages, Render, and Google Cloud Console character-for-character, including hostname and HTTPS. |
| HTTPS or certificate error | Check the domain is verified in Pages or Render and allow time for certificate issuance. Do not switch a record to Proxied before the origin certificate is ready. |

## Official provider instructions

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Render custom domains](https://render.com/docs/custom-domains)
- [Render DNS configuration with Cloudflare](https://render.com/docs/configure-cloudflare-dns)
