import axios from "axios";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "../constants/config";
import { emitAuthExpired } from "./authEvents";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("flowy-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      emitAuthExpired();
    }

    return Promise.reject(error);
  },
);

export default api;
