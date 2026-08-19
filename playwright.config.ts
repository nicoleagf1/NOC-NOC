import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Define el directorio base donde estarán las pruebas
export default defineConfig({
  testDir: './tests',
  /* Ejecuta pruebas de forma paralela */
  fullyParallel: true,
  /* Fallar la compilación si hay tests ignorados por error en CI */
  forbidOnly: !!process.env.CI,
  /* Retries solo en CI */
  retries: process.env.CI ? 2 : 0,
  /* Un solo worker en CI para no sobrecargar el servidor (Docker), pero varios en local */
  workers: process.env.CI ? 1 : undefined,
  /* Reportero para ver resultados por consola o en HTML */
  reporter: 'html',
  /* Configuración global de las pruebas */
  use: {
    /* Base URL donde levantará Next.js localmente */
    baseURL: 'http://localhost:3000',

    /* Colecciona rastros (traces) cuando una prueba falla, muy útil para debuggear */
    trace: 'on-first-retry',
    /* Grabar un video de los tests fallidos */
    video: 'retain-on-failure',
  },

  /* Proyectos (Navegadores) donde ejecutaremos las pruebas */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomentar para probar en Firefox y Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Levantar el servidor de Next.js antes de comenzar las pruebas */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Si ya lo tienes abierto, lo reusa
    timeout: 120 * 1000,
  },
});
