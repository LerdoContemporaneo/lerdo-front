'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';


export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
const { user } = useAuth();
const router = useRouter();


useEffect(() => {
if (!user) router.push('/login');
else if (allowedRoles && !allowedRoles.includes(user.role)) router.push('/');
}, [user, router, allowedRoles]);


if (!user) return null; // podría mostrar spinner
return <>{children}</>;
}

