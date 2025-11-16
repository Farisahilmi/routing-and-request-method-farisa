# ⚠️ Deploy ke Vercel TANPA Database (Read-Only Mode)

## ⚠️ PENTING: Keterbatasan

Jika deploy ke Vercel **tanpa database**, website akan bekerja dalam mode **READ-ONLY**:

### ✅ Yang Bekerja:
- ✅ View products (read)
- ✅ View orders (read)
- ✅ Login/Register (jika user sudah ada)
- ✅ Language switching
- ✅ Static pages
- ✅ View cart (read)

### ❌ Yang TIDAK Bekerja:
- ❌ Create/Update/Delete products
- ❌ Create/Update/Delete orders
- ❌ Add to cart (write)
- ❌ Update user data
- ❌ Admin operations (CRUD)
- ❌ Upload images

---

## 🚀 Cara Deploy Tanpa Database

### 1. Pastikan Data Sudah Ada

File JSON di folder `/data` akan digunakan untuk **read-only**:
- `users.json` - untuk login (read-only)
- `products.json` - untuk view products (read-only)
- `orders.json` - untuk view orders (read-only)
- dll

### 2. Setup Environment Variables di Vercel

**JANGAN set** `MONGODB_URI` - biarkan kosong.

Hanya set:
```
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
```

### 3. Deploy

```bash
vercel --prod
```

---

## 📝 Catatan Penting

1. **Data tidak akan ter-update**
   - Semua perubahan (add product, order, dll) akan **gagal**
   - Data tetap seperti saat deploy pertama

2. **Login hanya untuk user yang sudah ada**
   - User baru tidak bisa register (write gagal)
   - Hanya user di `users.json` yang bisa login

3. **Admin tidak bisa manage data**
   - Semua operasi CRUD akan gagal
   - Hanya bisa view

---

## 💡 Kapan Cocok Pakai Mode Ini?

✅ **Cocok untuk**:
- Demo/Portfolio website
- Static product catalog
- Read-only showcase

❌ **TIDAK cocok untuk**:
- E-commerce yang aktif
- Butuh user registration
- Butuh order management
- Butuh admin panel

---

## 🎯 Rekomendasi

**Untuk production yang serius**: **WAJIB pakai database** (MongoDB Atlas gratis)

**Untuk demo/portfolio**: Bisa pakai mode read-only ini

---

## 🔄 Upgrade ke Database (Nanti)

Jika nanti ingin upgrade ke database:

1. Setup MongoDB Atlas (5 menit)
2. Set `MONGODB_URI` di Vercel
3. Redeploy
4. Semua fitur langsung bekerja!

---

## 📚 Lihat Juga

- `ALTERNATIVES_TO_MONGODB.md` - Alternatif database gratis
- `SETUP_MONGODB.md` - Setup MongoDB Atlas
- `README_VERCEL.md` - Panduan lengkap deployment

