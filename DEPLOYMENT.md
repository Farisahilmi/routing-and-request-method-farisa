# Panduan Deployment ke Vercel

## ⚠️ PENTING: Masalah File System di Vercel

Vercel menggunakan **serverless functions** yang memiliki filesystem **read-only**. Ini berarti:
- ❌ **TIDAK BISA** menulis file JSON ke folder `/data` di production
- ✅ File JSON hanya bisa dibaca, tidak bisa di-update/hapus
- ✅ Untuk fitur CRUD (Create, Read, Update, Delete), perlu menggunakan **database eksternal**

## Solusi untuk Deploy ke Vercel

### Opsi 1: MongoDB Atlas (GRATIS - Recommended)

MongoDB Atlas menyediakan database gratis hingga 512MB yang cukup untuk development.

#### Langkah-langkah:

1. **Daftar MongoDB Atlas** (gratis):
   - Kunjungi: https://www.mongodb.com/cloud/atlas/register
   - Buat akun gratis
   - Buat cluster baru (pilih FREE tier)

2. **Dapatkan Connection String**:
   - Klik "Connect" pada cluster Anda
   - Pilih "Connect your application"
   - Copy connection string (contoh: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

3. **Install MongoDB Driver**:
   ```bash
   npm install mongodb
   ```

4. **Setup Environment Variables di Vercel**:
   - Buka project di Vercel Dashboard
   - Settings → Environment Variables
   - Tambahkan:
     - `MONGODB_URI`: connection string MongoDB Anda
     - `SESSION_SECRET`: random string untuk session (generate dengan: `openssl rand -base64 32`)

5. **Update Code untuk MongoDB** (akan dibuat helper baru)

### Opsi 2: Gunakan Vercel KV (Key-Value Store)

Vercel menyediakan KV store untuk data sederhana.

### Opsi 3: Supabase (GRATIS)

Database PostgreSQL gratis dengan 500MB storage.

## Setup Environment Variables

Tambahkan di Vercel Dashboard → Settings → Environment Variables:

```
SESSION_SECRET=your-secret-key-here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NODE_ENV=production
```

## Fitur yang Bekerja di Vercel

✅ **Bekerja:**
- View products (read-only)
- View orders (read-only)
- Authentication (login/register)
- Session management
- Language switching
- Static file serving

❌ **TIDAK Bekerja tanpa Database:**
- Create/Update/Delete products
- Create/Update/Delete orders
- Add to cart (jika pakai file)
- Update user data
- Upload images (perlu external storage)

## Quick Start dengan MongoDB

Setelah setup MongoDB Atlas, update `helpers/database.js` untuk menggunakan MongoDB instead of file system.

## Upload Images

Untuk upload images di Vercel, gunakan:
- **Vercel Blob Storage** (paid)
- **Cloudinary** (free tier available)
- **AWS S3** (free tier available)
- **Supabase Storage** (free tier available)

## Testing Lokal

Untuk test sebelum deploy:

```bash
# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export SESSION_SECRET=your-secret-key

# Run locally
npm start
```

## Deploy ke Vercel

1. **Install Vercel CLI** (jika belum):
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Deploy Production**:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Error: Cannot write file
- **Penyebab**: Mencoba write ke filesystem di Vercel
- **Solusi**: Gunakan database eksternal (MongoDB/Supabase)

### Error: Session not working
- **Penyebab**: Cookie secure settings
- **Solusi**: Pastikan `SESSION_SECRET` sudah di-set di environment variables

### Error: Upload failed
- **Penyebab**: Tidak bisa write ke `/public/uploads`
- **Solusi**: Gunakan external storage (Cloudinary/S3)

## Next Steps

1. Setup MongoDB Atlas (gratis)
2. Update `helpers/database.js` untuk menggunakan MongoDB
3. Setup image storage (Cloudinary/S3)
4. Deploy ke Vercel
5. Test semua fitur

---

**Note**: Untuk production yang serius, sangat disarankan menggunakan database eksternal daripada file JSON.

