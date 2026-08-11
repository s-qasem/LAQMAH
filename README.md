This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase

Copy `.env.example` to `.env.local` and add the project URL and anon key. The local
development environment is already configured on this machine.

- Use `createServerSupabaseClient` from `src/lib/supabase/server.ts` in Server
  Components, Server Actions, and Route Handlers.
- Use `createBrowserSupabaseClient` from `src/lib/supabase/client.ts` in Client
  Components.

The anon key is safe to expose to the browser only when every table has appropriate
Row Level Security policies. Never place a Supabase service-role key in a
`NEXT_PUBLIC_` variable.

### Homepage hero content

Run `supabase/migrations/20260811000000_create_homepage_hero.sql` in the Supabase
SQL Editor. Then edit the single `homepage_hero` row in the Table Editor. Changes
are refreshed on the website within about 60 seconds.

Hero images can be uploaded to the public `website-content` Storage bucket. Paste
their public URLs into `desktop_image_url` and `mobile_image_url`. Anonymous website
visitors can read published hero content and images, but cannot modify them.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
