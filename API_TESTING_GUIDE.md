# 🚀 Admin API Testing Guide - With Pretty-Print Display

## ✨ New Feature: API Response Pretty-Print

Sekarang di admin users page sudah ada **live API testing** dengan pretty-print response yang jelas dan mudah dibaca!

---

## 📍 Cara Mengakses

1. **Login** ke admin panel
   - Email: `admin@store.com`
   - Password: `admin1234`

2. **Buka** `/admin/users` page

3. **Scroll ke bawah** sampai ke section **"API Testing & Documentation"**

---

## 🎯 Fitur Pretty-Print

### Setiap Response Menampilkan:

✅ **Status Badge** - Indikator Success/Error dengan icon
```
✓ SUCCESS  (hijau)
✗ ERROR    (merah)
⏳ LOADING  (kuning)
```

✅ **Syntax Highlighting** - Warna-warna berbeda untuk:
- **Keys** (biru) - Nama property
- **Strings** (orange) - Nilai text
- **Numbers** (hijau) - Nilai angka
- **Booleans** (biru) - true/false
- **Null** (biru) - null values

✅ **Formatted JSON** - Indentation otomatis untuk readability

✅ **Scrollable Output** - Max height 500px, bisa di-scroll

---

## 🧪 Contoh Testing

### 1. **GET All Users**
```
Tab: GET - All Users
Click: "Execute GET Request"

Response akan menampilkan:
✓ SUCCESS
{
  "status": "success",
  "message": "Users retrieved successfully",
  "count": 3,
  "data": [
    {
      "id": "1",
      "username": "Admin User",
      "email": "admin@store.com",
      "role": "admin"
    },
    // ... more users
  ]
}
```

### 2. **GET Single User**
```
Tab: GET - Single User
Input User ID: 2
Click: "Execute GET Request"

Response:
✓ SUCCESS
{
  "status": "success",
  "message": "User found",
  "data": {
    "id": "2",
    "username": "aden@gmail.com",
    "email": "aden@gmail.com",
    "role": "customer",
    "createdAt": "2025-11-12T..."
  }
}
```

### 3. **PUT Update User**
```
Tab: PUT - Update User
Input:
  - User ID: 2
  - Username: Aden Pratama
  - Email: aden.p@gmail.com
  - Role: customer

Click: "Execute PUT Request"

Response:
✓ SUCCESS
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "id": "2",
    "username": "Aden Pratama",
    "email": "aden.p@gmail.com",
    "role": "customer",
    "updatedAt": "2025-11-12T..."
  }
}
```

### 4. **POST Change Password**
```
Tab: POST - Change Password
Input:
  - User ID: 2
  - New Password: NewSecurePass123

Click: "Execute POST Request"

Response:
✓ SUCCESS
{
  "status": "success",
  "message": "Password changed successfully",
  "data": {
    "userId": "2",
    "email": "aden@gmail.com",
    "changedAt": "2025-11-12T..."
  }
}
```

### 5. **DELETE User**
```
Tab: DELETE - Delete User
Input User ID: 3
Click: "Execute DELETE Request"

System akan minta konfirmasi dulu:
"Are you sure you want to delete user with ID 3? This action cannot be undone!"

Setelah confirm:
✓ SUCCESS
{
  "status": "success",
  "message": "User deleted successfully",
  "data": {
    "userId": "3",
    "email": "deleted@email.com"
  }
}
```

---

## 🎨 Visual Features

### Response Box Styling:
- **Background**: Dark (#2d2d2d) - seperti terminal
- **Text Color**: Cyan (#4ec9b0) - professional look
- **Font**: Monospace (Courier New)
- **Max Height**: 500px dengan scrollbar
- **Line Height**: 1.5 untuk readability

### Status Indicators:
```
✓ SUCCESS (Green badge)      - Request berhasil
✗ ERROR   (Red badge)        - Ada error/validation failed
⏳ LOADING (Yellow badge)     - Sedang diproses
```

### Syntax Coloring:
```json
{
  "key": "value",      // key = biru, value = orange
  "number": 42,        // number = hijau
  "boolean": true,     // true = biru
  "null_value": null   // null = biru
}
```

---

## ⚡ Features Explained

### Tab Navigation
5 tab terpisah untuk setiap endpoint:
1. **GET** - Dapatkan semua users
2. **GET** - Dapatkan single user
3. **PUT** - Update user info
4. **POST** - Change password
5. **DELETE** - Hapus user

### Input Validation
- Setiap form memvalidasi input client-side
- Error ditampilkan dengan jelas sebelum request dikirim

### Real-time Feedback
- Loading state dengan message
- Instant response display
- Color-coded status badges

---

## 📋 API Response Format (All Endpoints)

```json
{
  "status": "success|error",
  "message": "Descriptive message",
  "count": 3,           // Optional (GET all users)
  "data": { /* ... */ } // Main response
}
```

---

## 🔒 Security Notes

✅ **All endpoints require admin role**
- Non-admin users get 403 Forbidden

✅ **Passwords never returned**
- API hanya return user info tanpa password

✅ **Input validated**
- Email format, username, role values
- XSS prevention via sanitization

✅ **Self-delete prevention**
- Admin tidak bisa delete diri sendiri

---

## 🐛 Troubleshooting

### Response tidak muncul?
1. Pastikan sudah login sebagai admin
2. Cek browser console (F12) untuk errors
3. Pastikan user ID valid (ada di list)

### Error 403 Forbidden?
- Anda bukan admin, login dengan admin account

### Error 404 Not Found?
- User ID tidak ada, gunakan ID yang valid

### Network Error?
- Pastikan server running di localhost:3000
- Cek terminal untuk error messages

---

## 🎓 Learning Path

**Untuk memahami API lebih dalam:**

1. Baca API Documentation: `/API_ADMIN_USERS.md`
2. Lihat client library: `/public/js/admin-users-api.js`
3. Lihat backend route: `/routes/api/users.js`
4. Test dengan berbagai user IDs dan data

---

## 💡 Tips

1. **Mulai dari GET All Users** - Lihat data apa saja yang tersedia
2. **Test dengan valid ID** - Gunakan ID dari response GET All Users
3. **Jangan lupa konfirmasi** - DELETE request butuh extra confirmation
4. **Cek status badge** - Tahu langsung success atau error

---

## 🚀 Next Steps

- Integrate admin-users-api.js ke dashboard untuk UI buttons
- Tambah pagination untuk list view
- Tambah search/filter functionality
- Implement real-time updates dengan WebSocket

---

**Created:** November 12, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Testing

