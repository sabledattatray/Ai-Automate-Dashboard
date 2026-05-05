# Security Specification - Lumina BI

## Data Invariants
1. Datasets and Dashboards always belong to a specific user (`userId`).
2. Only the owner of a user path can read or write documents within that path.
3. Document IDs must be valid alphanumeric strings.
4. Timestamps (if used) should be validated, though the current app uses `Date.now()`.

## The "Dirty Dozen" Payloads

### P1: Identity Spoofing (Dataset)
Attempt to create a dataset in another user's path.
```json
{
  "path": "/users/victim-uid/datasets/malicious-id",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "malicious-id", "name": "Stolen Data", "columns": [], "data": [] }
}
```
**Expected**: PERMISSION_DENIED

### P2: Resource Poisoning (ID)
Attempt to use an extremely long ID.
```json
{
  "path": "/users/attacker-uid/datasets/VERY_LONG_ID_OR_ID_WITH_SPECIAL_CHARS_!@#$%^&*()",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "...", "name": "Data", "columns": [], "data": [] }
}
```
**Expected**: PERMISSION_DENIED

### P3: Missing Required Fields (Dataset)
```json
{
  "path": "/users/attacker-uid/datasets/ds1",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "ds1", "name": "Incomplete" }
}
```
**Expected**: PERMISSION_DENIED

### P4: Type Mismatch (columns)
```json
{
  "path": "/users/attacker-uid/datasets/ds1",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "ds1", "name": "Bad Data", "columns": "not-an-array", "data": [] }
}
```
**Expected**: PERMISSION_DENIED

### P5: Unauthorized Read (List)
Attempt to list all datasets across all users.
```json
{
  "path": "/users/victim-uid/datasets",
  "auth": { "uid": "attacker-uid" }
}
```
**Expected**: PERMISSION_DENIED

### P6: Dashboard Hijacking
```json
{
  "path": "/users/victim-uid/dashboards/main",
  "auth": { "uid": "attacker-uid" },
  "data": { "tiles": [] }
}
```
**Expected**: PERMISSION_DENIED

### P7: Data Injection (Dashboard tiles)
```json
{
  "path": "/users/attacker-uid/dashboards/main",
  "auth": { "uid": "attacker-uid" },
  "data": { "tiles": "not-an-array" }
}
```
**Expected**: PERMISSION_DENIED

### P8: Giant Object Attack
```json
{
  "path": "/users/attacker-uid/datasets/ds1",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "ds1", "name": "A".repeat(200000), "columns": [], "data": [] }
}
```
**Expected**: PERMISSION_DENIED

### P9: Unauthorized Delete
```json
{
  "path": "/users/victim-uid/datasets/ds1",
  "auth": { "uid": "attacker-uid" },
  "method": "delete"
}
```
**Expected**: PERMISSION_DENIED

### P10: Update-Gap (Ghost Fields)
```json
{
  "path": "/users/attacker-uid/datasets/ds1",
  "auth": { "uid": "attacker-uid" },
  "data": { "id": "ds1", "name": "Name", "columns": [], "data": [], "isAdmin": true },
  "method": "update"
}
```
**Expected**: PERMISSION_DENIED (Strict keys)

### P11: Anonymous Access (if restricted)
```json
{
  "path": "/users/any-uid/datasets/ds1",
  "auth": null
}
```
**Expected**: PERMISSION_DENIED

### P12: ID Mismatch
```json
{
  "path": "/users/user-1/datasets/id-A",
  "auth": { "uid": "user-1" },
  "data": { "id": "id-B", "name": "Name", "columns": [], "data": [] }
}
```
**Expected**: PERMISSION_DENIED (Data ID must match doc ID)
