# Work3 Labs — Contributor Portal

Frontend for the Work3 Labs contributor-facing application. Built with Next.js 14, Tailwind CSS, wagmi v2, and RainbowKit. Connects to Base network for wallet authentication and PoP NFT badge minting.

This README is written for backend developers integrating with this frontend. It documents every API endpoint the frontend calls, all request/response shapes, authentication flow, session mechanics, and integration notes.

---

## Stack

- **Framework** — Next.js 14 (App Router)
- **Styling** — Tailwind CSS
- **Wallet** — wagmi v2 + RainbowKit, locked to Base network
- **Auth** — JWT via Bearer token (email/password) or wallet signature verification
- **Chain** — Base mainnet (`chainId: 8453`)

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # from cloud.walletconnect.com
NEXT_PUBLIC_API_URL=                    # your backend base URL, e.g. https://api.work3labs.com
NEXT_PUBLIC_POP_CONTRACT_ADDRESS=       # ERC-1155 contract address after deployment to Base
```

If `NEXT_PUBLIC_API_URL` is not set, all requests default to `/api` (same-origin proxy via Next.js rewrites — useful for local dev).

---

## Authentication

### Session mechanics

The frontend stores the JWT in two places simultaneously:

- `sessionStorage` under key `w3l_user_token` — read by the API service on every request
- An HTTP cookie `w3l_user_auth` with `SameSite=Lax; Max-Age=28800` (8 hours) — read by Next.js middleware for route protection

Both must be set on login. The middleware checks only the cookie to decide whether to allow access to protected routes. The API service reads only sessionStorage to attach the Bearer token to requests.

### Route protection

The Next.js middleware at `src/middleware.js` enforces:

- `/dashboard/*`, `/pod/*`, `/profile/*` — redirect to `/auth/login?from=<path>` if no cookie
- `/auth/*` (except `/auth/signup`) — redirect to `/dashboard` if cookie exists

### Token expected shape

Every protected API response must include a `token` field at the top level:

```json
{
  "token": "<jwt>",
  "user": { ... }
}
```

The frontend stores `data.token` from the login/register response. All subsequent requests send `Authorization: Bearer <token>`.

---

## API Endpoints

All endpoints are prefixed with the value of `NEXT_PUBLIC_API_URL` (default `/api`).

All protected endpoints require `Authorization: Bearer <token>` in the request header.

All error responses should follow:

```json
{ "message": "Human-readable error description" }
```

The frontend reads `err.message` to display to the user.

---

### Auth

#### `GET /user/accept-invite?token=<invite_token>`

Validates an invite token before showing the signup form. Called on mount at `/auth/signup?token=`.

**Response `200`**
```json
{
  "email": "invitee@example.com",
  "valid": true
}
```

**Response `400` / `404`** — token invalid or expired. The frontend shows a locked error screen.

---

#### `POST /user/accept-invite`

Registers a new user from an invite link.

**Request**
```json
{
  "token": "<invite_token>",
  "displayName": "Alex Rivera",
  "password": "securepassword",
  "walletAddress": "0x..."    // optional — user may add this later
}
```

**Response `200`**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "usr_abc123",
    "displayName": "Alex Rivera",
    "email": "invitee@example.com",
    "walletAddress": "0x..." // or null
  }
}
```

---

#### `POST /user/login`

Email and password login.

**Request**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "usr_abc123",
    "displayName": "Alex Rivera",
    "email": "user@example.com"
  }
}
```

**Error handling** — the frontend maps these HTTP status codes to user-facing messages:
- `401` or body containing `invalid` / `credential` → "Invalid email or password."
- `429` → "Too many attempts. Please wait a moment."
- Network failure → "Unable to connect. Check your internet connection."

---

#### `POST /user/login/wallet`

Wallet-based login. The frontend connects via RainbowKit, then asks the user to sign a plaintext message, then sends the signature here for verification.

**Request**
```json
{
  "walletAddress": "0x4a2f...8b91",
  "signature": "0xabc...",
  "message": "Work3 Labs — Contributor Portal\n\nSign this message to verify wallet ownership.\nNo transaction will be sent.\n\nAddress: 0x4a2f...8b91\nTimestamp: 1710000000000"
}
```

The backend should recover the signing address from `signature` + `message` using `ecrecover` (or an equivalent library like `viem`'s `recoverMessageAddress`) and confirm it matches `walletAddress`. The timestamp in the message can be used to enforce expiry (e.g. reject signatures older than 5 minutes).

**Response `200`** — same shape as email login.

**Error `404`** — no account found for this wallet address. The frontend shows "No account found for this wallet."

---

#### `POST /user/forgot-password`

Triggers a password reset email. The frontend intentionally shows the same success screen regardless of whether the email exists (anti-enumeration).

**Request**
```json
{ "email": "user@example.com" }
```

**Response `200`** — any body. The frontend ignores it and shows a generic success screen.

Only network errors (`fetch failed`) are surfaced to the user. `404`, `400` etc are silently swallowed.

---

#### `POST /user/reset-password`

Sets a new password using a reset token from the email link.

**Request**
```json
{
  "token": "<reset_token>",
  "password": "newpassword"
}
```

**Response `200`** — any body. Frontend redirects to `/auth/login` after 2.5 seconds.

**Error `400`** — frontend shows "This reset link has expired or is invalid" with a link to request a new one.

---

#### `POST /user/logout`

Invalidates the session server-side. The frontend also clears `sessionStorage` and the cookie locally regardless of the response.

**Request** — no body. Bearer token in header.

**Response `200`** — any body.

---

### Profile

#### `GET /user/profile`

Fetches the authenticated user's profile. Called on dashboard mount and profile page mount.

**Response `200`**
```json
{
  "id": "usr_abc123",
  "displayName": "Alex Rivera",
  "email": "alex@example.com",
  "walletAddress": "0x...",
  "avatarUrl": "https://cdn.example.com/avatars/alex.jpg",
  "bio": "Community builder and growth strategist.",
  "skills": ["Community", "Growth", "Content"],
  "socials": {
    "twitter": "alexrivera",
    "github": "alexr",
    "telegram": "alexrivera"
  },
  "inviteBased": true
}
```

`inviteBased: true` tells the frontend to lock the email field as non-editable on the profile page (the email was confirmed via invite).

---

#### `PATCH /user/profile`

Updates the user's profile. All fields are optional — only send what changed.

**Request**
```json
{
  "displayName": "Alex Rivera",
  "email": "alex@example.com",
  "walletAddress": "0x...",
  "bio": "Community builder.",
  "skills": ["Community", "Growth"],
  "avatarUrl": "https://cdn.example.com/avatars/alex.jpg",
  "socials": {
    "twitter": "alexrivera",
    "github": "alexr",
    "telegram": "alexrivera"
  }
}
```

**Response `200`** — any body. Frontend shows a "Saved" confirmation.

---

#### `POST /user/avatar`

Receives a profile picture upload. Called when the user clicks their avatar circle and picks a file.

**Request** — `multipart/form-data` with field `avatar` containing the image file. Bearer token in header.

**Response `200`**
```json
{ "url": "https://cdn.example.com/avatars/alex.jpg" }
```

The returned URL is immediately saved to the profile via `PATCH /user/profile`.

File size limit: 5MB (enforced on the frontend before upload, but also enforce server-side).

---

### Pods

#### `GET /user/pods`

Returns all pods the authenticated user is a member of.

**Response `200`**
```json
{
  "pods": [
    {
      "id": "pod_xyz789",
      "name": "Growth Alpha Pod",
      "description": "Executes community growth for Web3 protocols.",
      "status": "active",
      "myRole": "admin",
      "roles": ["Community Lead", "Content Strategist", "Growth Analyst"],
      "memberCount": 4,
      "reputationScore": 87.4,
      "popCount": 3,
      "popRecords": [],
      "projectAssigned": true
    }
  ]
}
```

**`status` values** the frontend understands:

| Value | Meaning |
|---|---|
| `forming` | Pod created, no project yet |
| `active` | Project assigned, work in progress |
| `submitted` | Pod admin has notified project work is done |
| `reviewing` | Project is reviewing delivery |
| `approved` | Project satisfied, notified admin |
| `claimable` | Admin released escrow, splits claimable |
| `completed` | All members have claimed their split |

**`myRole`** — either `"admin"` (the user created this pod) or any other string (member).

**`projectAssigned`** — `true` once a project is assigned. When `true`, the pod admin cannot remove members and roles are locked.

---

#### `POST /user/pods`

Creates a new pod. The authenticated user becomes the pod admin.

**Request**
```json
{
  "name": "Growth Alpha Pod",
  "description": "Executes community growth for Web3 protocols.",
  "roles": ["Community Lead", "Content Strategist", "Growth Analyst"]
}
```

**Response `200`**
```json
{ "id": "pod_xyz789" }
```

The frontend immediately redirects to `/pod/<id>` using this ID.

---

#### `GET /user/pods/:podId`

Returns full pod detail for the pod page.

**Response `200`**
```json
{
  "id": "pod_xyz789",
  "name": "Growth Alpha Pod",
  "description": "Executes community growth for Web3 protocols.",
  "status": "active",
  "myRole": "admin",
  "roles": ["Community Lead", "Content Strategist"],
  "projectAssigned": false,
  "reputationScore": 87.4,
  "members": [
    {
      "id": "usr_abc123",
      "displayName": "Alex Rivera",
      "role": "Community Lead",
      "isAdmin": true,
      "reputationScore": 91.2,
      "popCount": 3,
      "splitPercentage": 40
    },
    {
      "id": "usr_def456",
      "displayName": "Sam Chen",
      "role": "Content Strategist",
      "isAdmin": false,
      "reputationScore": 83.5,
      "popCount": 1,
      "splitPercentage": 60
    }
  ],
  "popRecords": [
    {
      "workType": "Community Growth",
      "milestones": "5/5",
      "delivery": "On Schedule",
      "score": 94.8,
      "chainAnchor": "Base",
      "tokenId": 12,
      "contractAddress": "0xContract...",
      "metadataUri": "ipfs://...",
      "issuedAt": 1710000000,
      "attributes": [
        { "trait_type": "Work Type", "value": "Community Growth" },
        { "trait_type": "Pod", "value": "Growth Alpha Pod" },
        { "trait_type": "Milestones", "value": "5/5" },
        { "trait_type": "Delivery", "value": "On Schedule" },
        { "trait_type": "Score", "value": 94.8 }
      ]
    }
  ]
}
```

`splitPercentage` on each member is the last agreed-upon split. The frontend displays this in the split negotiation section.

---

#### `PATCH /user/pods/:podId`

Updates pod name, description, and roles. Only callable by the pod admin. If `projectAssigned` is `true`, the frontend still sends this request but only with name and description (roles are locked in the UI).

**Request**
```json
{
  "name": "Growth Alpha Pod",
  "description": "Updated description.",
  "roles": ["Community Lead", "Content Strategist", "Growth Analyst"]
}
```

**Response `200`** — any body.

---

#### `DELETE /user/pods/:podId/members/:memberId`

Removes a member from a pod. Only callable by the pod admin, and only when `projectAssigned` is `false`. The frontend enforces this in the UI but the backend should also enforce it.

**Response `200`** — any body. The frontend removes the member from the list immediately on success.

---

#### `POST /user/pods/:podId/split`

Proposes a fund split to all pod members. Can be called multiple times — each call replaces the previous proposal.

**Request**
```json
{
  "splits": [
    { "memberId": "usr_abc123", "percentage": 40 },
    { "memberId": "usr_def456", "percentage": 60 }
  ]
}
```

All percentages must sum to 100. The backend should validate this.

**Response `200`** — any body. The frontend shows a "Split proposed to all members" confirmation.

---

#### `GET /user/pods/:podId/split-chat`

Fetches the split negotiation chat history for a pod.

**Response `200`**
```json
{
  "messages": [
    {
      "senderName": "Alex Rivera",
      "senderId": "usr_abc123",
      "text": "I think 40/60 is fair given the workload.",
      "sentAt": "2025-03-15T10:23:00Z"
    }
  ]
}
```

---

#### `POST /user/pods/:podId/split-chat`

Sends a message to the split negotiation chat.

**Request**
```json
{ "text": "Sounds good to me." }
```

**Response `200`** — any body. The frontend appends the message optimistically.

---

#### `POST /user/pods/:podId/notify-complete`

Pod admin notifies the project that work is done. Changes pod status from `active` to `submitted`.

**Request** — no body. Bearer token identifies the user; backend validates they are the pod admin.

**Response `200`** — any body. The frontend updates the status to `submitted` immediately.

**Error `403`** — user is not the pod admin.

---

#### `POST /user/pods/:podId/claim`

Contributor claims their fund split. Called after status is `claimable`. The backend should trigger the on-chain split payment to the contributor's connected wallet address (stored on their profile).

**Request** — no body. Bearer token identifies the user.

**Response `200`** — any body. The frontend shows a "Split claimed" success screen and transitions status to `completed` if all members have claimed.

**Error `400`** — contributor has no wallet address on file. The frontend will already block this in the UI, but the backend should also reject it.

---

## Pod Status Flow

This is the full lifecycle the backend must drive. The frontend reads `status` and renders the correct UI — it never sets status directly except optimistically on `notify-complete`.

```
forming → active → submitted → reviewing → approved → claimable → completed
```

- `forming` → `active` — set by the backend/admin when a project is assigned to the pod
- `active` → `submitted` — triggered by `POST /user/pods/:podId/notify-complete`
- `submitted` → `reviewing` — set by backend when project acknowledges the notification
- `reviewing` → `approved` — set by backend when project confirms satisfaction and notifies admin
- `approved` → `claimable` — set by backend/admin after releasing escrow
- `claimable` → `completed` — set by backend after all members have claimed

---

## PoP Badge Minting

PoP badges are ERC-1155 NFTs deployed on Base. The smart contract is in a separate repository. The frontend displays badge data read from the pod's `popRecords` array — it does not call the contract directly.

The backend is responsible for:
1. Uploading badge metadata JSON to IPFS (Pinata or equivalent) after work is verified
2. Calling `mintBadge(contributorAddress, badgeType, podId, score)` on the contract for each pod member
3. Saving the resulting `tokenId`, `contractAddress`, and `metadataUri` back to the pod record so it appears in `popRecords`

Badge type IDs (match the contract constants):

| ID | Category |
|---|---|
| 1 | Community Growth |
| 2 | Technical / DevOps |
| 3 | Design / Creative |
| 4 | Strategy / GTM |
| 5 | Marketing |
| 6 | Research |

---

## Frontend Route Map

| Route | Description | Protected |
|---|---|---|
| `/` | Redirects to `/dashboard` or `/auth/login` | No |
| `/auth/login` | Email + wallet login | No |
| `/auth/signup?token=` | Invite-based registration | No |
| `/auth/forgot-password` | Request password reset email | No |
| `/auth/reset-password?token=` | Set new password | No |
| `/dashboard` | User home, pod list, stat cards | Yes |
| `/pod/create` | Create a new pod | Yes |
| `/pod/:id` | Pod detail — members, split, delivery, PoP | Yes |
| `/pod/:id/edit` | Edit pod name/description/roles | Yes |
| `/profile` | Update display name, bio, skills, wallet, socials | Yes |
| `/profile/pop` | Full PoP badge history across all pods | Yes |

---

## Wallet Integration Notes

- Chain is locked to **Base mainnet** (`chainId: 8453`). If the user's wallet is on a different network, the frontend prompts them to switch before proceeding.
- Wallet login uses `personal_sign` (EIP-191). The message includes a timestamp — the backend should reject signatures where the timestamp is more than 5 minutes old to prevent replay attacks.
- Wallet address is stored on the user profile and used as the recipient address when claiming splits and minting PoP badges.
- A user can have both an email/password login and a connected wallet. They are not mutually exclusive.

