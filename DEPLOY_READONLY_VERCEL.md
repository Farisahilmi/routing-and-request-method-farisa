# 🚀 Deploy ke Vercel Tanpa Database (Read-Only Mode)

## 📋 Langkah-Langkah

### 1. Pastikan Data Sudah Ada

File JSON di folder `/data` akan digunakan untuk read-only:
- ✅ `users.json` - untuk login
- ✅ `products.json` - untuk view products
- ✅ `orders.json` - untuk view orders
- ✅ `cart.json` - untuk view cart
- ✅ `addresses.json` - untuk view addresses
- ✅ `reviews.json` - untuk view reviews

**Pastikan file-file ini sudah ada dan berisi data!**

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables di Vercel

**PENTING**: Jangan set `MONGODB_URI` - biarkan kosong!

Buka Vercel Dashboard:
1. Buka project di Vercel
2. Settings → Environment Variables
3. Tambahkan HANYA ini:

```
SESSION_SECRET=generate-random-string-here
NODE_ENV=production
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**JANGAN tambahkan** `MONGODB_URI` - biarkan tidak ada!

### 4. Deploy ke Vercel

#### Via Vercel CLI:

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

#### Via GitHub:

1. Push code ke GitHub
2. Import project di Vercel
3. Vercel akan auto-deploy
4. Pastikan environment variables sudah di-set

### 5. Verify Deployment

Setelah deploy, test:
- ✅ Buka website di Vercel
- ✅ Cek apakah products muncul
- ✅ Coba login (dengan user yang ada di `users.json`)
- ✅ Cek apakah semua halaman bisa diakses

---

## ⚠️ Keterbatasan Mode Read-Only

### ✅ Yang Bekerja:
- View products
- View orders
- Login (user yang sudah ada)
- View cart
- Language switching
- Static pages

### ❌ Yang TIDAK Bekerja:
- Register user baru
- Add to cart (write)
- Create order
- Update/Delete products
- Admin CRUD operations
- Upload images

**Semua operasi write akan gagal dengan error!**

---

## 🔍 Troubleshooting

### Error: "Cannot write file"
- **Normal!** Ini expected behavior di Vercel
- File system read-only
- Semua write operations akan gagal

### Login tidak bekerja
- Pastikan `users.json` sudah ada dan berisi data
- Pastikan password sudah di-hash dengan bcrypt
- Cek di logs Vercel untuk error details

### Products tidak muncul
- Pastikan `products.json` sudah ada
- Cek format JSON valid
- Cek logs Vercel untuk error

### Session tidak bekerja
- Pastikan `SESSION_SECRET` sudah di-set
- Pastikan cookie settings benar
- Cek browser console untuk cookie errors

---

## 📝 Checklist Sebelum Deploy

- [ ] File JSON di `/data` sudah ada dan berisi data
- [ ] `users.json` minimal ada 1 user untuk login
- [ ] `products.json` ada produk untuk ditampilkan
- [ ] Environment variable `SESSION_SECRET` sudah di-set
- [ ] Environment variable `NODE_ENV=production` sudah di-set
- [ ] **TIDAK ada** `MONGODB_URI` di environment variables
- [ ] Code sudah di-push ke GitHub (jika pakai auto-deploy)

---

## 🎯 Testing Lokal (Sebelum Deploy)

Test di local dulu untuk memastikan read-only mode bekerja:

```bash
# Set environment (tanpa MONGODB_URI)
export NODE_ENV=production
export SESSION_SECRET=test-secret-key

# Start server
npm start
```

Test:
- ✅ View products: http://localhost:3000/products
- ✅ Login: http://localhost:3000/users/login
- ❌ Try add to cart (akan gagal - ini normal!)

---

## 🔄 Upgrade ke Database (Nanti)

Jika nanti ingin upgrade ke full CRUD:

1. Setup MongoDB Atlas (5 menit)
2. Set `MONGODB_URI` di Vercel environment variables
3. Redeploy
4. Semua fitur langsung bekerja!

Lihat: `SETUP_MONGODB.md`

---

## 📚 File Penting

- `vercel.json` - Konfigurasi Vercel
- `api/index.js` - Entry point untuk Vercel
- `helpers/database.js` - Auto-detect MongoDB atau file system
- File JSON di `/data` - Data untuk read-only mode

---

## ✅ Selesai!

Setelah deploy, website akan bekerja dalam mode read-only:
- ✅ Semua fitur view bekerja
- ❌ Semua fitur write tidak bekerja (expected!)

**Perfect untuk**: Demo, Portfolio, Showcase produk

**Tidak cocok untuk**: E-commerce aktif yang butuh CRUD

