# Pantalla: Login
## Proyecto NOC-NOC
### Manual de Implementación UI/UX

---

# Objetivo

La pantalla de Login representa el primer contacto del usuario con la plataforma NOC-NOC, por lo que debe transmitir:

- Seguridad
- Estabilidad
- Tecnología empresarial
- Identidad corporativa Vepagos

No debe parecer un login genérico de administración ni un portal bancario; debe comunicar que el usuario ingresará a un Centro de Operaciones (NOC).

---

# Distribución

```text
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                 [ Logo Vepagos ]                            |
|                                                             |
|            NOC-NOC                                          |
|            Centro de Monitoreo                              |
|                                                             |
|      +------------------------------------------+           |
|      | Usuario                                 |           |
|      |_________________________________________|           |
|                                                             |
|      | Contraseña                             👁 |          |
|      |_________________________________________|           |
|                                                             |
|      [ Recordarme ]      ¿Olvidó su contraseña?             |
|                                                             |
|             ( Iniciar Sesión )                              |
|                                                             |
|            © Vepagos · Plataforma NOC-NOC                   |
|                                                             |
+-------------------------------------------------------------+
```

---

# Fondo

Color principal:

```
#001F60
```

Aplicar un degradado muy sutil:

```
#001F60
↓

#0B2F7F
```

No utilizar imágenes de fondo.

No utilizar patrones.

No utilizar transparencias.

No utilizar glassmorphism.

---

# Logo

Utilizar el logotipo corporativo seleccionado durante el diseño:

**VEPAGOS en color verde completo**

con el slogan

```
TU NEGOCIO VENDE MÁS
```

Este logo genera el mejor contraste sobre el fondo navy y mantiene la identidad visual del ecosistema Vepagos.

Ubicación:

Centro superior.

Separación superior aproximada:

80 px.

---

# Nombre del sistema

Debajo del logo.

Título:

```
NOC-NOC
```

Fuente:

Barlow Condensed

Peso:

Bold

Color:

Blanco

Tamaño:

48 px

Letter spacing:

2 px

---

Subtítulo

```
Centro de Monitoreo
```

Fuente

Barlow Regular

Color

#E5E9F2

Tamaño

20 px

---

# Card del Login

Color

```
#FFFFFF
```

Border Radius

```
14px
```

Shadow

Muy suave.

No utilizar sombras fuertes.

Ancho

520 px

---

# Campos

## Usuario

Label

```
USUARIO
```

Fuente

Barlow Condensed

Uppercase

Input

Altura

52 px

Border

```
1.5px solid #E5E9F2
```

Radius

10 px

Placeholder

```
Ingrese su usuario
```

---

## Contraseña

Mismo estilo.

Icono

Mostrar/Ocultar contraseña.

---

# Focus

Cuando el usuario selecciona un campo

Borde

```
#00CE7C
```

Glow

Muy sutil.

---

# Checkbox

```
Recordarme
```

Color activo

```
#00CE7C
```

---

# Link

```
¿Olvidó su contraseña?
```

Color

```
#001F60
```

Hover

```
#00CE7C
```

---

# Botón Principal

Texto

```
INICIAR SESIÓN
```

Fuente

Barlow Condensed

Uppercase

Color fondo

```
#00CE7C
```

Texto

```
#001F60
```

Radius

```
999px
```

Altura

52 px

Ancho

100%

Hover

```
#00B36C
```

Animación

150 ms

---

# Pie

Texto

```
© 2026 Vepagos
Plataforma NOC-NOC
Centro de Operaciones
```

Color

```
#E5E9F2
```

Tamaño

13 px

---

# Paleta Oficial

| Elemento | Color |
|----------|--------|
| Fondo | #001F60 |
| Fondo degradado | #0B2F7F |
| Card | #FFFFFF |
| Verde principal | #00CE7C |
| Verde Hover | #00B36C |
| Navy | #001F60 |
| Azul claro | #E5E9F2 |
| Texto principal | #001F60 |
| Texto secundario | #6E7B99 |

---

# Tipografía

## Encabezados

Barlow Condensed

- Bold
- Uppercase

---

## Contenido

Barlow Regular

---

# Border Radius

Cards

```
14px
```

Inputs

```
10px
```

Botones

```
999px
```

---

# Sombras

Muy suaves.

Difuminado ligero.

No utilizar:

- Glassmorphism
- Neomorphism
- Sombras negras intensas

---

# Experiencia de Usuario

Al abrir la aplicación, el usuario debe percibir inmediatamente:

- Plataforma corporativa.
- Centro de monitoreo empresarial.
- Diseño limpio y moderno.
- Alta disponibilidad y confiabilidad.
- Coherencia con la identidad visual de Vepagos.

La pantalla debe ser minimalista, elegante y alineada con el manual de identidad visual del proyecto NOC-NOC, priorizando la claridad, la simplicidad y la confianza institucional.