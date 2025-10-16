# Debug: Problema de Login y Sesión

## Problema Identificado
El login no está guardando la sesión en localStorage después de una autenticación exitosa.

## Cambios Implementados

### 1. Componente `sig-in.component.ts`
- ✅ Cambiado de `this.api.login()` a `this.authService.login()`
- ✅ Removido `async` innecesario del método `doLoginEmail()`
- ✅ Agregado logging detallado para debugging
- ✅ Agregado llamada a `debugAuthState()` después del login exitoso

### 2. AuthService 
- ✅ Agregado logging detallado en `login()` method
- ✅ Agregado logging detallado en `setAuthData()` method
- ✅ Mejorada la inicialización del constructor con logging
- ✅ Agregado método `debugAuthState()` para diagnosticar problemas
- ✅ Agregado import de `environment`

### 3. ApiService
- ✅ Agregado logging detallado en `setToken()`
- ✅ Agregado logging detallado en `setRefreshToken()`
- ✅ Agregado logging detallado en `setUserData()`
- ✅ Verificaciones de guardado en localStorage

## Flujo de Login Correcto

```
1. Usuario ingresa credenciales → sig-in.component.ts::doLoginEmail()
2. Llama a → authService.login()
3. Llama a → apiService.login() → Backend /leads/auth
4. Backend devuelve → { status: true, data: { user: {...}, tokens: {...} } }
5. AuthService procesa respuesta → setAuthData()
6. ApiService guarda → setToken(), setRefreshToken(), setUserData()
7. Datos guardados en localStorage con las claves:
   - 'ikosten_access_token'
   - 'ikosten_refresh_token' 
   - 'ikosten_user_data'
```

## Verificación de Backend

✅ Backend endpoint `/leads/auth` está actualizado para JWT
✅ Backend usa `AuthService.generateAuthResponse(user)` 
✅ Backend devuelve formato correcto: `{ user: {...}, tokens: {...} }`

## Posibles Causas del Problema

### 1. **Error de Formato de Respuesta**
- El frontend espera un formato específico
- Verificar logs de la respuesta del backend

### 2. **Problemas de CORS o HTTP**
- Verificar que la respuesta llegue correctamente
- Verificar headers y status codes

### 3. **Problemas de Timing**
- Observable no completándose correctamente
- Async/await mal manejado

### 4. **Problemas de localStorage**
- Restricciones del navegador
- Modo incógnito o políticas de privacidad

### 5. **Error en el AuthService**
- Mapping incorrecto de la respuesta
- Error en setAuthData()

## Para Debugging

1. **Abrir DevTools** → Console
2. **Intentar login** y revisar logs detallados:
   ```
   🔑 doLoginEmail: Iniciando login con email
   📧 Email: usuario@email.com
   🔐 AuthService.login iniciado
   📥 AuthService.login - Respuesta recibida: {...}
   💾 AuthService.setAuthData iniciado
   🔑 ApiService.setToken llamado
   ✅ Token guardado en localStorage
   🛠️ DEBUG AUTH STATE: {...}
   ```

3. **Verificar localStorage** manualmente:
   ```javascript
   localStorage.getItem('ikosten_access_token')
   localStorage.getItem('ikosten_refresh_token') 
   localStorage.getItem('ikosten_user_data')
   ```

## Próximos Pasos

1. **Ejecutar el frontend** y probar login
2. **Revisar logs** en console para identificar dónde falla
3. **Verificar localStorage** después del login
4. **Verificar respuesta del backend** está en formato correcto
5. **Ajustar según los resultados** de los logs

## Comandos de Verificación

```bash
# Frontend
cd front-end
npm start

# Backend 
cd back-end
npm run dev
```