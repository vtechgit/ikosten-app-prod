# Loading Message para Recibos

## Cambios Implementados

Se agregó un mensaje de loading con spinner animado que se muestra mientras se cargan los recibos del usuario en el main component.

### **1. HTML (main.page.html)**

Se agregó una nueva sección de loading que aparece cuando `isLoadingReceipts = true`:

```html
<!-- Loading Receipts -->
<div class="loading-section" *ngIf="isLoadingReceipts">
  <div class="loading-content">
    <ion-spinner name="crescent" color="primary"></ion-spinner>
    <p class="loading-text">{{ 'loadings.loading-receipts' | translate }}</p>
  </div>
</div>
```

**Ubicación:** Entre el selector de país y la sección de recibos.

**Modificación adicional:** Se agregó `!isLoadingReceipts` a la condición de la sección de recibos para que no se muestre mientras está cargando:

```html
<!-- Antes -->
<div class="receipts-section" *ngIf="currentCountryData">

<!-- Después -->
<div class="receipts-section" *ngIf="currentCountryData && !isLoadingReceipts">
```

### **2. SCSS (main.page.scss)**

Se agregaron estilos para el loading section:

```scss
.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  margin: 2rem 1rem;
  min-height: 300px;
  
  .loading-content {
    text-align: center;
    animation: fadeIn 0.3s ease-in;
    
    ion-spinner {
      width: 48px;
      height: 48px;
      --color: var(--ion-color-primary);
      margin-bottom: 1rem;
    }
    
    .loading-text {
      font-size: 1rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 500;
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}
```

**Características:**
- ✅ Centrado vertical y horizontal
- ✅ Spinner de 48x48px con color primario
- ✅ Texto con animación de pulso (pulse)
- ✅ Contenedor con animación de fadeIn
- ✅ Altura mínima de 300px para evitar saltos visuales

Se agregó también la animación `fadeIn`:

```scss
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### **3. Variable Existente (main.page.ts)**

La variable `isLoadingReceipts` ya existía en el componente:

```typescript
isLoadingReceipts: boolean = true; // Indicador de carga inicial
```

**Se actualiza en:**
- `ngOnInit()`: Se pone en `true` al iniciar
- `loadUserReceipts()`: Se pone en `true` cuando empieza a cargar
- Al recibir respuesta exitosa: Se pone en `false`
- Al recibir error: Se pone en `false`

### **4. Traducciones**

Ya existen traducciones en todos los idiomas:

**Español (es.json):**
```json
"loadings.loading-receipts": "Cargando recibos..."
```

**Inglés (en.json):**
```json
"loadings.loading-receipts": "Loading receipts..."
```

**Otros idiomas:**
- 🇵🇹 Portugués: "Carregando recibos..."
- 🇩🇪 Alemán: "Belege werden geladen..."
- 🇮🇹 Italiano: "Caricamento ricevute..."
- 🇯🇵 Japonés: "領収書を読み込んでいます..."
- 🇰🇷 Coreano: "영수증 로딩 중..."
- 🇸🇦 Árabe: "جار تحميل الإيصالات..."

## Comportamiento Visual

### **Flujo de Carga:**

1. **Usuario entra a la página**
   ```
   [Loading Section]
   ┌─────────────────────┐
   │                     │
   │    🔄 Spinner       │
   │  Cargando recibos.. │
   │                     │
   └─────────────────────┘
   ```

2. **Recibos cargados exitosamente**
   ```
   [Receipts Section]
   ┌─────────────────────┐
   │ País 1: México      │
   │  - Recibo A         │
   │  - Recibo B         │
   └─────────────────────┘
   ```

3. **Error al cargar (raro)**
   ```
   Loading desaparece
   Se muestra solo el selector de país
   ```

### **Animaciones:**

1. **Entrada del Loading:**
   - FadeIn (0.3s) - aparece suavemente

2. **Texto:**
   - Pulse (1.5s, infinito) - palpita sutilmente

3. **Spinner:**
   - Rotación nativa de Ionic

### **Estados Visuales:**

| Estado | isLoadingReceipts | currentCountryData | Qué se muestra |
|--------|-------------------|-------------------|----------------|
| Carga inicial | `true` | `undefined` | Loading + Selector país |
| Cargando | `true` | `exists` | Loading |
| Cargado | `false` | `exists` | Recibos |
| Error | `false` | `undefined` | Selector país |

## Responsive Design

**Desktop (> 768px):**
- Loading centrado con amplio espacio
- Spinner grande (48px)
- Texto legible (1rem)

**Tablet (480-768px):**
- Mismo diseño que desktop

**Móvil (< 480px):**
- Loading ajustado al ancho
- Spinner mantiene 48px
- Padding reducido para aprovechar espacio

## Casos de Uso

### **Caso 1: Primera vez del usuario**
```
1. Usuario hace login
2. Abre página de recibos
3. Ve loading mientras se cargan países y recibos
4. Aparecen los recibos organizados por país
```

### **Caso 2: Usuario regresa a la página**
```
1. Usuario ya tiene recibos
2. Navega a otra página y vuelve
3. Ve loading brevemente (si hay delay de red)
4. Aparecen sus recibos
```

### **Caso 3: Infinite scroll**
```
1. Usuario hace scroll hasta el final
2. Ve "Cargando más recibos..." (diferente texto)
3. Se cargan más recibos
4. Sigue haciendo scroll
```

## Archivos Modificados

1. ✅ `main.page.html` - Agregada sección de loading
2. ✅ `main.page.scss` - Estilos del loading + animación fadeIn
3. ✅ `main.page.ts` - No modificado (variable ya existía)

## Archivos de Traducción (Ya existentes)

- ✅ `i18n/es.json` - "Cargando recibos..."
- ✅ `i18n/en.json` - "Loading receipts..."
- ✅ `i18n/pt.json` - Traducción portuguesa
- ✅ `i18n/de.json` - Traducción alemana
- ✅ `i18n/it.json` - Traducción italiana
- ✅ `i18n/ja.json` - Traducción japonesa
- ✅ `i18n/ko.json` - Traducción coreana
- ✅ `i18n/ar.json` - Traducción árabe

## Testing

**Escenarios a probar:**

1. ✅ Cargar página por primera vez
2. ✅ Recargar página con recibos existentes
3. ✅ Simular red lenta (Chrome DevTools → Network → Slow 3G)
4. ✅ Verificar animaciones en diferentes dispositivos
5. ✅ Cambiar idioma y verificar traducción
6. ✅ Verificar que no se muestren recibos mientras carga

**Comandos para testing:**

```powershell
# Modo desarrollo
cd front-end
ionic serve

# Producción
ionic build --prod
ionic cap sync android
```

## Mejoras Futuras (Opcional)

1. **Skeleton Screen**: Reemplazar spinner con placeholders de recibos
2. **Progressive Loading**: Mostrar recibos a medida que llegan
3. **Cache**: Guardar recibos en localStorage para carga instantánea
4. **Error State**: Mensaje específico cuando falla la carga
5. **Retry Button**: Botón para reintentar si falla

## Notas Técnicas

- **Performance**: Loading no afecta rendimiento, solo CSS y un spinner nativo
- **Accesibilidad**: Spinner tiene role="progressbar" implícito de Ionic
- **SEO**: No aplica (página protegida con login)
- **Compatibilidad**: Funciona en todos los navegadores (CSS básico + Ionic)
