/* ==========================
   /context/AuthContext.tsx (CORREGIDO)
   ========================== */

'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';


export type UserRole = 'admin' | 'teacher';


export interface User {
    username: string;
    role: UserRole;
}


interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
    admin: { password: 'admin123', role: 'admin' },
    maestro: { password: 'maestro123', role: 'teacher' },
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);


    async function login(username: string, password: string) {
        const found = MOCK_USERS[username];
        if (found && found.password === password) {
            const user: User = { username, role: found.role };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        }
        return false;
    }

    // CORRECCIÓN: Eliminado el 'function logout() {' duplicado
    function logout() { 
        setUser(null);
        localStorage.removeItem('user');
    }


    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
} // CORRECCIÓN: Se eliminó la llave de cierre extra aquí

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
    return ctx;
}