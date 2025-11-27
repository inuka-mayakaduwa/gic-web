## Local Getting Started

### Pre Reqs
I prefer pnpm cuz its faster, but you can use npm as well. If you also want to install pnpm use below link
https://pnpm.io/installation

### Actually Start Here;
Open a CLI ( Command Prompt )
```
git clone https://github.com/inuka-mayakaduwa/gic-web.git
cd gic-web
pnpm i
pnpm dev
```
Above will Start the Localhost,
Visit http://localhost:3000 with your browser

## Always Create a branch <yourname>/<feature name> when creating a new feature.

Create a Postgres DB, Update the .env file with the correct data;

```
DATABASE_URL="postgresql://postgres:<DBPASS>@localhost:5432/<DBNAME>?schema=public"

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""


AUTH_SECRET="<RANDOM STRING>"


# Cloudflare R2 Configuration
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
R2_PUBLIC_URL=
USE_SIGNED_URLS=false
CUSTOM_CDN_URL=
SIGNED_URL_EXPIRY=3600

```

Then Run

```
pnpm exec tsx prisma/seed-fresh.ts
```