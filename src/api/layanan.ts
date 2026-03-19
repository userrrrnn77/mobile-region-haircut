// src/api/layanan.ts
import API from "./api";

// ==========================================
// 1. RUTE AUTH & PROFILE
// ==========================================
export const login = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const updateProfile = (formData: FormData) =>
  API.patch("/auth/update-me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ==========================================
// 2. RUTE ABSENSI
// ==========================================
// REVISI: Check-in butuh Multipart karena ada FOTO
export const checkIn = (formData: FormData) =>
  API.post("/absen/check-in", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// REVISI: Checkout di controller lu cuma butuh { lat, lng, note } (JSON biasa)
// Tapi kalo lu kirim FormData juga gpp sih, cuma JSON lebih enteng.
export const checkOut = (data: { lat: number; lng: number; note?: string }) =>
  API.post("/absen/check-out", data);

export const izinSakit = (formData: FormData) =>
  API.post("/absen/sakit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAllAbsensi = (params?: {
  startDate?: string;
  endDate?: string;
  username?: string;
}) => API.get("/absen/all-absensi", { params });

export const getMyAbsensi = (params?: {
  startDate?: string;
  endDate?: string;
}) => API.get("/absen/my-absensi", { params });

// ==========================================
// 3. RUTE USERS & DASHBOARD
// ==========================================
// REVISI: Route di userRoutes.ts lu itu "/dashboard", bukan "/users/dashboard"
// karena udah di prefix router.use("/users", userRoutes)
export const getDashboardData = () => API.get("/users/dashboard");

export const getSemuaUsers = () => API.get("/users");
export const getUserById = (id: string) => API.get(`/users/detail/${id}`);
export const buatUserBaru = (data: any) => API.post("/users", data);
export const updateUserAssignment = (id: string, data: any) =>
  API.patch(`/users/${id}/assignment`, data);
export const deleteUser = (id: string) => API.delete(`/users/${id}`);

// ==========================================
// 4. RUTE BRANCH (RUTE LU TADI TYPO DI INDEX: /branch)
// ==========================================
export const getAllBranches = () => API.get("/branch");
export const createBranch = (data: any) => API.post("/branch", data);
export const updateBranch = (id: string, data: any) =>
  API.put(`/branch/${id}`, data);
export const deleteBranch = (id: string) => API.delete(`/branch/${id}`);

// ==========================================
// 5. RUTE LAPORAN (PENTING!!!)
// ==========================================
// REVISI: Di controller laporanHarianController.ts lu,
// nama field-nya "totalRevenue" dan "notes", BUKAN "total_uang_setoran"
export const setorLaporanHarian = (data: {
  totalRevenue: number;
  notes?: string;
  managementExpenses?: { description: string; amount: number }[];
}) => API.post("/laporan/setor", data);

export const getLaporanHarian = (params?: {
  branchId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) => API.get("/laporan", { params });
