import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación NOC-NOC', () => {

  test('Debería mostrar un error con credenciales incorrectas', async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto('/login');

    // 2. Esperar a que el botón de login esté visible (y así la página ha cargado)
    const btnIngresar = page.getByRole('button', { name: 'Ingresar a la Plataforma' });
    await expect(btnIngresar).toBeVisible();

    // 3. Rellenar usuario y contraseña erróneos
    await page.getByPlaceholder('admin, operador...').fill('usuario_falso');
    await page.getByPlaceholder('••••••••').fill('clave_incorrecta_123');

    // 4. Click en ingresar
    await btnIngresar.click();

    // 5. Verificar que aparezca un toast de error o el texto de error de credenciales
    // El sistema NOC-NOC muestra alertas tipo toast o alertas destructivas en el form.
    // Verificamos si existe el texto de error de validación del backend:
    const errorMessage = page.getByText(/credenciales inválidas|usuario y contraseña requeridos/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Debería acceder exitosamente con credenciales válidas y redireccionar al Dashboard', async ({ page }) => {
    // Nota: Esta prueba asume que en tu base de datos de pruebas o desarrollo existe el usuario "admin"
    // Si no existe, puedes cambiarlo por un usuario que siempre sepas que está presente, o crear uno (seed).
    
    // 1. Navegar a la página de login
    await page.goto('/login');

    // 2. Rellenar formulario (usar variables de entorno preferentemente, pero para el prototipo usamos texto plano o fallback)
    const testUser = process.env.TEST_USER || 'admin';
    const testPass = process.env.TEST_PASS || 'admin'; 

    await page.getByPlaceholder('admin, operador...').fill(testUser);
    await page.getByPlaceholder('••••••••').fill(testPass);

    // 3. Click en ingresar
    await page.getByRole('button', { name: 'Ingresar a la Plataforma' }).click();

    // 4. Verificar redirección exitosa. El dashboard debería estar en la raíz '/' o '/(dashboard)'
    await expect(page).toHaveURL('/', { timeout: 8000 });

    // 5. Verificar que exista un elemento de la interfaz de usuario post-login (ej. menú lateral, título "Centro de Operaciones")
    const dashboardTitle = page.getByText('Centro de Operaciones').first();
    // Puede tardar un poco mientras cargan las métricas
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  });

});
