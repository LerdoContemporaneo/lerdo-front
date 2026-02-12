//codigo legacy ya no usado la funcionalidad se movio a services y se usa fetch en vez de axios para evitar problemas de CORS y simplificar la configuracion del proyecto, se dejo este archivo por si se quiere volver a usar axios en el futuro o para referencia de como se hacia antes, pero actualmente no se esta usando en ningun lado del proyecto

// export const API_URL =
//   process.env.NEXT_PUBLIC_API_URL || "https://lerdo-back.vercel.app/" ;

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