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
