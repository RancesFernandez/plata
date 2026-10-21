# Plata — finanzas personales y compartidas

Aplicación React + Firebase para registrar movimientos, presupuestos mensuales, metas de ahorro e informes.

## Requisitos

- Node.js 22.12 o superior.
- npm.
- Para guardar datos entre cuentas/dispositivos: un proyecto Firebase con Authentication y Cloud Firestore.

## Instalar

1. Extrae el ZIP en una carpeta nueva.
2. Abre una terminal en esa carpeta.
3. Ejecuta:

   ```bash
   npm install
   npm run dev
   ```

4. Abre `http://127.0.0.1:5173`.

No copies `node_modules` de otra carpeta. No se incluye `.env.local` por seguridad.

## Probar sin Firebase

En la pantalla de inicio de sesión, elige **Entrar en modo demo**. Los movimientos, presupuestos y metas se guardan en el almacenamiento local de ese navegador. La demo no sincroniza entre usuarios o dispositivos.

## Configurar Firebase para guardar datos reales

1. En Firebase Console crea o abre tu proyecto.
2. En **Authentication → Sign-in method**, habilita **Correo electrónico/Contraseña**.
3. En **Firestore Database**, crea la base de datos.
4. Copia `.env.example` como `.env.local` y reemplaza todos los valores `your_...` por los de **Project settings → Your apps → SDK setup and configuration**.
5. Detén y vuelve a iniciar `npm run dev` después de editar `.env.local`.
6. En Firestore → **Rules**, copia el contenido completo de `firestore.rules` y pulsa **Publish**.
7. Registra una cuenta e inicia sesión.

Las claves de configuración web de Firebase suelen ser identificadores públicos del proyecto, pero las reglas de Firestore son las que protegen los datos. Nunca pongas credenciales de cuentas de servicio ni claves privadas en `.env.local`.

## Presupuestos

- Cada presupuesto tiene categoría, mes, límite y espacio (personal o plan compartido).
- El consumo se calcula con los movimientos de tipo gasto de esa categoría, mes y espacio.
- No se permite duplicar una categoría en el mismo mes y espacio.
- Si aparece `permission-denied`, publica `firestore.rules` y verifica que la cuenta haya iniciado sesión.
- Si la app muestra que Firebase no está configurado, revisa que `.env.local` esté en la misma carpeta que `package.json`, que sus valores no sean los textos `your_...`, y reinicia el servidor.

## Metas y aportes

Se puede registrar un **Aporte a meta** desde el formulario de Movimientos o desde el botón **Añadir aporte** de una meta. En ambos casos se pide la fuente del dinero, se crea un movimiento de gasto en la categoría **Ahorro** con la fecha actual y se incrementa el progreso de la meta. La operación se guarda en un batch de Firestore para evitar que quede guardado el movimiento sin actualizar la meta (o viceversa).

## Compilar

```bash
npm run build
```

## Archivos importantes

- `src/App.jsx`: páginas, flujos y estado de la aplicación.
- `src/domain/financeData.js`: categorías y datos iniciales.
- `src/firebase.js`: inicialización de Firebase.
- `firestore.rules`: reglas de acceso de Firestore.
- `webpack.config.cjs`: configuración de desarrollo y compilación.
