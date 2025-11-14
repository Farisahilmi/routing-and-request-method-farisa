# 👥 Admin User Management API Documentation

## Deskripsi
API untuk admin mengelola akun user (CRUD operations). Semua endpoint memerlukan authentication dan role admin.

---

## 🔐 Authorization
- **Memerlukan:** Authentication (login)
- **Role:** Admin only
- **HTTP Status 403:** Jika non-admin mencoba akses

---

## 📍 Base URL
```
http://localhost:3000/api/users
```

---

## 🔌 Endpoints

### 1️⃣ **GET - Dapatkan Semua User**
```
GET /api/users
```

**Headers:**
```
Authorization: Session (automatic via express-session)
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "count": 3,
  "data": [
    {
      "id": "1",
      "username": "Admin User",
      "email": "admin@store.com",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2025-11-12T10:45:25.064Z"
    },
    {
      "id": "2",
      "username": "aden@gmail.com",
      "email": "aden@gmail.com",
      "role": "customer",
      "createdAt": "2025-11-11T08:51:23.768Z"
    }
  ]
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "message": "Admin access required"
}
```

---

### 2️⃣ **GET - Dapatkan User Spesifik**
```
GET /api/users/:id
```

**Parameters:**
- `id` (string): User ID

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User retrieved successfully",
  "data": {
    "id": "2",
    "username": "aden@gmail.com",
    "email": "aden@gmail.com",
    "role": "customer",
    "createdAt": "2025-11-11T08:51:23.768Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "User not found"
}
```

---

### 3️⃣ **PUT - Update User**
```
PUT /api/users/:id
```

**Parameters:**
- `id` (string): User ID

**Request Body:**
```json
{
  "username": "New Username",
  "email": "newemail@example.com",
  "role": "admin"
}
```

**Validations:**
- ✅ Username dan email required
- ✅ Email format harus valid
- ✅ Role harus 'admin' atau 'customer'
- ✅ Email tidak boleh duplicate

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "id": "2",
    "username": "New Username",
    "email": "newemail@example.com",
    "role": "admin",
    "updatedAt": "2025-11-12T11:32:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Invalid email format"
}
```

---

### 4️⃣ **DELETE - Hapus User**
```
DELETE /api/users/:id
```

**Parameters:**
- `id` (string): User ID

**Validations:**
- ❌ Admin tidak bisa menghapus akun sendiri

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User deleted successfully",
  "data": {
    "id": "2",
    "username": "aden@gmail.com",
    "email": "aden@gmail.com",
    "role": "customer"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Cannot delete your own account"
}
```

---

### 5️⃣ **POST - Ubah Password User**
```
POST /api/users/:id/change-password
```

**Parameters:**
- `id` (string): User ID

**Request Body:**
```json
{
  "newPassword": "NewPassword123"
}
```

**Validations:**
- ✅ Password minimal 6 karakter
- ✅ Password akan di-hash dengan bcrypt

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Password changed successfully",
  "data": {
    "id": "2",
    "username": "aden@gmail.com",
    "email": "aden@gmail.com",
    "role": "customer",
    "updatedAt": "2025-11-12T11:33:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Password must be at least 6 characters"
}
```

---

## 📝 Contoh Penggunaan dengan JavaScript

### Fetch All Users
```javascript
fetch('http://localhost:3000/api/users', {
  method: 'GET',
  credentials: 'include', // Include session cookie
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data.data))
.catch(err => console.error(err));
```

### Update User
```javascript
fetch('http://localhost:3000/api/users/2', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "Aden Pratama",
    email: "aden.p@gmail.com",
    role: "customer"
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Delete User
```javascript
fetch('http://localhost:3000/api/users/3', {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Change Password
```javascript
fetch('http://localhost:3000/api/users/2/change-password', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newPassword: "NewSecurePassword123"
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## 🛡️ Security Features

✅ **Authentication Required** - Hanya user yang login bisa akses  
✅ **Admin Only** - Hanya admin yang punya akses  
✅ **Password Hashing** - Semua password di-hash dengan bcrypt  
✅ **No Password Exposure** - Password tidak pernah di-return dalam response  
✅ **Email Validation** - Email harus format valid dan unique  
✅ **Self-Delete Prevention** - Admin tidak bisa menghapus akun sendiri  
✅ **Input Sanitization** - Semua input di-sanitasi untuk prevent XSS  
✅ **Structured Logging** - Semua activity di-log untuk audit trail  

---

## 📊 Logging

Setiap action di-log dengan informasi:
- ✅ User yang perform action (admin ID)
- ✅ Target user ID
- ✅ Timestamp
- ✅ Status (success/error)

**Contoh Log:**
```
[SUCCESS] ✅ 2025-11-12T11:31:39.204Z - User updated via API
{ "adminId": "1", "userId": "2" }
```

---

## 🔄 Status Code Reference

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 500 | Server Error |

---

**Last Updated:** November 12, 2025  
**API Version:** 1.0  
**Status:** ✅ Production Ready

