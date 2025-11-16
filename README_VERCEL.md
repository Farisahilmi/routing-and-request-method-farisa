# 🚀 Deploy Simple Store ke Vercel

## ⚠️ PENTING: File System di Vercel

Vercel menggunakan **serverless functions** dengan filesystem **read-only**. Ini berarti:
- ✅ File JSON bisa **dibaca** (read)
- ❌ File JSON **TIDAK bisa ditulis** (write/update/delete)
- ✅ Untuk CRUD operations, **WAJIB menggunakan database eksternal**

## ✅ Solusi: MongoDB Atlas (GRATIS)

Website ini sudah dikonfigurasi untuk otomatis menggunakan MongoDB ketika di-deploy ke Vercel.

### Setup MongoDB (5 menit):

1. **Daftar MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. **Buat Cluster FREE** (M0 - 512MB gratis)
3. **Setup Database User**:
   - Security → Database Access → Add New User
   - Username: `simple-store-user`
   - Password: Generate & simpan!
4. **Allow Network Access**:
   - Security → Network Access → Add IP Address
   - Pilih: **Allow Access from Anywhere** (0.0.0.0/0)
5. **Dapatkan Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/simple-store`

## 📋 Langkah Deploy

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables di Vercel

Buka Vercel Dashboard → Project → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simple-store?retryWrites=true&w=majority
SESSION_SECRET=generate-random-string-here
NODE_ENV=production
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Deploy

**Via CLI**:
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Via GitHub**:
1. Push ke GitHub
2. Import di Vercel
3. Auto-deploy!

## 🔧 Cara Kerja

Website ini otomatis detect environment:

- **Development (Local)**: 
  - Menggunakan file JSON di folder `/data`
  - Semua CRUD operations bekerja normal

- **Production (Vercel)**:
  - Jika `MONGODB_URI` ada → otomatis pakai MongoDB
  - Jika tidak ada → fallback ke file system (read-only, write akan gagal)

## ✅ Fitur yang Bekerja

Setelah setup MongoDB:
- ✅ Login/Register
- ✅ View Products
- ✅ Add to Cart
- ✅ Create Orders
- ✅ Admin Dashboard
- ✅ CRUD Products
- ✅ CRUD Users
- ✅ CRUD Orders
- ✅ Language Switching
- ✅ All API endpoints

## ❌ Yang Perlu Setup Tambahan

- **Image Upload**: 
  - File upload ke `/public/uploads` tidak bekerja di Vercel
  - Gunakan Cloudinary/S3 untuk production
  - Atau disable upload feature

## 🐛 Troubleshooting

### "MONGODB_URI not set"
→ Tambahkan environment variable di Vercel Dashboard

### "Authentication failed"
→ Cek username/password di connection string

### "Connection timeout"
→ Cek Network Access di MongoDB Atlas (harus 0.0.0.0/0)

### Write operations tidak bekerja
→ Pastikan `MONGODB_URI` sudah di-set dan MongoDB connection berhasil

## 📚 File Penting

- `vercel.json` - Konfigurasi Vercel
- `api/index.js` - Entry point untuk Vercel
- `helpers/database.js` - Auto-detect MongoDB atau file system
- `helpers/database-mongodb.js` - MongoDB helper
- `DEPLOYMENT.md` - Dokumentasi lengkap
- `VERCEL_QUICKSTART.md` - Quick start guide

## 🎯 Next Steps

1. ✅ Setup MongoDB Atlas
2. ✅ Set environment variables
3. ✅ Deploy ke Vercel
4. ✅ Test semua fitur
5. ⚠️ Setup image storage (opsional)

---

**Note**: Untuk production yang stabil, sangat disarankan menggunakan MongoDB daripada file JSON.

