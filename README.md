This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Comments

BlockNote comments are integrated with Convex.

- Schema additions in `convex/schema.ts`: `comments`, `commentThreads`.
- Backend functions in `convex/comments.ts` for listing, creating, replying, updating, deleting, and resolving.
- Editor integration in `app/editor.tsx` via `useBlockNoteSync` `editorOptions.comments` with a Convex-backed threadStore and `resolveUsers`.
- Sidebar UI in `src/components/comments/comments-sidebar.tsx` lists threads, replies, and actions.

## Convex Auth (Password) Setup

This project uses `@convex-dev/auth` with the Password provider. You need a signing key (Next.js) and a JWKS (Convex) to enable sign up / sign in.

- Generate and configure keys for the dev deployment:

  - Ensure `.env.dev` points to your Convex dev deployment and URL (already checked into this repo).
  - Then run:

    - `npm run auth:setup:dev`

    This will:
    - Generate a new RSA keypair
    - Set `JWKS` in your Convex dev deployment (for verification)
    - Set `JWT_PRIVATE_KEY` in `.env.local` (for signing in Next.js)
    - Point `NEXT_PUBLIC_CONVEX_URL` to your dev deployment

  If you see an access error, run `npx convex dev` to login/select your project, then re-run the script.

- To develop against a local Convex instead, run:

  - `npm run auth:setup:local`

This keeps the existing sign-in/up pages under `/signin` and `/signup` working.
