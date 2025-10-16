# Fix: Menu Button Visibility en Pantallas Grandes (≥993px)

## Problema Identificado

El `ion-menu-button` se ocultaba automáticamente en pantallas de 993px o más debido a dos configuraciones:

1. **ion-split-pane sin configuración** - Por defecto oculta el menu-button en pantallas `md` (≥992px)
2. **Media queries que ocultaban headers** - En los módulos export, profile y language

## Cambios Realizados

### 1. app.component.html
**Archivo:** `front-end/src/app/app.component.html`

**Antes:**
```html
<ion-split-pane contentId="main-content">
```

**Después:**
```html
<ion-split-pane contentId="main-content" when="false">
```

**Motivo:** El atributo `when="false"` desactiva el comportamiento automático del split-pane que oculta el menu-button en pantallas grandes. Ahora el menu-button siempre será visible sin importar el tamaño de la pantalla.

---

### 2. export.page.scss
**Archivo:** `front-end/src/app/pages/export/export.page.scss`

**Eliminado:**
```scss
// Ocultar header en desktop
@media (min-width: 768px) {
  ion-header {
    display: none !important;
  }
}
```

**Motivo:** Esta regla ocultaba todo el header (incluyendo el menu-button) en pantallas mayores a 768px. Al eliminarla, el header y el menu-button permanecen visibles en todas las resoluciones.

---

### 3. profile.page.scss
**Archivo:** `front-end/src/app/pages/profile/profile.page.scss`

**Cambios:**
1. **Eliminado** el media query que ocultaba el header
2. **Agregado** estilos para el header consistentes con otros módulos

**Eliminado:**
```scss
// Ocultar header en desktop
@media (min-width: 768px) {
  ion-header {
    display: none !important;
  }
}
```

**Agregado:**
```scss
// Header Styles
ion-header.header-primary {
  ion-toolbar {
    --background: var(--ion-color-primary);
    --color: white;

    ion-title {
      color: white;
      font-weight: 600;
    }

    ion-menu-button {
      --color: white;
    }

    ion-icon {
      color: white;
    }
  }
}
```

---

### 4. language.page.scss
**Archivo:** `front-end/src/app/pages/language/language.page.scss`

**Cambios:**
1. **Eliminado** el media query que ocultaba el header
2. **Agregado** estilos para el header consistentes con otros módulos

**Eliminado dentro del media query (línea 251):**
```scss
@media (min-width: 768px) {
  // Ocultar el header en desktop
  ion-header {
    display: none !important;
  }
  // ... resto del media query permanece
}
```

**Agregado al inicio del archivo:**
```scss
// Header Styles
ion-header.header-primary {
  ion-toolbar {
    --background: var(--ion-color-primary);
    --color: white;

    ion-title {
      color: white;
      font-weight: 600;
    }

    ion-menu-button {
      --color: white;
    }

    ion-icon {
      color: white;
    }
  }
}
```

---

## Verificación de Estructura HTML

Todos los módulos tienen la estructura correcta del header:

### ✅ main.page.html
```html
<ion-header class="header-primary">
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-menu-button color="light"></ion-menu-button>
    </ion-buttons>
    <ion-title>{{ 'titles.modules.receipts.my-receipts' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>
```

### ✅ export.page.html
```html
<ion-header class="header-primary">
  <ion-toolbar color="primary">
    <ion-menu-button color="light" slot="start"></ion-menu-button>
    <ion-title>{{ 'menu.tabs.export' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>
```

### ✅ profile.page.html
```html
<ion-header class="header-primary">
  <ion-toolbar color="primary">
    <ion-menu-button color="light" slot="start"></ion-menu-button>
    <ion-title>{{ 'menu.tabs.profile' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>
```

### ✅ language.page.html
```html
<ion-header class="header-primary">
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-menu-button color="light"></ion-menu-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>
```

---

## Resultado Esperado

Después de estos cambios:

### ✅ Pantallas Móviles (< 768px)
- Header visible con menu-button
- Menu lateral se abre/cierra al hacer clic en menu-button
- Comportamiento normal sin cambios

### ✅ Pantallas Tablet (768px - 992px)
- Header visible con menu-button
- Menu lateral se abre/cierra al hacer clic en menu-button
- **ANTES:** En algunos módulos el header se ocultaba
- **AHORA:** Header siempre visible

### ✅ Pantallas Desktop (≥ 993px)
- Header visible con menu-button
- Menu lateral se abre/cierra al hacer clic en menu-button
- **ANTES:** Menu-button desaparecía por el split-pane y algunos headers estaban ocultos
- **AHORA:** Menu-button y header siempre visibles

---

## Archivos Modificados

1. ✅ `front-end/src/app/app.component.html` - Agregado `when="false"` al split-pane
2. ✅ `front-end/src/app/pages/export/export.page.scss` - Eliminado media query que ocultaba header
3. ✅ `front-end/src/app/pages/profile/profile.page.scss` - Eliminado media query + Agregado estilos de header
4. ✅ `front-end/src/app/pages/language/language.page.scss` - Eliminado media query + Agregado estilos de header

---

## Testing

Para probar los cambios:

1. **Abrir la app en diferentes resoluciones:**
   - Mobile: < 768px
   - Tablet: 768px - 992px
   - Desktop: ≥ 993px

2. **Verificar en cada módulo:**
   - Main (Receipts)
   - Export
   - Profile
   - Language

3. **Comprobar que:**
   - ✅ El header es visible en todas las resoluciones
   - ✅ El menu-button es visible en todas las resoluciones
   - ✅ El menu lateral se abre/cierra correctamente
   - ✅ Los estilos del header son consistentes (fondo azul, texto blanco)

---

## Notas Técnicas

### ion-split-pane
El `ion-split-pane` tiene un comportamiento por defecto:
- Oculta el menu-button en breakpoint `md` (≥992px)
- Muestra el menú lateral de forma permanente en pantallas grandes
- Al usar `when="false"`, este comportamiento se desactiva completamente

### Media Queries
Los media queries que ocultaban headers fueron agregados probablemente con la intención de:
- Aprovechar más espacio vertical en pantallas grandes
- Asumir que el split-pane mantendría el menú siempre visible

Sin embargo, esto causaba:
- ❌ Pérdida de navegación si el menu no estaba visible
- ❌ Inconsistencia en la experiencia de usuario
- ❌ Confusión al no tener forma de abrir el menu

### Alternativa Considerada
En lugar de `when="false"`, se podría usar:
```html
<ion-split-pane contentId="main-content" when="(min-width: 1920px)">
```
Esto mantendría el split-pane activo solo en pantallas muy grandes (Full HD+), pero se optó por `when="false"` para mantener el menu-button visible en todas las resoluciones por consistencia.

---

## Fecha
2025-10-15

## Estado
✅ **COMPLETADO** - Cambios implementados y sin errores de compilación
⏳ **PENDIENTE** - Testing en navegador en diferentes resoluciones
⏳ **PENDIENTE** - Commit de cambios
