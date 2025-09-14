import axios from "axios";

// dynamic url as no there's localhost in production
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5050/api" : "/api";

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;