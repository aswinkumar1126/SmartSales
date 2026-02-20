// lib/axiosInstance.ts
import { getStorage } from "@/utils/storage/storage";
import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.smartsaleson.com/api/v1";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 🔐 Attach userId securely
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = getStorage("userId");


    if (userId) {
      config.headers["USERID"] = userId; // ✅ custom header
    }
  }
  return config;
});
