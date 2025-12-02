// /context/AuthContext.tsx (Versión Integrada)

'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, checkMeApi, LoginResponse } from '../services/authService';
// Asegúrate de que el path a authService sea correcto. 
// Ejemplo: Si AuthContext está en /context y services en /services, el path es '../services/authService'

// Renombramos la interfaz User para que coincida con el backend
export interface UserData {
    uuid: string;
    name: string;
    email: string;
    role: 'administrador' | 'maestro' | 'alumno'; // Roles exactos de tu modelo de Sequelize
}

interface AuthContextType {
    user: UserData | null;
    loading: boolean; // Agregamos un estado de carga para el chequeo inicial
    login: (email: string, password: string) => Promise<UserData>; // Ahora devuelve el objeto de usuario
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =======================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Función que corre una sola vez al cargar la aplicación
    // para verificar si ya hay una sesión activa en el backend.
    const checkSession = async () => {
        try {
            const userData = await checkMeApi(); // Llama al endpoint /me
            if (userData) {
                setUser(userData as UserData);
            }
        } catch (error) {
            console.error("Error al chequear sesión:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        checkSession();
    }, []);

    // **LÓGICA DE LOGIN REAL**
    async function login(email: string, password: string): Promise<UserData> {
        // Llama al servicio que ya creamos (que usa fetch al BASE_URL/login)
        const userData = await loginApi(email, password);
        setUser(userData as UserData);
        // NO usamos localStorage para la sesión, el backend lo maneja con Cookies
        return userData as UserData;
    }

    // **LÓGICA DE LOGOUT REAL**
    async function logout() {
        // Esto asume que tienes una función logoutApi() en authService.ts que llama a DELETE /logout
        // Si no la tienes, agrégala:
        /*
        // en authService.ts:
        export async function logoutApi() {
            await fetch(`${BASE_URL}/logout`, { method: "DELETE", credentials: "include" });
        }
        */
        
        // await logoutApi(); 
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ... (useAuthContext permanece igual)

// /* ==========================
//    /context/AuthContext.tsx (CORREGIDO)
//    ========================== */

// 'use client';
// import React, { createContext, useContext, useEffect, useState } from 'react';


// export type UserRole = 'admin' | 'teacher';


// export interface User {
//     username: string;
//     role: UserRole;
// }


// interface AuthContextType {
//     user: User | null;
//     login: (username: string, password: string) => Promise<boolean>;
//     logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);


// const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
//     admin: { password: 'admin123', role: 'admin' },
//     maestro: { password: 'maestro123', role: 'teacher' },
// };


// export function AuthProvider({ children }: { children: React.ReactNode }) {
//     const [user, setUser] = useState<User | null>(null);

//     useEffect(() => {
//         const stored = localStorage.getItem('user');
//         if (stored) setUser(JSON.parse(stored));
//     }, []);


//     async function login(username: string, password: string) {
//         const found = MOCK_USERS[username];
//         if (found && found.password === password) {
//             const user: User = { username, role: found.role };
//             setUser(user);
//             localStorage.setItem('user', JSON.stringify(user));
//             return true;
//         }
//         return false;
//     }

//     // CORRECCIÓN: Eliminado el 'function logout() {' duplicado
//     function logout() { 
//         setUser(null);
//         localStorage.removeItem('user');
//     }


//     return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
// } // CORRECCIÓN: Se eliminó la llave de cierre extra aquí

// export function useAuthContext() {
//     const ctx = useContext(AuthContext);
//     if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
//     return ctx;
// }