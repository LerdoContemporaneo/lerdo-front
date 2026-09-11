# CELC Portal - Frontend 🚀

¡Bienvenido al repositorio frontend del **Portal CELC**! Este proyecto forma parte del ecosistema de **Lerdo Contemporáneo** y está construido utilizando las tecnologías web más modernas y eficientes del mercado.

El proyecto ha sido inicializado con `create-next-app` y está optimizado para ofrecer una experiencia de usuario rápida, accesible y de alto rendimiento.

## 🛠️ Tecnologías Principales

* **Next.js 15+** (App Router) - Framework de React para el renderizado en el servidor y generación de sitios estáticos.
* **TypeScript** - Tipado estático para un código más seguro y mantenible.
* **Tailwind CSS / PostCSS** - Framework de estilos enfocado en utilidades para un diseño ágil y responsivo.
* **Geist Font** - Tipografía moderna optimizada automáticamente mediante `next/font`.
* **pnpm / npm** - Gestores de paquetes preparados para resolver dependencias eficientemente.

---

## 🚀 Inicio Rápido

Sigue estos pasos para clonar el proyecto y ejecutarlo en tu entorno local:

### 1. Clonar el repositorio
```bash
git clone https://github.com
cd lerdo-front
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo para crear tu configuración local:
```bash
cp .env.example .env.local
```
*Abre el archivo `.env.local` recién creado y completa los valores con tus credenciales locales.*

### 3. Instalar dependencias
Puedes usar tu gestor de paquetes preferido (se recomienda `pnpm` por consistencia con el proyecto):
```bash
pnpm install
# o bien
npm install
```

### 4. Levantar el servidor de desarrollo
```bash
pnpm dev
# o bien
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en funcionamiento. Puedes comenzar a editar el código modificando el archivo `src/app/page.tsx`.

---

## 📁 Estructura del Proyecto

```text
├── public/          # Archivos estáticos (imágenes, favicons, etc.)
├── src/
│   └── app/         # Enrutamiento de Next.js (App Router) y páginas
├── .env.example     # Plantilla de variables de entorno
├── next.config.ts   # Configuración de Next.js
├── tsconfig.json    # Configuración de TypeScript
└── tailwind.config  # Configuración de estilos de Tailwind
```

---

## 🌐 Despliegue

La forma más sencilla de desplegar esta aplicación es utilizando la plataforma **Vercel** (creadores de Next.js):

1. Conecta tu cuenta de GitHub a Vercel.
2. Importa el repositorio `lerdo-front`.
3. Configura las variables de entorno requeridas en el panel de Vercel.
4. ¡Haz clic en Deploy!

Para más detalles, consulta la [documentación de despliegue de Next.js](https://nextjs.org).

---

🏢 **Desarrollado por:** [Lerdo Contemporáneo](https://github.com/LerdoContemporaneo) , [Ely Nañez](https://github.com/3ly4ir777), [Javier Benavente](https://github.com/javis24) 
🔗 **Portal Oficial:** [://lerdocontemporaneo.com](https://://lerdocontemporaneo.com/login)
