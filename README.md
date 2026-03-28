# Work3 Labs — Contributor Portal

User-facing Next.js app for the Work3 Labs platform. Talent contributors use this portal to sign up, create and manage pods, execute jobs, earn PoP badges, and build their on-chain execution identity.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Fonts | Outfit (sans), Fraunces (serif), IBM Plex Mono |
| Icons | Bootstrap Icons |
| Wallet (EVM) | RainbowKit + wagmi + viem |
| Chain | Base (default) · Solana (optional) |
| Auth | Email invite + wallet sign-in |

---

## Setup

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# get your project ID free at https://cloud.walletconnect.com
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # from cloud.walletconnect.com
NEXT_PUBLIC_API_URL=                    # backend API base URL (default: /api)
NEXT_PUBLIC_POP_CONTRACT_ADDRESS=       # ERC-1155 PoP badge contract on Base
```

---

## Route Map

| Route | Access | Description |
|---|---|---|
| `/auth/signup?token=` | Public | Invite-only signup (email or wallet) |
| `/auth/login` | Public | Email + password or wallet sign-in |
| `/auth/forgot-password` | Public | Password reset request |
| `/auth/reset-password?token=` | Public | Set new password |
| `/dashboard` | Auth | Home — stats, pods, notifications |
| `/pod/create` | Auth | Create a new Talent Pod |
| `/pod/[id]` | Auth | Pod detail — members, splits, status, PoP |
| `/pod/[id]/edit` | Auth (Pod Admin) | Edit pod name/description/roles |
| `/profile` | Auth | Edit own profile |
| `/profile/pop` | Auth | Full Performance Book (all PoP badges) |
| `/notifications` | Auth | Notification center |
| `/leaderboard` | Public | Top contributors by earnings |
| `/u/[username]` | Public | Public profile — earnings, PoP, ratings |
| `/blue-tick` | Auth | Buy Blue Tick (placeholder) |

---

## Key User Flows

### Signup
1. Admin sends whitelisted invite email with `?token=` link
2. User lands on `/auth/signup`, fills display name + password
3. Can connect Base wallet (optional at signup, required later)
4. Redirected to `/dashboard`
5. Profile must include **role tags** and **skill tags** to be matched

### Pod Creation
1. User clicks "New pod" on dashboard
2. Sets: name, description, settlement chain (Base or Solana), max members (2–5)
3. Adds roles (one per member seat)
4. Sets % split per role — **must total 100%** before pod can be matched to a job
5. Becomes Pod Admin automatically

### Pod Member Invite
1. Pod Admin generates role-specific invite link from pod detail page
2. Shares link with talent
3. Talent applies via link
4. Pod Admin accepts or rejects from the Applications panel

### Job Execution
1. Platform Admin matches a ready pod (or individual) to a project
2. Pod works on job
3. Pod Admin clicks "Request Submission"
4. Project Owner reviews and approves (or disputes)
5. On approval → system auto-releases escrow funds
6. PoP badge minted on the pod's settlement chain (~$0.02 Base gas, deducted from each member's split)
7. Each member claims their net split

### Individual Applications
- Individual jobbers can also apply to jobs directly (not via pod)
- Project Owner sets preference: pod / individual / both

### PoP Export
- Users can export their full Performance Book as a shareable on-chain verifiable CV
- Available from `/profile/pop` → "Export CV"

### Public Profile
- Anyone can visit `/u/[username]`
- Shows: display name, ticks, earnings (exact $), reputation, PoP badges, ratings, wallets, social links

---

## Smart Contract (ERC-1155 PoP Badges)

Contract: `contracts/Work3LabsPoP.sol`

Deploy to Base:
```bash
forge create Work3LabsPoP \
  --constructor-args "ipfs://YOUR_BASE_CID/" \
  --rpc-url https://mainnet.base.org \
  --private-key YOUR_BACKEND_WALLET_KEY
```

Add the deployed address to `.env.local` as `NEXT_PUBLIC_POP_CONTRACT_ADDRESS`.

The backend wallet calls `mintBadge()` after escrow release. Gas fee is pre-deducted from each member's split before payout.

---

## Database Schema

See the full Prisma-compatible schema in the project spec doc. Key tables:

- `users` — profile, earnings, reputation, ticks
- `pods` — settlement chain, roles, splits (locked at creation)
- `pod_members` — role assignment, % split
- `pod_invite_links` — role-specific invite tokens
- `pod_applications` — pending/accepted/rejected applications
- `projects` — scope, locked funds, match preference
- `jobs` — pod/individual engagement, ML outcome labels
- `pops` — on-chain PoP records per member + per pod
- `ratings` — post-job star ratings + text feedback
- `notifications` — per-user notification center
- `talent_graph_edges` — living collaboration graph for ML matching
- `leaderboard_snapshots` — cached weekly/monthly/alltime rankings

---

## Design System

| Token | Value |
|---|---|
| Font sans | Outfit |
| Font serif | Fraunces |
| Font mono | IBM Plex Mono |
| Green | `#2DFC44` (light) · `#1DC433` (dark) |
| Ink | `#0D0D0D` |
| Paper | `#FAFAF8` |
| Border radius inputs | `rounded-[10px]` |
| Focus ring | `rgba(45,252,68,0.08)` green glow |
| Entry animation | `up 0.5s cubic-bezier(0.22,1,0.36,1)` |

---

## Admin Portal

The admin portal is a **separate Next.js project** (`work3labs wppz`). It handles:
- Whitelisting talent and projects (sending invite emails)
- Matching pods to projects
- Dispute resolution
- Admin team management

Do not modify admin auth flows (`AdminSetupClient`, `AdminLoginClient`, `AdminAcceptInviteClient`, `AdminForgotPasswordClient`, `AdminResetPasswordClient`, `AdminDashboardClient`).

---

## Notes

- All wallet interaction stubs use `useWallet()` from `src/hooks/useWallet.js`
- `openModal()` triggers the RainbowKit wallet selection modal
- Solana wallet is currently a manual address input — adapter coming later
- `force-dynamic` is set on all pages that use wallet/auth context to prevent Next.js static prerendering
