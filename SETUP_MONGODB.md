# 🚀 Setup MongoDB untuk Vercel

## Connection String Anda

**⚠️ PENTING**: Password yang mengandung karakter khusus (!, @, #, dll) perlu di-URL-encode!

**Original**:
```
mongodb+srv://farisahilmiexe_db_user:Faris123!@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority
```

**Fixed (dengan URL encoding)**:
```
mongodb+srv://farisahilmiexe_db_user:Faris123%21@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority
```

**Atau gunakan helper script**:
```bash
node scripts/fix-connection-string.js
```

## 📋 Langkah Setup

### 1. Test Connection (Lokal)

```bash
# Install dotenv jika belum ada
npm install dotenv

# Test connection
node scripts/test-mongodb.js
```

### 2. Setup Environment Variables

#### Di Vercel Dashboard:

1. Buka project di Vercel
2. Settings → Environment Variables
3. Tambahkan:

```
MONGODB_URI=mongodb+srv://farisahilmiexe_db_user:Faris123!@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority
SESSION_SECRET=generate-random-string-here
NODE_ENV=production
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Di Local (.env file):

Buat file `.env` di root project:

```env
MONGODB_URI=mongodb+srv://farisahilmiexe_db_user:Faris123!@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. Migrate Data dari JSON ke MongoDB (Opsional)

Jika Anda sudah punya data di file JSON dan ingin migrate ke MongoDB:

```bash
node scripts/migrate-to-mongodb.js
```

**Note**: Script ini akan:
- Membaca semua file JSON dari folder `/data`
- Memasukkan data ke MongoDB
- Skip jika collection sudah ada data (untuk safety)

### 4. Verify Setup

Setelah setup, test dengan:

```bash
# Test connection
node scripts/test-mongodb.js

# Start server
npm start
```

## ✅ Checklist

- [ ] MongoDB connection string sudah benar
- [ ] Environment variable `MONGODB_URI` sudah di-set di Vercel
- [ ] Environment variable `SESSION_SECRET` sudah di-set di Vercel
- [ ] Test connection berhasil
- [ ] Data sudah di-migrate (jika perlu)
- [ ] Deploy ke Vercel
- [ ] Test semua fitur di production

## 🔒 Security Notes

⚠️ **PENTING**: 
- Jangan commit `.env` file ke Git
- Jangan share connection string di public
- Connection string sudah ada di `.gitignore`

## 🐛 Troubleshooting

### Connection Timeout
- Cek Network Access di MongoDB Atlas
- Pastikan IP `0.0.0.0/0` sudah di-allow

### Authentication Failed (bad auth)
**Ini adalah masalah paling umum!**

Kemungkinan penyebab:
1. **Password mengandung karakter khusus** (!, @, #, dll) yang perlu di-URL-encode
   - Contoh: `Faris123!` → `Faris123%21`
   - Gunakan script: `node scripts/fix-connection-string.js`
   
2. **Username atau password salah**
   - Cek di MongoDB Atlas → Security → Database Access
   - Pastikan username dan password benar
   
3. **Database user belum dibuat**
   - Buat database user di MongoDB Atlas
   - Pastikan privileges: "Read and write to any database"

4. **Gunakan connection string dari MongoDB Atlas**
   - MongoDB Atlas sudah auto-encode password
   - Copy langsung dari "Connect" → "Connect your application"

### Database Name
- Connection string sudah include database name: `simple-store`
- Jika ingin pakai database lain, ganti di connection string

## 📚 Collections yang Akan Dibuat

Setelah migrate atau penggunaan pertama, MongoDB akan otomatis membuat collections:
- `users` (dari users.json)
- `products` (dari products.json)
- `orders` (dari orders.json)
- `cart` (dari cart.json)
- `addresses` (dari addresses.json)
- `reviews` (dari reviews.json)

## 🎉 Selesai!

Setelah semua setup, website Anda akan otomatis menggunakan MongoDB di Vercel!

