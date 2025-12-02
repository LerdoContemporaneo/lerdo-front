'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, checkMeApi } from '../services/authService';

// Definición de tipos
export interface UserData {
    uuid: string;
    name: string;
    email: string;
    role: 'administrador' | 'maestro' | 'alumno'; // Asegúrate de que coincida con tu BD
}

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>; // Devuelve true/false
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const userData = await checkMeApi();
            if (userData) {
                // @ts-ignore - Forzamos el tipo si la respuesta difiere ligeramente
                setUser(userData);
            }
        } catch (error) {
            console.error("Sesión no encontrada:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        checkSession();
    }, []);

    async function login(email: string, password: string): Promise<boolean> {
        try {
            const userData = await loginApi(email, password);
            // @ts-ignore
            setUser(userData);
            return true;
        } catch (error) {
            console.error("Login falló", error);
            return false;
        }
    }

    async function logout() {
        setUser(null);
      
        window.location.href = '/login'; 
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext debe ser usado dentro de un AuthProvider");
    }
    return context;
};



// // /context/AuthContext.tsx

// 'use client';
// import React, { createContext, useContext, useEffect, useState } from 'react';
// // IMPORTANTE: Ajusta la ruta si es necesario
// import { loginApi, checkMeApi } from '../services/authService'; 
// // Asegúrate de que loginApi y checkMeApi ya existan en tu archivo authService.ts

// // Renombramos la interfaz para ser claros con los datos del backend
// export interface UserData {
//     uuid: string;
//     name: string;
//     email: string;
//     role: 'administrador' | 'maestro' | 'alumno'; // Roles exactos de Sequelize
// }

// interface AuthContextType {
//     user: UserData | null;
//     loading: boolean; // Indica si ya se terminó de chequear la sesión inicial
//     login: (email: string, password: string) => Promise<UserData>;
//     logout: () => void; // Por ahora es void, pero podrías hacerlo async si agregas logoutApi
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // =======================================================

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//     const [user, setUser] = useState<UserData | null>(null);
//     const [loading, setLoading] = useState(true);

//     // 1. Chequeo de Sesión al iniciar (llama a GET /me del backend)
//     const checkSession = async () => {
//         try {
//             const userData = await checkMeApi(); // Intenta obtener la sesión activa
//             if (userData) {
//                 // El tipo de dato devuelto por checkMeApi debe coincidir con UserData
//                 setUser(userData as UserData); 
//             }
//         } catch (error) {
//             // Un error de red o 401/404 no debe detener la app, solo significa que no hay sesión.
//             console.warn("No hay sesión activa o error al chequear /me:", error);
//             setUser(null);
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     // Se ejecuta una sola vez al cargar la app
//     useEffect(() => {
//         checkSession();
//     }, []);

//     // 2. Función de Login (llama a POST /login del backend)
//     async function login(email: string, password: string): Promise<UserData> {
//         try {
//             const userData = await loginApi(email, password);
//             setUser(userData as UserData);
//             return userData as UserData;
//         } catch (error) {
//             // Propaga el error para que el componente Login lo maneje
//             throw error; 
//         }
//     }

//     // 3. Función de Logout (cierra sesión)
//     function logout() {
//         // Opción limpia: llamar a una función logoutApi() que haga DELETE /logout
//         // Por ahora, solo limpiamos el estado local.
//         // **Recomendación:** Crea la función logoutApi en authService.ts
//         setUser(null);
//     }

//     return (
//         <AuthContext.Provider value={{ user, loading, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuthContext() {
//     const ctx = useContext(AuthContext);
//     if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
//     return ctx;
// }