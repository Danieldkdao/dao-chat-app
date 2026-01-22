import { SERVER_URL } from "@/lib/auth-client";
import axios from "axios";

const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

export default api;
