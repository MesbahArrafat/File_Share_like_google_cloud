# FileShare — React Frontend

Modern dark-theme file manager UI built with React + Vite, connected to the FileShare Django API.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev

# Production build
npm run build
```

Open http://localhost:3000

---

## Features

| Feature | Description |
|---------|-------------|
| **Auth** | Register / Login / Logout with JWT auto-refresh |
| **File Browser** | Grid + list view, folder navigation with breadcrumbs |
| **Drag & Drop Upload** | Drop files anywhere on the dashboard |
| **Upload Progress** | Fixed bottom panel showing per-file progress % |
| **Chunk Upload** | Files > 10MB are split into 5MB chunks automatically |
| **Image Preview** | Click any image to preview in modal |
| **PDF Preview** | Inline PDF viewer in modal |
| **Share Modal** | Copy link + share with specific users by email |
| **Star / Unstar** | Quick star toggle on every file card |
| **Trash** | Soft delete → restore or permanently delete |
| **ZIP Download** | Multi-select files → download as ZIP |
| **Search** | Real-time search with 300ms debounce |
| **Activity Log** | Timeline of uploads, downloads, deletes grouped by date |
| **Public Share Page** | `/share/:token` — no login required for public files |
| **Storage Bar** | Visual quota usage in sidebar |

---

## Project Structure

```
src/
├── api/
│   ├── client.js          ← Axios instance + JWT interceptors + auto-refresh
│   ├── auth.js            ← Auth API calls
│   ├── files.js           ← File CRUD, upload, download, share
│   └── folders.js         ← Folder CRUD
│
├── context/
│   ├── AuthContext.jsx    ← User state, login/register/logout
│   └── FileContext.jsx    ← Files/folders state, selection, view mode
│
├── hooks/
│   └── useUpload.js       ← Upload logic (regular + chunked) with progress
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx  ← Sidebar + main wrapper
│   │   ├── Sidebar.jsx    ← Nav links + storage bar + user info
│   │   └── TopBar.jsx     ← Title, search, view toggle, upload button
│   ├── files/
│   │   ├── FileCard.jsx   ← File tile (grid/list), star, context menu
│   │   ├── PreviewModal.jsx ← Image/PDF preview overlay
│   │   ├── ShareModal.jsx ← Share link + per-user sharing
│   │   ├── UploadZone.jsx ← Drag & drop wrapper
│   │   └── UploadProgress.jsx ← Fixed upload progress panel
│   ├── folders/
│   │   └── FolderCard.jsx ← Folder tile (grid/list)
│   └── shared/
│       ├── Button.jsx     ← Reusable button (primary/secondary/ghost/danger)
│       └── Modal.jsx      ← Reusable modal wrapper
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx  ← Main file browser
│   ├── StarredPage.jsx
│   ├── TrashPage.jsx
│   ├── ActivityPage.jsx
│   └── SharedFilePage.jsx ← Public share link page
│
├── utils/
│   └── format.js          ← formatSize, formatDate, getFileIcon, getFileColor
│
├── styles/
│   └── globals.css        ← CSS variables, resets, animations
│
├── App.jsx                ← Router + Toaster
└── main.jsx               ← Entry point
```

---

## Environment Variables

```env
# .env
VITE_API_URL=http://localhost:8000/api
```

---

## Design System

CSS variables defined in `globals.css`:

```css
--bg-base        #0a0b0e   (page background)
--bg-surface     #111318   (cards)
--bg-elevated    #181c24   (inputs, hover)
--accent         #4f8eff   (primary blue)
--success        #34d399
--warning        #fbbf24
--danger         #f87171
--star           #f59e0b
--font-display   Syne (headings)
--font-body      DM Sans (body)
```

---

## API Integration Notes

- All requests go through `src/api/client.js`
- JWT access token stored in `localStorage` as `access_token`
- Refresh token stored as `refresh_token`  
- On 401, the client automatically refreshes the token before retrying
- On refresh failure, clears storage and redirects to `/login`
- Dev proxy in `vite.config.js` forwards `/api` → `localhost:8000`

---

## Chunk Upload Flow

Files larger than 10MB are automatically chunked:

1. `POST /api/files/upload/chunk/init/` → get `upload_id`
2. Loop: `POST /api/files/upload/chunk/{upload_id}/` for each 5MB slice
3. Backend assembles via Celery task when all chunks arrive
4. Progress tracked per-chunk in `useUpload` hook
