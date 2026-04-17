# FileShare — Django REST API

A production-ready file sharing backend built with Django, DRF, Celery, and Redis.

## Quick Start

```bash
# 1. Clone and install
pip install -r requirements.txt

# 2. Run Redis (required for Celery)
redis-server

# 3. Apply migrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Start Django
python manage.py runserver

# 6. Start Celery worker (separate terminal)
celery -A fileshare worker --loglevel=info
```

## Or with Docker Compose

```bash
docker-compose up --build
```

---

## API Endpoints

### Auth `/api/auth/`
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login → get JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/profile/` | View/update profile |
| POST | `/api/auth/change-password/` | Change password |

### Files `/api/files/`
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/files/` | List files (supports search, filter, sort) |
| POST | `/api/files/` | Upload file |
| GET | `/api/files/{id}/` | File detail |
| DELETE | `/api/files/{id}/` | Soft delete (move to trash) |
| PATCH | `/api/files/{id}/rename/` | Rename file |
| PATCH | `/api/files/{id}/move/` | Move to folder |
| GET | `/api/files/{id}/download/` | Download file |
| POST | `/api/files/{id}/star/` | Toggle star |
| POST | `/api/files/{id}/restore/` | Restore from trash |
| DELETE | `/api/files/{id}/permanent_delete/` | Permanently delete |
| GET/POST/DELETE | `/api/files/{id}/share_with/` | Manage per-user sharing |
| POST | `/api/files/zip_download/` | Download multiple files as ZIP |
| GET | `/api/files/trash/` | List trashed files |
| GET | `/api/files/starred/` | List starred files |
| GET | `/api/files/search/?q=term` | Search by name |

### Chunk Upload
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/files/upload/chunk/init/` | Initialize chunked upload |
| POST | `/api/files/upload/chunk/{upload_id}/` | Upload a chunk |

### Folders `/api/folders/`
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/folders/` | List folders |
| POST | `/api/folders/` | Create folder |
| GET | `/api/folders/{id}/` | Folder detail |
| PATCH | `/api/folders/{id}/` | Update folder |
| DELETE | `/api/folders/{id}/` | Delete folder |
| GET | `/api/folders/tree/` | Full folder tree |
| POST | `/api/folders/{id}/move/` | Move folder |

### Sharing `/api/share/`
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/share/{token}/` | Access shared file (public link) |
| GET | `/api/share/{token}/?action=download` | Download via share link |
| POST | `/api/share/generate/{file_id}/` | Regenerate share token |

### Activity & Admin
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/activity/` | Activity log (uploads, downloads) |
| ANY | `/admin/` | Django admin panel |

---

## File Query Params

```
GET /api/files/?search=report          # search by name
GET /api/files/?folder=5               # files in folder id=5
GET /api/files/?folder=root            # root-level files
GET /api/files/?is_starred=true        # starred only
GET /api/files/?extension=pdf          # filter by extension
GET /api/files/?min_size=1000000       # >= 1MB
GET /api/files/?ordering=-size         # sort by size desc
GET /api/files/?page=2                 # pagination (20/page)
```

---

## Authentication

All endpoints (except register, login, public share) require JWT Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Celery Tasks

| Task | Trigger | Description |
|------|---------|-------------|
| `process_file_async` | After upload | Verify MIME type |
| `log_activity_async` | Upload/Download | Write ActivityLog |
| `assemble_chunks_async` | All chunks received | Assemble chunked upload |

---

## Management Commands

```bash
# Clean up trash older than 30 days
python manage.py cleanup_trash --days 30

# Preview what would be cleaned (no deletion)
python manage.py cleanup_trash --days 30 --dry-run

# Recalculate storage usage for all users
python manage.py recalculate_storage
```

---

## Key Features

- **Duplicate Detection** — SHA-256 hash comparison prevents storing the same file twice
- **Chunked Upload** — Large files uploaded in 5MB chunks with resume support
- **Trash System** — Soft delete with restore; permanent delete frees quota
- **Storage Quotas** — Per-user 5GB limit (configurable), tracked in real time
- **Share Links** — UUID tokens for public/private sharing; regeneratable
- **Per-User Sharing** — Grant access to specific users with download toggle
- **ZIP Download** — Select multiple files and download as one ZIP
- **Activity Logs** — Every upload/download tracked with timestamp
- **Nested Folders** — Unlimited depth with circular reference protection
- **Search & Filter** — Case-insensitive search, filter by extension/size/date
- **Image & PDF Preview** — Direct URL for in-browser preview
- **JWT Auth** — Access + refresh tokens with blacklist on logout

---

## Project Structure

```
fileshare/               ← Django project config
├── settings.py
├── urls.py
└── celery.py

authentication/          ← Custom User model, JWT views
files/                   ← Core file logic
│   ├── models.py        ← File, FileShare, ChunkUpload
│   ├── views.py         ← FileViewSet, Search, Trash, Chunk upload
│   ├── serializers.py
│   ├── tasks.py         ← Celery tasks
│   ├── filters.py       ← Django-filter integration
│   ├── permissions.py   ← Custom DRF permissions
│   └── management/commands/
│       ├── cleanup_trash.py
│       └── recalculate_storage.py

folders/                 ← Nested folder system
sharing/                 ← Public share link views
activity/                ← ActivityLog model + views
```
