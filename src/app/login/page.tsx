// //esta opcion me la sugirio la ia fusionanado ambos codigos sin mucho contexto 🤭

// 'use client';
// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../hooks/useAuth';
// import Button from '../components/ui/Button';
// import { Input } from '../components/ui/Input';

// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// export default function LoginPage() {
//   const { login } = useAuth();
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError('');

//     try {
//       const res = await fetch(`${BASE_URL}/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include", // Para cookies de express-session
//         body: JSON.stringify({ email, password }),
//       });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => null);
//         setError(errorData?.message || 'Error al iniciar sesión');
//         return;
//       }

//       const data = await res.json();
//       console.log("Sesión iniciada:", data);
      
//       // Si tu hook useAuth necesita actualizarse con la respuesta
//       const ok = await login(email, password);
      
//       if (ok) {
//         // Redirigir basado en el rol del usuario o respuesta del backend
//         // Puedes ajustar esto según la respuesta de tu API
//         if (data.user?.role === 'admin' || email === 'admin') {
//           router.push('/admin');
//         } else {
//           router.push('/teachers');
//         }
//       }
      
//     } catch (err) {
//       console.error("Error de conexión:", err);
//       setError('Error de conexión con el servidor');
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
//         <h1 className="text-2xl font-semibold mb-4 text-center">Iniciar Sesión</h1>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input 
//             label="Email" 
//             type="email"
//             value={email} 
//             onChange={(e) => setEmail(e.target.value)} 
//             required
//           />
//           <Input 
//             label="Contraseña" 
//             type="password" 
//             value={password} 
//             onChange={(e) => setPassword(e.target.value)} 
//             required
//           />
//           {error && <p className="text-sm text-red-600">{error}</p>}
//           <Button type="submit" className="w-full">Entrar</Button>
//         </form>
//         <div className="text-xs text-gray-500 mt-4 text-center">
//           {/* <p>Admin → admin@example.com / admin123</p>
//           <p>Maestro → maestro@example.com / maestro123</p> */}
//         </div>
//       </div>
//     </div>
//   );
// }

// // pirmera version sin json

// // 'use client';
// // import React, { useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useAuth } from '../hooks/useAuth';
// // import Button from '../components/ui/Button';
// // import { Input } from '../components/ui/Input';


// // export default function LoginPage() {
// // const { login } = useAuth();
// // const router = useRouter();
// // const [username, setUsername] = useState('');
// // const [password, setPassword] = useState('');
// // const [error, setError] = useState('');

// // async function handleSubmit(e: React.FormEvent) {
// // e.preventDefault();
// // const ok = await login(username, password);
// // if (ok) {
// // if (username === 'admin') router.push('/admin');
// // else router.push('/teachers');
// // } else {
// // setError('Credenciales incorrectas');
// // }
// // }
// // return (
// // <div className="min-h-screen flex items-center justify-center bg-gray-100">
// // <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
// // <h1 className="text-2xl font-semibold mb-4 text-center">Iniciar Sesión</h1>
// // <form onSubmit={handleSubmit} className="space-y-4">
// // <Input label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
// // <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
// // {error && <p className="text-sm text-red-600">{error}</p>}
// // <Button type="submit" className="w-full">Entrar</Button>
// // </form>
// // <div className="text-xs text-gray-500 mt-4 text-center">
// // {/* <p>Admin → admin / admin123</p>
// // <p>Maestro → maestro / maestro123</p> */}
// // </div>
// // </div>
// // </div>
// // );
// // }

// // codigo de referencia para el login con fetch y json

// // "use client";

// // import { useState } from "react";

// // const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// // export default function LoginForm() {
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();

// //     const res = await fetch(`${BASE_URL}/login`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       credentials: "include",
// //  cookies de express-session
// //       body: JSON.stringify({ email, password }),
// //     });

// //     if (!res.ok) {
// //       console.error("Error al iniciar sesión");
// //       return;
// //     }

// //     const data = await res.json();
// //     console.log("Sesión iniciada:", data);
// //   };

// //   return (
// //     <form onSubmit={handleSubmit}>
// //       {/* inputs de email y password */}
// //     </form>
// //   );
// // }



'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthContext } from '../context/AuthContext'; 


import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {

  const { login } = useAuthContext(); 
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

   
    const success = await login(email, password);

    if (success) {
 
      console.log("Login exitoso, redirigiendo...");
      
     
      if (email === 'admin' || email.includes('admin')) {
         router.push('/admin');
      } else {
         router.push('/teachers');
      }
    } else {
      setError('Credenciales incorrectas o error de conexión');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <Input 
            label="Contraseña" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}