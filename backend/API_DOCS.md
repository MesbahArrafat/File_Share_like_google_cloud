# FileShare — Full API Documentation

Base URL: `http://localhost:8000/api`  
Auth: `Authorization: Bearer <access_token>`

---

## Authentication

### Register
```
POST /auth/register/
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "SecurePass123",
  "password2": "SecurePass123"
}

→ 201
{
  "user": { "id": 1, "username": "john", "email": "...", "storage_used": 0, "storage_limit": 5368709120 },
  "tokens": { "access": "eyJ...", "refresh": "eyJ..." }
}
```

### Login
```
POST /auth/login/
{ "email": "john@example.com", "password": "SecurePass123" }

→ 200 { "access": "eyJ...", "refresh": "eyJ..." }
```

### Refresh Token
```
POST /auth/token/refresh/
{ "refresh": "eyJ..." }
→ 200 { "access": "eyJ..." }
```

### Logout
```
POST /auth/logout/
{ "refresh": "eyJ..." }
→ 200 { "message": "Logged out successfully." }
```

### Get / Update Profile
```
GET  /auth/profile/
PATCH /auth/profile/
{ "username": "newname" }
```

### Change Password
```
POST /auth/change-password/
{ "old_password": "...", "new_password": "...", "new_password2": "..." }
```

---

## Files

### List Files
```
GET /files/
GET /files/?folder=root          # root-level files
GET /files/?folder=5             # in folder id=5
GET /files/?search=report        # search by name
GET /files/?is_starred=true
GET /files/?extension=pdf
GET /files/?min_size=1000000     # >= 1MB
GET /files/?max_size=50000000    # <= 50MB
GET /files/?ordering=-size       # sort by size desc
GET /files/?ordering=filename    # sort by name asc
GET /files/?page=2               # pagination (20/page)

→ 200 { "count": 42, "next": "...", "previous": null, "results": [ ... ] }
```

### Upload File
```
POST /files/
Content-Type: multipart/form-data

file: <binary>
folder: 5          (optional)
is_public: false   (optional)

→ 201 { "id": "uuid", "filename": "...", "size": 12345, "hash": "sha256...", ... }
→ 200 { "message": "Duplicate file detected.", "file": { ... } }   # if duplicate
→ 400 { "error": "File size exceeds limit of 500MB." }
→ 400 { "error": "Storage quota exceeded." }
```

### File Detail
```
GET /files/{id}/
→ 200 { "id": "uuid", "filename": "...", "size": ..., "is_image": true, "preview_url": "/media/...", "share_link": "http://...", "download_url": "http://...", ... }
```

### Download File
```
GET /files/{id}/download/
→ binary file stream (Content-Disposition: attachment)
```

### Rename
```
PATCH /files/{id}/rename/
{ "filename": "new-name.pdf" }
→ 200 { updated file object }
```

### Move to Folder
```
PATCH /files/{id}/move/
{ "folder": 5 }       # move to folder id=5
{ "folder": null }    # move to root
→ 200 { updated file object }
```

### Soft Delete (Trash)
```
DELETE /files/{id}/
→ 200 { "message": "File moved to trash." }
```

### Restore from Trash
```
POST /files/{id}/restore/
→ 200 { restored file object }
```

### Permanently Delete
```
DELETE /files/{id}/permanent_delete/
→ 204 No Content
```

### Toggle Star
```
POST /files/{id}/star/
→ 200 { "is_starred": true }
```

### Trash List
```
GET /files/trash/
→ 200 { "count": 3, "results": [ ... ] }
```

### Starred List
```
GET /files/starred/
→ 200 { "count": 7, "results": [ ... ] }
```

### Search
```
GET /files/search/?q=invoice
GET /files/search/?q=report&folder=5
→ 200 { "count": 2, "results": [ ... ] }
```

### ZIP Download
```
POST /files/zip_download/
{ "file_ids": ["uuid1", "uuid2", "uuid3"] }
→ 200 binary .zip stream
```

### Manage Per-User Shares
```
GET    /files/{id}/share_with/                         # list shares
POST   /files/{id}/share_with/
       { "email": "alice@example.com", "can_download": true }
DELETE /files/{id}/share_with/
       { "email": "alice@example.com" }
```

---

## Chunked Upload (Large Files)

### Step 1 — Initialize
```
POST /files/upload/chunk/init/
{
  "filename": "bigfile.mp4",
  "total_size": 104857600,
  "total_chunks": 20,
  "folder": null
}
→ 201 { "upload_id": "uuid" }
```

### Step 2 — Upload Each Chunk
```
POST /files/upload/chunk/{upload_id}/
Content-Type: multipart/form-data
chunk_number: 0        (0-indexed)
chunk: <binary>        (up to 5MB)

→ 200 { "status": "chunk_received", "uploaded": 1, "total": 20 }
→ 200 { "status": "assembling", "upload_id": "..." }  # last chunk
```

---

## Folders

### List Folders
```
GET /folders/
GET /folders/?parent=root    # root-level folders
GET /folders/?parent=5       # children of folder 5
```

### Create Folder
```
POST /folders/
{ "name": "Projects", "parent": null }
{ "name": "2024", "parent": 5 }
→ 201 { "id": 6, "name": "2024", "parent": 5, "breadcrumbs": [...], ... }
```

### Update Folder
```
PATCH /folders/{id}/
{ "name": "New Name" }
```

### Delete Folder
```
DELETE /folders/{id}/
→ 204
```

### Folder Tree
```
GET /folders/tree/
→ [ { "id": 1, "name": "Documents", "children": [ { "id": 2, "name": "Reports", "children": [] } ] } ]
```

### Move Folder
```
POST /folders/{id}/move/
{ "parent": 3 }      # move into folder 3
{ "parent": null }   # move to root
```

---

## Sharing (Public Links)

### Access Shared File (no auth for public)
```
GET /share/{token}/
→ 200 { file object }
→ 401 Authentication required (private file, not logged in)
→ 403 Access denied
→ 404 File not found

GET /share/{token}/?action=download
→ binary file stream
```

### Regenerate Share Token
```
POST /share/generate/{file_id}/
→ 200 { "share_link": "http://...", "share_token": "uuid" }
```

---

## Activity Log

```
GET /activity/
GET /activity/?page=2

→ 200 {
  "count": 150,
  "results": [
    { "id": 1, "user_email": "...", "file_name": "report.pdf", "action": "upload", "timestamp": "2026-04-17T..." },
    ...
  ]
}
```

Actions: `upload` | `download` | `delete` | `restore` | `share` | `rename` | `move` | `star`

---

## cURL Examples

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"Pass123!","password2":"Pass123!"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass123!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")

# Upload file
curl -X POST http://localhost:8000/api/files/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/report.pdf" \
  -F "is_public=false"

# List files
curl http://localhost:8000/api/files/ \
  -H "Authorization: Bearer $TOKEN"

# Search
curl "http://localhost:8000/api/files/search/?q=report" \
  -H "Authorization: Bearer $TOKEN"

# Star a file
curl -X POST http://localhost:8000/api/files/{id}/star/ \
  -H "Authorization: Bearer $TOKEN"

# Download file
curl http://localhost:8000/api/files/{id}/download/ \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.pdf

# ZIP download
curl -X POST http://localhost:8000/api/files/zip_download/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_ids":["uuid1","uuid2"]}' \
  -o files.zip

# Create folder
curl -X POST http://localhost:8000/api/folders/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Projects","parent":null}'

# Share file via link
curl -X POST http://localhost:8000/api/share/generate/{file_id}/ \
  -H "Authorization: Bearer $TOKEN"

# Share with specific user
curl -X POST http://localhost:8000/api/files/{id}/share_with/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","can_download":true}'

# Move to trash
curl -X DELETE http://localhost:8000/api/files/{id}/ \
  -H "Authorization: Bearer $TOKEN"

# Restore from trash
curl -X POST http://localhost:8000/api/files/{id}/restore/ \
  -H "Authorization: Bearer $TOKEN"

# Activity log
curl http://localhost:8000/api/activity/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Response Format

All errors follow this format:
```json
{ "error": "Human-readable message" }
{ "field_name": ["Validation error message"] }
{ "detail": "Authentication credentials were not provided." }
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content (deleted) |
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Forbidden (not owner) |
| 404 | Not found |
| 500 | Server error |
