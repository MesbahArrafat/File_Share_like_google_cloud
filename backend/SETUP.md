# FileShare — Complete Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- Redis (for Celery)

---

## 1. Backend Setup

```bash
cd fileshare-backend      # or wherever you extracted the backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create superuser (optional, for /admin)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver
```

Backend will be available at: http://localhost:8000  
Admin panel: http://localhost:8000/admin

---

## 2. Start Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo service redis-server start

# Windows (WSL or Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping   # should print PONG
```

---

## 3. Start Celery Worker

```bash
# In a new terminal (with venv activated, in backend directory)
celery -A fileshare worker --loglevel=info

# Optional: Celery Beat for periodic tasks (e.g. auto-cleanup trash)
celery -A fileshare beat --loglevel=info
```

---

## 4. Frontend Setup

```bash
cd fileshare-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be available at: http://localhost:3000  
API proxy: All `/api` requests are forwarded to `localhost:8000`

---

## 5. Docker Compose (All-in-One)

```bash
# From backend directory (has docker-compose.yml)
docker-compose up --build

# Services started:
#   web          → http://localhost:8000
#   celery_worker
#   celery_beat
#   redis        → localhost:6379
```

Then start the frontend separately with `npm run dev`.

---

## 6. Production Checklist

Before deploying to production, update `fileshare/settings.py`:

```python
DEBUG = False
SECRET_KEY = 'generate-a-real-secret-key-50+-chars'
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Use PostgreSQL instead of SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fileshare_db',
        'USER': 'dbuser',
        'PASSWORD': 'dbpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Use environment variables
import os
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# CORS for your frontend domain
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

For the frontend, update `.env`:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Management Commands

```bash
# Clean up trash files older than 30 days
python manage.py cleanup_trash --days 30

# Preview without deleting
python manage.py cleanup_trash --days 30 --dry-run

# Fix storage usage counts
python manage.py recalculate_storage
```

---

## Project Structure Overview

```
fileshare-backend/      ← Django REST API
├── fileshare/          ← Project config, celery, urls
├── authentication/     ← Custom User model, JWT auth views
├── files/              ← File model, upload, download, search, trash, share
├── folders/            ← Nested folder system
├── sharing/            ← Public share link views
├── activity/           ← Activity log tracking
├── requirements.txt
├── Dockerfile
└── docker-compose.yml

fileshare-frontend/     ← React + Vite UI
├── src/
│   ├── api/            ← Axios API clients (auth, files, folders)
│   ├── context/        ← AuthContext, FileContext
│   ├── hooks/          ← useUpload (regular + chunked)
│   ├── components/     ← UI components (layout, files, folders, shared)
│   ├── pages/          ← Dashboard, Login, Register, Trash, Starred, Activity
│   ├── utils/          ← formatSize, formatDate, getFileIcon
│   └── styles/         ← Global CSS variables + design tokens
├── vite.config.js      ← Dev proxy for /api → localhost:8000
└── package.json
```
