// context/AuthContext.tsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { loginApi, checkMeApi, logoutApi } from '../services/authService';
import type { AuthUser, UserRole } from '../types/auth';

export type UserData = AuthUser;

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole }>;
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

  
    async function login(email: string, password: string): Promise<{ success: boolean; role?: UserRole }> {
        try {
            const userData = await loginApi(email, password);
            setUser(userData);
            return { success: true, role: userData.role };
        } catch (error) {
            console.error("Login falló", error);
            return { success: false };
        }
    }


    async function logout() {
        try {
            // Le avisamos al servidor que destruya la sesión
            await logoutApi(); 
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor", error);
        }
        // Borramos al usuario de React
        setUser(null);
        // Redirigimos al login
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
