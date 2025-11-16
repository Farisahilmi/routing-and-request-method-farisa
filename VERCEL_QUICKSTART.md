# 🚀 Quick Start: Deploy ke Vercel

## Langkah 1: Setup MongoDB Atlas (GRATIS)

1. **Daftar di MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. **Buat Cluster**:
   - Pilih FREE tier (M0)
   - Pilih region terdekat (Singapore untuk Indonesia)
   - Klik "Create Cluster"
3. **Setup Database Access**:
   - Security → Database Access
   - Add New Database User
   - Username: `simple-store-user`
   - Password: Generate secure password (simpan!)
   - Database User Privileges: "Read and write to any database"
4. **Setup Network Access**:
   - Security → Network Access
   - Add IP Address
   - Pilih "Allow Access from Anywhere" (0.0.0.0/0)
5. **Dapatkan Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Ganti `<password>` dengan password yang dibuat
   - Ganti `<dbname>` dengan `simple-store`
   - Contoh: `mongodb+srv://simple-store-user:password123@cluster0.xxxxx.mongodb.net/simple-store?retryWrites=true&w=majority`

## Langkah 2: Install Dependencies

```bash
npm install
```

Ini akan install `mongodb` package yang sudah ditambahkan.

## Langkah 3: Setup Environment Variables

### Di Vercel Dashboard:

1. Buka project di Vercel
2. Settings → Environment Variables
3. Tambahkan:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/simple-store?retryWrites=true&w=majority
SESSION_SECRET=generate-random-string-here
NODE_ENV=production
```

**Generate SESSION_SECRET**:
```bash
# Di terminal/command prompt:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Langkah 4: Deploy ke Vercel

### Opsi A: Via Vercel CLI

```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

### Opsi B: Via GitHub

1. Push code ke GitHub
2. Import project di Vercel
3. Vercel akan auto-detect dan deploy
4. Tambahkan environment variables di Settings

## Langkah 5: Migrate Data (Opsional)

Jika Anda sudah punya data di file JSON, bisa migrate ke MongoDB:

1. Buat script migration (akan dibuat)
2. Atau manual copy data dari JSON ke MongoDB

## ✅ Checklist

- [ ] MongoDB Atlas cluster dibuat
- [ ] Database user dibuat
- [ ] Network access di-set ke 0.0.0.0/0
- [ ] Connection string didapat
- [ ] Environment variables di-set di Vercel
- [ ] Dependencies di-install (`npm install`)
- [ ] Deploy ke Vercel
- [ ] Test semua fitur:
  - [ ] Login/Register
  - [ ] View Products
  - [ ] Add to Cart
  - [ ] Create Order
  - [ ] Admin Dashboard
  - [ ] CRUD Products
  - [ ] CRUD Users

## 🐛 Troubleshooting

### Error: "MONGODB_URI not set"
- Pastikan environment variable sudah di-set di Vercel
- Redeploy setelah menambahkan env vars

### Error: "Authentication failed"
- Cek username/password di connection string
- Pastikan database user sudah dibuat

### Error: "Connection timeout"
- Cek Network Access di MongoDB Atlas
- Pastikan IP 0.0.0.0/0 sudah di-allow

### Fitur tidak bekerja
- Pastikan MongoDB connection berhasil
- Cek logs di Vercel Dashboard → Functions → Logs

## 📝 Catatan Penting

1. **File System di Vercel adalah READ-ONLY**
   - Semua write operations akan otomatis pakai MongoDB
   - File JSON hanya untuk read di production

2. **Session Storage**
   - Session akan tersimpan di memory (default)
   - Untuk production yang lebih baik, bisa pakai MongoDB session store

3. **Image Upload**
   - Upload ke `/public/uploads` tidak akan bekerja di Vercel
   - Gunakan Cloudinary/S3 untuk production

## 🎉 Selesai!

Setelah semua setup, website Anda akan bekerja penuh di Vercel dengan MongoDB sebagai database!

