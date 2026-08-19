# NOC-NOC — Pantalla de Login
## Especificación completa del mockup · Doble contenedor · Vepagos

**Versión:** 1.0  
**Producto:** NOC-NOC — Dashboard Centralizado de Monitoreo  
**Pantalla:** Login / Autenticación  
**Marca:** Vepagos  
**Objetivo:** Definir la especificación visual completa de la pantalla de acceso.

---

# 1. Objetivo de la pantalla

La pantalla de Login es la puerta de entrada a NOC-NOC y debe comunicar:

- Identidad corporativa Vepagos.
- Seguridad y confiabilidad.
- Tecnología empresarial.
- Centro de Operaciones / Monitoreo.
- Simplicidad de uso.

La propuesta visual utiliza una composición de **doble contenedor**:

1. **Panel de identidad:** logo Vepagos, nombre NOC-NOC, descripción del centro de monitoreo y recursos gráficos tecnológicos sutiles.
2. **Panel de autenticación:** formulario limpio y corporativo para usuario y contraseña.

El concepto futurista debe ser **moderado**. No debe convertirse en una estética cyberpunk ni competir con la identidad Vepagos.

---

# 2. Base documental

Esta pantalla debe respetar el Manual de Especificaciones Visuales y Look & Feel de Vepagos.

El manual establece para Login:

- Fondo navy degradé.
- Logo institucional en blanco.
- Card blanca centrada para el formulario.
- CTA verde.

También establece los tokens corporativos, tipografía, radios, botones e inputs.

La propuesta NOC-NOC define además que el producto es un **Single Pane of Glass** para centralizar monitoreo de Uptime Kuma y Prometheus, por lo que la pantalla puede reforzar visualmente la idea de Centro de Operaciones.

---

# 3. Composición general

La pantalla debe ocupar todo el viewport.

Distribución recomendada:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│  │                              │  │                             │ │
│  │          VEPAGOS             │  │       INICIAR SESIÓN        │ │
│  │                              │  │                             │ │
│  │          NOC-NOC             │  │       USUARIO               │ │
│  │    CENTRO DE MONITOREO       │  │       [________________]     │ │
│  │                              │  │                             │ │
│  │    MONITOREO EN TIEMPO       │  │       CONTRASEÑA            │ │
│  │    REAL                      │  │       [________________]     │ │
│  │                              │  │                             │ │
│  │    ALERTAS INTELIGENTES      │  │       ☑ RECORDARME          │ │
│  │                              │  │       ¿OLVIDÓ SU CONTRASEÑA?│ │
│  │    OBSERVABILIDAD AVANZADA   │  │                             │ │
│  │                              │  │       [ INICIAR SESIÓN ]    │ │
│  │        HUD / RADAR            │  │                             │ │
│  │                              │  │       ACCESO SEGURO          │ │
│  └──────────────────────────────┘  └─────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 4. Panel izquierdo — Identidad Vepagos

## Proporción

Recomendación:

```text
48%–50% del viewport
```

## Fondo

Color principal:

```text
#001F60
```

El manual permite un **fondo navy degradé** para la pantalla de Login.

El degradado debe ser muy controlado y mantener claramente el navy corporativo como color dominante.

No utilizar gradientes multicolor.

---

# 5. Logo corporativo

Debe utilizarse el logo Vepagos seleccionado para el proyecto.

La versión aprobada para este mockup es:

```text
VE|PAGOS
TU NEGOCIO VENDE MÁS
```

en su tratamiento corporativo correspondiente.

## Reglas

- No reconstruir el logo con texto.
- No modificar sus proporciones.
- No deformarlo.
- No aplicar sombras.
- No utilizar un logo alternativo.
- Mantener el área de seguridad alrededor del logotipo.
- Sobre fondo oscuro debe utilizarse una versión con contraste adecuado según los archivos oficiales de marca.

## Ubicación

Zona superior del panel izquierdo.

Referencia:

```text
top: 70–90px
left: 70–100px
```

El logo no debe tocar los bordes del contenedor.

---

# 6. Identidad NOC-NOC

Debajo del logo:

```text
NOC-NOC
```

## Tipografía

```text
Barlow Condensed
```

## Estilo

```text
UPPERCASE
Bold
Letter-spacing leve
```

## Color

```text
#FFFFFF
```

## Tamaño sugerido

```text
48–60px
```

El tamaño final debe adaptarse al viewport.

---

# 7. Subtítulo

Texto:

```text
CENTRO DE MONITOREO
```

Tipografía:

```text
Barlow Regular / Medium
```

Color:

```text
#00CE7C
```

Letter-spacing:

```text
3–5px
```

Debe reforzar la naturaleza operativa de NOC-NOC.

---

# 8. Mensaje de valor

El panel izquierdo puede mostrar tres mensajes breves.

## Bloque 1

```text
MONITOREO EN TIEMPO REAL
```

Descripción:

```text
Visibilidad total de tu infraestructura
```

## Bloque 2

```text
ALERTAS INTELIGENTES
```

Descripción:

```text
Notificaciones proactivas y oportunas
```

## Bloque 3

```text
OBSERVABILIDAD AVANZADA
```

Descripción:

```text
Métricas, eventos y estado centralizados
```

Estos textos son elementos de comunicación del mockup y pueden ajustarse posteriormente a la nomenclatura funcional definitiva.

---

# 9. Iconografía

Utilizar iconos:

- Lineales.
- Geométricos.
- Minimalistas.
- Consistentes.

Color recomendado:

```text
#00CE7C
```

Ejemplos conceptuales:

```text
Escudo      → Seguridad
Campana     → Alertas
Gráfico     → Métricas
Monitor     → Monitoreo
```

No utilizar emojis en la implementación.

No utilizar iconos 3D.

---

# 10. Elementos futuristas

El futurismo es una capa visual secundaria.

Se pueden utilizar:

- Líneas de conexión.
- Puntos de red.
- Retículas.
- Círculos concéntricos.
- Radar.
- HUD.
- Líneas orbitales.
- Pequeños indicadores luminosos.

## Opacidad

```text
10%–30%
```

Los elementos deben estar detrás del contenido y nunca competir con:

- Logo.
- NOC-NOC.
- Formulario.
- CTA.

---

# 11. Radar / HUD inferior

Como recurso visual opcional puede utilizarse un radar tecnológico en la parte inferior izquierda.

Conceptualmente:

```text
              ·
          ─────────
       ───────────────
    ─────────────────────
          ◎
```

Color:

```text
#00CE7C
```

Con posibles variaciones de opacidad.

El radar debe sugerir:

```text
Centro de Operaciones
+
Monitoreo
+
Tecnología
```

No debe parecer una interfaz de videojuego.

---

# 12. Panel derecho — Autenticación

El panel derecho debe ser más sobrio que el izquierdo.

## Fondo

```text
#FFFFFF
```

El objetivo es crear contraste entre:

```text
Panel tecnológico / Navy
```

y

```text
Panel funcional / Blanco
```

---

# 13. Card de autenticación

La card debe seguir las especificaciones corporativas.

```css
background: #FFFFFF;
border-radius: 14px;
```

## Sombra

Debe ser muy sutil, limpia y suave.

Ejemplo de referencia:

```text
0 10px 40px rgba(0, 31, 96, 0.08)
```

La sombra es una referencia de implementación y no debe convertirse en un efecto visual dominante.

---

# 14. Encabezado del formulario

Título:

```text
INICIAR SESIÓN
```

## Tipografía

```text
Barlow Condensed
```

## Estilo

```text
UPPERCASE
Bold
```

## Color

```text
#001F60
```

## Tamaño sugerido

```text
40–48px
```

---

# 15. Línea de acento

Debajo del encabezado puede utilizarse una línea corta:

```text
────────
```

Color:

```text
#00CE7C
```

Debe ser discreta y servir como elemento de jerarquía visual.

---

# 16. Texto introductorio

Texto sugerido:

```text
Ingresa tus credenciales para acceder
a la plataforma NOC-NOC.
```

Tipografía:

```text
Barlow Regular / Medium
```

Color:

```text
#001F60
```

con una intensidad visual menor que el título.

---

# 17. Campo Usuario

## Label

```text
USUARIO
```

Tipografía:

```text
Barlow Condensed
```

Estilo:

```text
UPPERCASE
```

Color:

```text
#001F60
```

## Input

Placeholder:

```text
Ingrese su usuario
```

## Especificaciones

```css
height: 52–56px;
border: 1.5px solid #E5E9F2;
border-radius: 10px;
background: #FFFFFF;
```

Puede utilizar un icono lineal de usuario.

---

# 18. Campo Contraseña

## Label

```text
CONTRASEÑA
```

Tipografía:

```text
Barlow Condensed
```

Uppercase.

## Placeholder

```text
Ingrese su contraseña
```

## Control

Incluir:

```text
Mostrar / ocultar contraseña
```

mediante un icono de ojo.

## Dimensiones

Iguales al campo Usuario:

```text
52–56px
```

## Borde

```text
1.5px solid #E5E9F2
```

## Radio

```text
10px
```

---

# 19. Estado Focus

El manual establece que el foco de los inputs debe utilizar el verde corporativo.

```css
border-color: #00CE7C;
```

Puede agregarse un indicador extremadamente sutil:

```text
0 0 0 3px rgba(0, 206, 124, 0.08)
```

No utilizar glow intenso.

---

# 20. Recordarme

Checkbox:

```text
RECORDARME
```

Estado activo:

```text
#00CE7C
```

La etiqueta utiliza Barlow Condensed en uppercase cuando corresponda a la nomenclatura visual del sistema.

---

# 21. Recuperación de contraseña

Texto:

```text
¿OLVIDÓ SU CONTRASEÑA?
```

Color:

```text
#001F60
```

Hover:

```text
#00CE7C
```

Debe funcionar como enlace secundario, sin competir con el CTA principal.

---

# 22. Botón principal

Texto:

```text
INICIAR SESIÓN
```

Icono opcional:

```text
→
```

## Fondo

```text
#00CE7C
```

## Texto

```text
#001F60
```

## Forma

El manual establece botones tipo píldora:

```css
border-radius: 999px;
```

## Altura

```text
52–56px
```

## Ancho

```text
100%
```

## Hover

```text
#00B36C
```

El verde profundo está reservado para interacción / hover.

---

# 23. Acceso seguro

Debajo del CTA:

```text
ACCESO SEGURO
```

Puede utilizarse un icono lineal de escudo.

Icono:

```text
#00CE7C
```

Texto:

```text
#001F60
```

Este elemento refuerza la percepción de acceso a una plataforma de operaciones críticas.

---

# 24. Footer

Texto sugerido:

```text
© 2026 VEPAGOS
TODOS LOS DERECHOS RESERVADOS
```

Color:

```text
#001F60
```

Debe tener menor peso visual que el formulario.

---

# 25. Paleta corporativa

El manual define los siguientes colores autorizados:

| Elemento | HEX | Uso |
|---|---|---|
| Verde Vepagos | `#00CE7C` | Marca, acentos, CTA, estados OK |
| Verde Vepagos profundo | `#00B36C` | Hover e interacción |
| Azul Navy | `#001F60` | Texto, encabezados, fondos oscuros |
| Azul pálido | `#E5E9F2` | Bordes y fondos secundarios |
| Fondo soft | `#F6F8FB` | Superficies de trabajo |
| Blanco | `#FFFFFF` | Cards y superficies limpias |

No introducir colores adicionales sin una decisión posterior de diseño.

---

# 26. Tipografía oficial

El manual indica:

## Tipografía base

```text
Bahnschrift
```

y establece para entornos digitales:

```text
Barlow / Barlow Condensed
```

como sustituto geométrico cercano.

## Display

```text
Barlow Condensed
```

Usos:

- Títulos.
- Encabezados.
- Labels.
- Estados.
- Elementos de alto impacto.

Regla:

```text
UPPERCASE
```

con letter-spacing leve.

## Cuerpo

```text
Barlow Regular / Medium
```

Usos:

- Descripciones.
- Información auxiliar.
- Placeholders.
- Detalles.
- Textos de apoyo.

---

# 27. Border radius

## Cards

```css
border-radius: 14px;
```

## Inputs

```css
border-radius: 10px;
```

## Botones

```css
border-radius: 999px;
```

---

# 28. Sombras

El manual establece:

- Sombras muy sutiles.
- Limpias.
- Suaves.

No utilizar:

- Sombras negras fuertes.
- Efectos dramáticos.
- Neomorphism.
- Sombras profundas tipo gaming.

---

# 29. Personalidad visual

La pantalla debe sentirse como:

```text
VEPAGOS
    +
CENTRO DE OPERACIONES
    +
MONITOREO
    +
OBSERVABILIDAD
    +
TECNOLOGÍA EMPRESARIAL
```

No debe sentirse como:

- ERP.
- CRM.
- Portal administrativo.
- Portal fintech comercial.
- Dashboard de criptomonedas.
- Interfaz cyberpunk.

---

# 30. Elementos prohibidos

No utilizar:

- Glassmorphism.
- Neomorphism.
- Gradientes exagerados.
- Cyberpunk.
- Glitches.
- Partículas excesivas.
- Animaciones permanentes.
- Colores fuera de la paleta.
- Logos alternativos.
- Sidebar del dashboard.
- Gráficos reales de Prometheus en el Login.
- Tablas.
- KPIs.
- Elementos de navegación del dashboard.
- Ilustraciones genéricas de personas.

---

# 31. Animaciones

Las animaciones deben ser discretas.

Permitido:

- Fade-in.
- Entrada vertical corta.
- Hover del CTA.
- Transición de focus.
- Pulso muy sutil de indicadores tecnológicos.

Duración recomendada:

```text
150–250ms
```

No utilizar:

- Glitch.
- Parpadeos.
- Rotaciones permanentes.
- Animaciones agresivas.
- Movimiento constante de partículas.

---

# 32. Responsive

## Desktop

Distribución:

```text
48%–50% branding
50%–52% autenticación
```

El formulario debe permanecer centrado verticalmente.

---

## Tablet

Reducir:

- Márgenes.
- Tamaños decorativos.
- Espaciado del panel izquierdo.

Mantener el formulario con suficiente área para interacción cómoda.

---

## Mobile

Transformar la composición a una sola columna.

Orden:

```text
LOGO VEPAGOS

NOC-NOC

CENTRO DE MONITOREO

INICIAR SESIÓN

USUARIO
[________________]

CONTRASEÑA
[________________]

RECORDARME

¿OLVIDÓ SU CONTRASEÑA?

[ INICIAR SESIÓN ]

ACCESO SEGURO
```

El HUD/radar debe reducirse considerablemente o desaparecer para priorizar la autenticación.

---

# 33. Jerarquía visual

La prioridad debe ser:

```text
1. Logo Vepagos
2. NOC-NOC
3. INICIAR SESIÓN
4. Campos de credenciales
5. CTA
6. Recuperación de contraseña
7. Decoración tecnológica
```

La decoración nunca debe superar visualmente a la interacción principal.

---

# 34. Estados de la pantalla

La misma composición debe permitir posteriormente:

## Estado normal

Formulario vacío.

## Error de credenciales

Mostrar mensaje claramente visible:

```text
USUARIO O CONTRASEÑA INCORRECTOS
```

Utilizar el color de error definido por el sistema sin alterar la estructura general.

## Campo inválido

El input debe mostrar su estado de error manteniendo el radio y la estructura corporativa.

## Loading

El CTA puede cambiar a:

```text
VALIDANDO...
```

sin modificar su tamaño ni posición.

## Sesión expirada

Mostrar mensaje:

```text
TU SESIÓN HA EXPIRADO.
INGRESA NUEVAMENTE PARA CONTINUAR.
```

---

# 35. Patrón visual resumido

```text
┌───────────────────────────────────────────────────────────────┐
│                       NOC-NOC                                 │
│                                                               │
│  PANEL VEPAGOS                    PANEL LOGIN                 │
│  ─────────────                    ───────────                 │
│                                                               │
│  LOGO                             INICIAR SESIÓN               │
│                                                               │
│  NOC-NOC                           Usuario                     │
│  CENTRO DE MONITOREO               [________________]          │
│                                                               │
│  MONITOREO                         Contraseña                  │
│  ALERTAS                           [________________]          │
│  OBSERVABILIDAD                    │                          │
│                                                               │
│  HUD / RADAR                       RECORDARME                  │
│                                    ¿OLVIDÓ SU CONTRASEÑA?      │
│                                                               │
│                                    [ INICIAR SESIÓN ]          │
│                                                               │
│                                    ACCESO SEGURO               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

# 36. Criterios de aprobación

Antes de considerar terminado el Login:

- [ ] Se utiliza el logo Vepagos seleccionado.
- [ ] Se respeta la identidad corporativa.
- [ ] Se utiliza `#001F60` como navy.
- [ ] Se utiliza `#00CE7C` como verde principal.
- [ ] Se utiliza `#00B36C` para hover.
- [ ] Los títulos utilizan Barlow Condensed.
- [ ] El cuerpo utiliza Barlow Regular / Medium.
- [ ] Los títulos principales están en uppercase.
- [ ] Las cards utilizan `14px`.
- [ ] Los inputs utilizan `10px`.
- [ ] Los botones utilizan `999px`.
- [ ] Los inputs tienen borde de `1.5px`.
- [ ] El focus utiliza verde corporativo.
- [ ] Las sombras son suaves.
- [ ] El panel izquierdo refuerza la identidad Vepagos.
- [ ] El panel derecho mantiene una experiencia limpia.
- [ ] El futurismo es sutil.
- [ ] No se utiliza estética cyberpunk.
- [ ] El formulario es el foco principal de interacción.
- [ ] El diseño funciona en desktop, tablet y mobile.

---

# 37. Resultado visual esperado

El resultado final debe comunicar:

> **“Estoy entrando al Centro de Monitoreo de Vepagos.”**

La pantalla debe combinar la identidad institucional con una estética moderna de Centro de Operaciones, sin romper las reglas del manual visual.

La sensación buscada es:

```text
Corporativo
+
Tecnológico
+
Seguro
+
Limpio
+
Operativo
```

---

# 38. Relación con el resto de NOC-NOC

Esta pantalla constituye la referencia visual inicial para el sistema.

Debe mantener coherencia con:

1. Dashboard Ejecutivo.
2. Monitoreo de Servicios.
3. Infraestructura.
4. Centro de Alertas.
5. Historial de Eventos.
6. Configuración.

La navegación del sistema comienza después de la autenticación; por tanto, el Login no debe incluir la Sidebar ni la Topbar del dashboard.

---

# 39. Nota de implementación

La propuesta técnica de NOC-NOC utiliza:

- Next.js 14+ con App Router.
- Tailwind CSS.
- Tremor para componentes analíticos del dashboard.
- TypeScript.
- Route Handlers como BFF.

La pantalla de Login corresponde a:

```text
src/app/login/page.tsx
```

El layout global se encuentra en:

```text
src/app/layout.tsx
```

Los tokens visuales deben centralizarse para garantizar que el Login y las demás pantallas utilicen exactamente los mismos valores corporativos.

---

# 40. Referencia final de diseño

La pantalla aprobada conceptualmente queda definida como:

```text
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│        VEPAGOS           │     INICIAR SESIÓN       │
│                          │                          │
│        NOC-NOC           │     USUARIO              │
│  CENTRO DE MONITOREO     │     [______________]     │
│                          │                          │
│  MONITOREO EN TIEMPO     │     CONTRASEÑA           │
│  REAL                    │     [______________]     │
│                          │                          │
│  ALERTAS INTELIGENTES    │     RECORDARME           │
│                          │     ¿OLVIDÓ...?           │
│  OBSERVABILIDAD          │                          │
│  AVANZADA                │     [ INICIAR SESIÓN ]   │
│                          │                          │
│     HUD / RADAR          │     ACCESO SEGURO        │
│                          │                          │
└──────────────────────────┴──────────────────────────┘

       NAVY                       BLANCO
       VEPAGOS                    FORMULARIO
       TECNOLOGÍA                 AUTENTICACIÓN
```

**Esta especificación reemplaza cualquier referencia anterior a Source Sans 3. La tipografía del proyecto se mantiene alineada con el manual Vepagos: Bahnschrift como tipografía corporativa base y Barlow / Barlow Condensed como sustituto digital definido por el manual.**
