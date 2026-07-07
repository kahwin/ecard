# Ucapan API Contract (for Laravel)

This frontend now supports owner-only edit/delete by browser session.
Ownership is determined by `client_session_id` sent from browser and validated by API.
For backward compatibility, frontend also sends `client_token` with the same value.

## Required response fields
- Each wish item should include:
  - `id` (integer/string unique)
  - `name` (string)
  - `message` (string)

## Endpoints

### GET /api/ucapan
Returns all wishes.

Example response:
```json
{
  "wishes": [
    { "id": 10, "name": "Ali", "message": "Tahniah" }
  ]
}
```

### POST /api/ucapan
Creates new wish.

Request body:
```json
{
  "name": "Ali",
  "message": "Tahniah",
  "client_session_id": "s_xxx",
  "client_token": "s_xxx"
}
```

Example response:
```json
{
  "wish": { "id": 11, "name": "Ali", "message": "Tahniah" },
  "wishes": [
    { "id": 11, "name": "Ali", "message": "Tahniah" }
  ]
}
```

### PUT /api/ucapan/{id}
Updates wish text. Must allow only owner token.

Request body:
```json
{
  "name": "Ali",
  "message": "Ucapan baru",
  "client_session_id": "s_xxx",
  "client_token": "s_xxx"
}
```

Success response:
```json
{
  "wishes": [
    { "id": 11, "name": "Ali", "message": "Ucapan baru" }
  ]
}
```

### DELETE /api/ucapan/{id}
Deletes wish. Must allow only owner token.

Request body:
```json
{
  "client_session_id": "s_xxx",
  "client_token": "s_xxx"
}
```

Success response:
```json
{
  "wishes": []
}
```

## Table suggestion
`ucapans`
- `id`
- `name` varchar(60)
- `message` text
- `client_session_id` varchar(120) index
- (optional legacy) `client_token` varchar(120) index
- timestamps

## Authorization rule
For PUT/DELETE:
- fetch record by `id`
- compare `record.client_session_id === request.client_session_id`
- if not equal, return `403`
