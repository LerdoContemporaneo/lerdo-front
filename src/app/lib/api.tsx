export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://lerdo-back.vercel.app/" ;

// import axios from "axios";
// const api = axios.create({
//     baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
//     timeout: 10000, 
// });
// api.interceptors.request.use(
//     (config) => {
//         if (typeof window !== "undefined") {

//             const token = localStorage.getItem("token"); 
//             if (token) {
//                 config.headers.Authorization = `Bearer ${token}`;
//             }
//         }

//         return config;
//     });
    
//     export default api;