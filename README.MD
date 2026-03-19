# 💈 Haircut Region App

Aplikasi Manajemen Absensi dan Monitoring Gaji Kapster berbasis Mobile (Android/iOS) menggunakan **Expo** dan **Node.js**. Aplikasi ini dirancang khusus untuk operasional pangkas rambut dengan fitur validasi foto selfie (Cloudinary) dan perhitungan gaji otomatis.

## 🚀 Fitur Utama
* **Absensi Real-time:** Check-in dan Check-out disertai validasi foto selfie.
* **Perhitungan Gaji:** Estimasi gaji harian dan total gaji bulanan otomatis.
* **Dashboard Statistik:** Monitoring jumlah kepala yang dipotong setiap harinya.
* **Manajemen Status:** Fitur absen sakit dengan upload bukti foto.
* **Laporan Excel:** Ekspor data laporan (Excel) untuk kebutuhan admin.

## 🛠️ Tech Stack

### Frontend (Mobile)
* **Framework:** Expo (React Native)
* **Navigation:** React Navigation (Stack & Bottom Tabs)
* **Icons:** Lucide React Native
* **Date Management:** Dayjs
* **Networking:** Axios
* **Storage:** AsyncStorage

### Backend (Server)
* **Runtime:** Bun / Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose)
* **Cloud Storage:** Cloudinary (Storage foto absen)
* **Validation:** JWT (JSON Web Token) & BcryptJS

---

## 📁 Struktur Folder
```text
├── backend/             # Node.js Express API
│   ├── src/
│   │   ├── config/      # Database & Cloudinary config
│   │   ├── controllers/ # Logic bisnis
│   │   ├── models/      # Mongoose Schema
│   │   ├── routes/      # API Endpoints
│   │   └── middleware/  # Auth & Upload middleware
│   ├── index.ts         # Entry point server
│   └── vercel.json      # Deployment config
├── frontend/            # Expo Mobile App
│   ├── assets/          # Images & Fonts
│   ├── components/      # UI Components
│   ├── screens/         # Page/Screen views
│   └── App.tsx          # Entry point mobile
└── README.md