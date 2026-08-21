# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Flujo de Autenticación NOC-NOC >> Debería mostrar un error con credenciales incorrectas
- Location: tests/login.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Ingresar a la Plataforma' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Ingresar a la Plataforma' })

```

```yaml
- img "Vepagos Logo"
- heading "NOC-NOC" [level=1]
- paragraph: Centro de Monitoreo
- heading "Monitoreo en Tiempo Real" [level=3]
- paragraph: Visibilidad total de tu infraestructura
- heading "Alertas Inteligentes" [level=3]
- paragraph: Notificaciones proactivas y oportunas
- heading "Observabilidad Avanzada" [level=3]
- paragraph: Métricas, eventos y estado centralizados
- heading "INICIAR SESIÓN" [level=2]
- paragraph: Ingresa tus credenciales para acceder a la plataforma NOC-NOC.
- text: USUARIO
- textbox "Ingrese su usuario"
- text: CONTRASEÑA
- textbox "Ingrese su contraseña"
- button
- checkbox "RECORDARME"
- text: RECORDARME
- button "¿OLVIDÓ SU CONTRASEÑA?"
- button "INICIAR SESIÓN →"
- text: ACCESO SEGURO
- paragraph: © 2026 VEPAGOS • TODOS LOS DERECHOS RESERVADOS
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Flujo de Autenticación NOC-NOC', () => {
  4  | 
  5  |   test('Debería mostrar un error con credenciales incorrectas', async ({ page }) => {
  6  |     // 1. Navegar a la página de login
  7  |     await page.goto('/login');
  8  | 
  9  |     // 2. Esperar a que el botón de login esté visible (y así la página ha cargado)
  10 |     const btnIngresar = page.getByRole('button', { name: 'Ingresar a la Plataforma' });
> 11 |     await expect(btnIngresar).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  12 | 
  13 |     // 3. Rellenar usuario y contraseña erróneos
  14 |     await page.getByPlaceholder('admin, operador...').fill('usuario_falso');
  15 |     await page.getByPlaceholder('••••••••').fill('clave_incorrecta_123');
  16 | 
  17 |     // 4. Click en ingresar
  18 |     await btnIngresar.click();
  19 | 
  20 |     // 5. Verificar que aparezca un toast de error o el texto de error de credenciales
  21 |     // El sistema NOC-NOC muestra alertas tipo toast o alertas destructivas en el form.
  22 |     // Verificamos si existe el texto de error de validación del backend:
  23 |     const errorMessage = page.getByText(/credenciales inválidas|usuario y contraseña requeridos/i);
  24 |     await expect(errorMessage).toBeVisible({ timeout: 5000 });
  25 |   });
  26 | 
  27 |   test('Debería acceder exitosamente con credenciales válidas y redireccionar al Dashboard', async ({ page }) => {
  28 |     // Nota: Esta prueba asume que en tu base de datos de pruebas o desarrollo existe el usuario "admin"
  29 |     // Si no existe, puedes cambiarlo por un usuario que siempre sepas que está presente, o crear uno (seed).
  30 |     
  31 |     // 1. Navegar a la página de login
  32 |     await page.goto('/login');
  33 | 
  34 |     // 2. Rellenar formulario (usar variables de entorno preferentemente, pero para el prototipo usamos texto plano o fallback)
  35 |     const testUser = process.env.TEST_USER || 'admin';
  36 |     const testPass = process.env.TEST_PASS || 'admin'; 
  37 | 
  38 |     await page.getByPlaceholder('admin, operador...').fill(testUser);
  39 |     await page.getByPlaceholder('••••••••').fill(testPass);
  40 | 
  41 |     // 3. Click en ingresar
  42 |     await page.getByRole('button', { name: 'Ingresar a la Plataforma' }).click();
  43 | 
  44 |     // 4. Verificar redirección exitosa. El dashboard debería estar en la raíz '/' o '/(dashboard)'
  45 |     await expect(page).toHaveURL('/', { timeout: 8000 });
  46 | 
  47 |     // 5. Verificar que exista un elemento de la interfaz de usuario post-login (ej. menú lateral, título "Centro de Operaciones")
  48 |     const dashboardTitle = page.getByText('Centro de Operaciones').first();
  49 |     // Puede tardar un poco mientras cargan las métricas
  50 |     await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  51 |   });
  52 | 
  53 | });
  54 | 
```