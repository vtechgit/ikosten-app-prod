# Social Login Loading Indicator

## Problema Identificado

Después de optimizar el login con Google y Apple para que no bloquearan con la llamada a RevenueCat, se identificó que había un gap de 2-4 segundos entre:
1. Cuando el plugin de autenticación (Firebase) completa
2. Cuando el backend procesa la autenticación
3. Cuando la app navega a `/customer/trips`

Durante este período, el usuario veía una pantalla estática sin feedback visual de que algo estaba pasando.

## Solución Implementada

### 1. Loading Overlay Visual

Se agregó un overlay de carga con spinner y mensaje dinámico que se muestra durante todo el flujo de autenticación social:

**Archivo**: `sig-in.component.html`
```html
<!-- Loading Overlay for Social Login -->
<div class="loading-overlay" *ngIf="isLoading && (isLoginGoogle || isLoginApple)">
  <div class="loading-content">
    <ion-spinner name="crescent" color="primary"></ion-spinner>
    <p class="loading-message">{{ loadingMessage | translate }}</p>
  </div>
</div>
```

**Archivo**: `sig-in.component.scss`
- Overlay con backdrop blur para mejor UX
- Spinner centrado con animación
- Mensaje con animación pulse para feedback continuo
- z-index 9999 para estar sobre todo el contenido

### 2. Gestión de Estado de Loading

**Archivo**: `sig-in.component.ts`

#### Nueva Propiedad
```typescript
loadingMessage: string = 'titles.modules.login.loading-message';
```

#### Método loginGooglev2()
```typescript
async loginGooglev2() {
  try {
    this.isLoading = true;
    this.loadingMessage = 'titles.modules.login.authenticating-google';
    
    // ... autenticación con Firebase ...
    
    if (result && result.user) {
      this.loadingMessage = 'titles.modules.login.processing-authentication';
      await this.handleGoogleLoginSuccess(result.user);
    }
  } catch (error) {
    this.handleLoginError(...);
  }
  // NO HAY finally block que resetee isLoading
}
```

#### Método loginApplev2()
```typescript
async loginApplev2() {
  this.isLoading = true;
  this.loadingMessage = 'titles.modules.login.authenticating-apple';
  
  try {
    // ... autenticación con Firebase ...
    
    if (result && result.user) {
      this.loadingMessage = 'titles.modules.login.processing-authentication';
      await this.handleAppleLoginSuccess(result.user);
    }
  } catch (error) {
    this.handleAppleLoginError(...);
  }
  // NO HAY finally block que resetee isLoading
}
```

#### Método navigateAfterLogin()
```typescript
private navigateAfterLogin() {
  // Mantener isLoading = true hasta que navegue
  this.loadingMessage = 'titles.modules.login.redirecting';
  
  // ... lógica de onboarding checks ...
  
  // isLoading permanece true hasta window.location.href
  window.location.href = '/customer/trips';
  // La recarga de página limpia el componente
}
```

### 3. Mensajes de Loading por Etapa

Se agregaron traducciones para diferentes etapas del proceso:

**Español** (`es.json`):
```json
"titles.modules.login.loading-message": "Iniciando sesión...",
"titles.modules.login.authenticating-google": "Autenticando con Google...",
"titles.modules.login.authenticating-apple": "Autenticando con Apple...",
"titles.modules.login.processing-authentication": "Procesando autenticación...",
"titles.modules.login.redirecting": "Redirigiendo..."
```

**Inglés** (`en.json`):
```json
"titles.modules.login.loading-message": "Signing in...",
"titles.modules.login.authenticating-google": "Authenticating with Google...",
"titles.modules.login.authenticating-apple": "Authenticating with Apple...",
"titles.modules.login.processing-authentication": "Processing authentication...",
"titles.modules.login.redirecting": "Redirecting..."
```

## Flujo Completo

### Google Login:
1. Usuario hace clic en "Iniciar sesión con Google"
2. Usuario ingresa país y teléfono
3. Usuario hace clic en "Continuar"
4. `loginGooglev2()` se ejecuta:
   - ✅ `isLoading = true`
   - ✅ Mensaje: "Autenticando con Google..."
   - ✅ Overlay visible con spinner
5. Plugin Firebase procesa autenticación
6. Mensaje cambia a: "Procesando autenticación..."
7. `handleGoogleLoginSuccess()` llama a backend
8. `navigateAfterLogin()` se ejecuta:
   - ✅ Mensaje: "Redirigiendo..."
   - ✅ Loading sigue visible
9. `window.location.href` navega (recarga página)
10. ✅ Overlay desaparece con la recarga

### Apple Login:
(Mismo flujo que Google, pero con mensajes específicos de Apple)

## Mejoras de UX

### Antes:
- ❌ Usuario veía pantalla estática por 2-4 segundos
- ❌ Sin feedback de que algo estaba pasando
- ❌ Sensación de que la app se había congelado
- ❌ Usuario podía hacer clic múltiples veces

### Después:
- ✅ Feedback visual continuo durante todo el proceso
- ✅ Mensajes descriptivos de cada etapa
- ✅ Overlay previene interacciones múltiples
- ✅ Animación pulse da sensación de progreso
- ✅ Blur backdrop mejora la percepción visual
- ✅ Loading visible desde autenticación hasta navegación

## Beneficios Técnicos

1. **Sin Bloqueos**: El loading es visual, no bloquea el proceso asíncrono
2. **Estado Consistente**: `isLoading` permanece true durante todo el flujo
3. **No hay Flicker**: No hay momentos donde el loading desaparezca prematuramente
4. **Reutilizable**: Misma estructura para Google y Apple
5. **Internacionalizado**: Mensajes traducidos en todos los idiomas

## Archivos Modificados

1. `front-end/src/app/components/sig-in/sig-in.component.html`
2. `front-end/src/app/components/sig-in/sig-in.component.scss`
3. `front-end/src/app/components/sig-in/sig-in.component.ts`
4. `front-end/i18n/es.json`
5. `front-end/i18n/en.json`

## Testing

Para probar en dispositivo real:
1. Login con Google desde iOS/Android
2. Verificar que el overlay aparece inmediatamente
3. Verificar que los mensajes cambian según la etapa
4. Verificar que el loading permanece visible hasta la navegación
5. Repetir con Apple Sign In en iOS

## Notas

- El loading NO se resetea en `navigateAfterLogin()` porque `window.location.href` recarga la página de todas formas
- Se eliminó el `finally` block de `loginApplev2()` que reseteaba el loading prematuramente
- Los errores SÍ resetean `isLoading = false` correctamente en `handleLoginError()` y `handleAppleLoginError()`
