"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/app/lib/api";

export default function TestConexion() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/usuarios`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("❌ Error:", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Prueba de conexión con backend</h1>
      {usuarios.length > 0 ? (
        <ul className="space-y-2">
          {usuarios.map((u: any) => (
            <li key={u.uuid} className="border p-2 rounded">
              {u.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay usuarios o no se pudo conectar con el backend.</p>
      )}
    </div>
  );
}