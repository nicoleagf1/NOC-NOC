# Manual de Especificaciones Visuales y Look & Feel · Vepagos

Este documento consolida la guía de diseño visual, colores corporativos, tipografía y patrones de interfaz para asegurar la consistencia del nuevo **Dashboard Centralizado de Monitoreo (NOC)**. Todo el entregable visual del proyecto debe alinearse estrictamente a estas especificaciones.

---

## 1. Plantillas de Pantallas (Guía de Estructura)

Utilizar estas referencias de disposición y diseño para las diferentes vistas del sistema:

* **Pantalla de Login Vepagos:**
    * Fondo navy degradé.
    * Logo institucional en color blanco.
    * Tarjeta (card) blanca centrada para el formulario de ingreso.
    * Botón de llamado a la acción (CTA) en color verde.
* **Dashboard Principal:**
    * Barra lateral (Sidebar) blanca con texto de las secciones en mayúsculas (*uppercase*).
    * Barra superior (Topbar) en color navy.
    * Tarjetas de Indicadores Clave de Rendimiento (KPI) estructuradas con un borde sutil.
* **Formulario de Carga:**
    * Campos de entrada (*inputs*) con borde de `1.5px`.
    * Efecto de enfoque (*focus*) en color verde.
    * Etiquetas de campos utilizando la tipografía **Barlow Condensed uppercase**.
* **Tabla de Seguimiento:**
    * Encabezados de columna en color navy y en mayúsculas (*uppercase*).
    * Filas de la tabla con efecto de hover suave al pasar el cursor.
    * Uso de distintivos (*badges*) de estado para clasificar registros.

---

## 2. Paleta de Colores Corporativos

Estos son los únicos colores autorizados para la interfaz. Se detallan sus códigos HEX y especificaciones de uso:

| Color | Código HEX / RGB | Uso Recomendado / Aplicación |
| :--- | :--- | :--- |
| **Verde Vepagos** | `HEX #00CE7C` <br> `RGB 0/206/124` | Color principal de marca, acentos y botones primarios. |
| **Verde Vepagos profundo** | `HEX #00B36C` | Uso exclusivo para estados de interacción (*hover*) y acentos específicos. |
| **Azul Navy** | `HEX #001F60` | Textos principales, encabezados y fondos oscuros (como la barra superior o fondo de login). |
| **Azul pálido** | `HEX #E5E9F2` | Fondos suaves, elementos secundarios y bordes del sistema. |
| **Fondo soft** | `HEX #F6F8FB` | Color base para superficies de trabajo, contenedores traseros y fondo general de la aplicación. |
| **Blanco** | `HEX #FFFFFF` | Base de tarjetas (*cards*), barra lateral (*sidebar*) y fondos limpios. |

---

## 3. Tipografía Oficial

El sistema utiliza la fuente corporativa **Bahnschrift**. Para entornos digitales, se emplea **Barlow** / **Barlow Condensed** como su sustituto geométrico más cercano.

* **Títulos Grandes y Encabezados (Display):**
    * **Tipografía:** `Barlow Condensed` (Sustituto de Bahnschrift).
    * **Estilo:** Más alta, angosta y de gran impacto.
    * **Regla de estilo:** Debe usarse en mayúsculas (`UPPERCASE`) para headers con un `letter-spacing` (espaciado entre letras) leve.
* **Textos Normales y Contenido (Cuerpo):**
    * **Tipografía:** `Barlow Regular / Medium`.
    * **Estilo:** Fluido, limpio y optimizado para una alta legibilidad de datos y descripciones.

---

## 4. Patrones de Interfaz y Diseño a Respetar

Para garantizar la consistencia en bordes, espaciados y colores, se deben seguir de forma estricta las siguientes reglas de maquetación CSS:

* **Botones Primarios:**
    * Fondo **verde** (`#00CE7C`).
    * Texto en color **navy** (`#001F60`).
    * Bordes redondeados estilo píldora (**esquinas pill**): `border-radius: 999px`.
* **Radios de Curvatura (Border-radius):**
    * **Tarjetas (Cards):** `14px`
    * **Campos de entrada (Inputs):** `10px`
    * **Botones:** `999px` (Estilo píldora)
* **Sombras (Box-shadow):**
    * Deben ser sombras muy sutiles, limpias y de aspecto suave. Está prohibido el uso de sombras dramáticas o muy oscuras.
* **Códigos de Estado Visual (Badges y Alertas):**
    * 🟢 **Verde** (`#00CE7C`): Estado Correcto / OK.
    * 🟡 **Ámbar**: Estado Pendiente.
    * 🔴 **Rojo**: Estado de Alerta / Error.
    * 🔵 **Navy** (`#001F60`): Estado Informativo / Info.

