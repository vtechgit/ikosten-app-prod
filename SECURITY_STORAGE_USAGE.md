# 📊 Uso de Variables de Seguridad (environment.security)

## 🔑 Variables Definidas en `environment.ts`

```typescript
security: {
  tokenStorageKey: 'ikosten_access_token',           // Access Token (JWT)
  refreshTokenStorageKey: 'ikosten_refresh_token',   // Refresh Token
  userStorageKey: 'ikosten_user_data'                // Datos del usuario
}
```

---

## 📍 UBICACIONES DE USO

### 1️⃣ **ApiService** (`src/app/services/api.service.ts`)
**Uso principal:** Gestión de tokens y datos de usuario en localStorage

#### Métodos que usan `tokenStorageKey`:
```typescript
// Línea 48-50: Guardar access token
setToken(token: string): void {
  console.log('🔑 Storage key:', environment.security.tokenStorageKey);
  localStorage.setItem(environment.security.tokenStorageKey, token);
}

// Línea 57: Leer access token con verificación
const savedToken = localStorage.getItem(environment.security.tokenStorageKey);

// Línea 62: Obtener access token
getToken(): string | null {
  return localStorage.getItem(environment.security.tokenStorageKey);
}
```

#### Métodos que usan `refreshTokenStorageKey`:
```typescript
// Línea 68-70: Guardar refresh token
setRefreshToken(refreshToken: string): void {
  console.log('🔄 Storage key:', environment.security.refreshTokenStorageKey);
  localStorage.setItem(environment.security.refreshTokenStorageKey, refreshToken);
}

// Línea 74: Leer refresh token con verificación
const savedToken = localStorage.getItem(environment.security.refreshTokenStorageKey);

// Línea 79: Obtener refresh token
getRefreshToken(): string | null {
  return localStorage.getItem(environment.security.refreshTokenStorageKey);
}
```

#### Métodos que usan `userStorageKey`:
```typescript
// Línea 85-87: Guardar datos de usuario
setUserData(userData: any): void {
  console.log('👤 Storage key:', environment.security.userStorageKey);
  localStorage.setItem(environment.security.userStorageKey, JSON.stringify(userData));
}

// Línea 91: Leer datos de usuario
const savedData = localStorage.getItem(environment.security.userStorageKey);

// Línea 95-97: Obtener datos de usuario
getUserData(): any {
  const userData = localStorage.getItem(environment.security.userStorageKey);
  return userData ? JSON.parse(userData) : null;
}

// Línea 101-104: Limpiar todos los datos (logout)
clearAuthData(): void {
  localStorage.removeItem(environment.security.tokenStorageKey);
  localStorage.removeItem(environment.security.refreshTokenStorageKey);
  localStorage.removeItem(environment.security.userStorageKey);
  this.isAuthenticatedSubject.next(false);
}
```

---

### 2️⃣ **AuthInterceptor** (`src/app/interceptors/auth.interceptor.ts`)
**Uso:** Interceptor HTTP para manejar autenticación automática y refresh de tokens

#### Métodos privados:
```typescript
// Línea 27-29: Obtener access token
private getToken(): string | null {
  return localStorage.getItem(environment.security.tokenStorageKey);
}

// Línea 31-33: Obtener refresh token
private getRefreshToken(): string | null {
  return localStorage.getItem(environment.security.refreshTokenStorageKey);
}

// Línea 35-37: Guardar access token
private setToken(token: string): void {
  localStorage.setItem(environment.security.tokenStorageKey, token);
}

// Línea 39-41: Guardar refresh token
private setRefreshToken(refreshToken: string): void {
  localStorage.setItem(environment.security.refreshTokenStorageKey, refreshToken);
}

// Línea 43-45: Guardar datos de usuario
private setUserData(userData: any): void {
  localStorage.setItem(environment.security.userStorageKey, JSON.stringify(userData));
}

// Línea 47-51: Limpiar todos los datos
private clearAuthData(): void {
  localStorage.removeItem(environment.security.tokenStorageKey);
  localStorage.removeItem(environment.security.refreshTokenStorageKey);
  localStorage.removeItem(environment.security.userStorageKey);
}
```

**Funcionalidad:** 
- Intercepta peticiones HTTP
- Agrega token automáticamente a headers
- Maneja errores 401 (no autorizado)
- Renueva tokens automáticamente con refresh token

---

### 3️⃣ **SignUpComponent** (`src/app/components/sign-up/sign-up.component.ts`)
**Uso:** Guardar tokens después de registro exitoso

```typescript
// Línea 133-134: Guardar tokens después de registro
localStorage.setItem('ikosten_access_token', responseData.tokens.accessToken);
localStorage.setItem('ikosten_refresh_token', responseData.tokens.refreshToken);

// Línea 148-149: Guardar datos de usuario
// Guardar en formato User (ikosten_user_data) para AuthService
localStorage.setItem('ikosten_user_data', JSON.stringify(userData));
```

⚠️ **NOTA:** Este componente usa strings hardcoded en lugar de `environment.security.*`  
**RECOMENDACIÓN:** Debería usar ApiService.setToken() para consistencia

---

### 4️⃣ **SignInComponent** (`src/app/components/sig-in/sig-in.component.ts`)
**Uso:** Leer datos de usuario durante login/debugging

```typescript
// Línea 614: Leer datos de usuario
const storedUser = localStorage.getItem('ikosten_user_data');

// Línea 624: Log de advertencia
console.warn('⚠️ No hay datos en localStorage con key "ikosten_user_data"');
```

⚠️ **NOTA:** También usa strings hardcoded  
**RECOMENDACIÓN:** Debería usar ApiService.getUserData()

---

## 📊 RESUMEN DE USO

### Por Archivo:
| Archivo | Propósito | Usa Variables |
|---------|-----------|---------------|
| **api.service.ts** | Gestión central de auth | ✅ `environment.security.*` |
| **auth.interceptor.ts** | Interceptor HTTP | ✅ `environment.security.*` |
| **sign-up.component.ts** | Registro de usuario | ❌ Strings hardcoded |
| **sign-in.component.ts** | Login/debugging | ❌ Strings hardcoded |
| **auth.service.ts** | Lógica de autenticación | ✅ Usa ApiService (indirecto) |

### Por Variable:
| Variable | Usos Directos | Archivos |
|----------|---------------|----------|
| `tokenStorageKey` | 8 usos | api.service.ts, auth.interceptor.ts |
| `refreshTokenStorageKey` | 8 usos | api.service.ts, auth.interceptor.ts |
| `userStorageKey` | 8 usos | api.service.ts, auth.interceptor.ts |
| Strings hardcoded | 5 usos | sign-up.component.ts, sig-in.component.ts |

---

## 🔄 FLUJO DE AUTENTICACIÓN

### 1. **Login/Registro:**
```
Usuario → SignIn/SignUp Component
         → ApiService.login() / register()
         → Backend responde con tokens
         → ApiService.setToken(accessToken)
         → ApiService.setRefreshToken(refreshToken)
         → ApiService.setUserData(userData)
         → localStorage (usando environment.security.*)
```

### 2. **Peticiones HTTP:**
```
Componente → HTTP Request
           → AuthInterceptor intercepta
           → Lee token: localStorage.getItem(environment.security.tokenStorageKey)
           → Agrega header: Authorization: Bearer <token>
           → Envía al backend
```

### 3. **Token Expirado (401):**
```
Backend responde 401
→ AuthInterceptor detecta error
→ Lee refresh token: environment.security.refreshTokenStorageKey
→ Llama a /auth/refresh
→ Recibe nuevo access token
→ Guarda: environment.security.tokenStorageKey
→ Reintenta request original
```

### 4. **Logout:**
```
Usuario → Logout
       → AuthService.logout()
       → ApiService.clearAuthData()
       → Elimina todos los items de localStorage
       → Redirige a /auth/login
```

---

## ⚠️ PROBLEMAS DETECTADOS

### 1. **Inconsistencia en SignUp/SignIn:**
**Problema:** Usan strings hardcoded en lugar de `environment.security.*`

**Código actual (sign-up.component.ts):**
```typescript
localStorage.setItem('ikosten_access_token', responseData.tokens.accessToken);
localStorage.setItem('ikosten_refresh_token', responseData.tokens.refreshToken);
localStorage.setItem('ikosten_user_data', JSON.stringify(userData));
```

**Debería ser:**
```typescript
this.apiService.setToken(responseData.tokens.accessToken);
this.apiService.setRefreshToken(responseData.tokens.refreshToken);
this.apiService.setUserData(userData);
```

**Impacto:**
- ✅ Funciona actualmente porque los strings coinciden
- ⚠️ Si cambias las keys en `environment.ts`, estos componentes fallarán
- ⚠️ No hay consistencia en el código

**Ubicaciones a corregir:**
- `sign-up.component.ts` líneas 133-134, 149
- `sig-in.component.ts` líneas 614, 624

---

## ✅ RECOMENDACIONES

### 1. **Centralizar TODO el acceso a localStorage:**
```typescript
// ❌ MAL - Acceso directo
localStorage.setItem('ikosten_access_token', token);

// ✅ BIEN - A través de ApiService
this.apiService.setToken(token);
```

### 2. **Nunca usar strings hardcoded:**
```typescript
// ❌ MAL
const user = localStorage.getItem('ikosten_user_data');

// ✅ BIEN
const user = this.apiService.getUserData();
```

### 3. **Mantener environment.ts como única fuente de verdad:**
- Si necesitas cambiar las keys, solo editar `environment.ts`
- Todo el código usa `environment.security.*`
- No hay strings duplicados en el código

---

## 🔒 SEGURIDAD

### Storage Keys Actuales:
```
ikosten_access_token      → JWT con expiración 24h
ikosten_refresh_token     → JWT con expiración 365d
ikosten_user_data         → JSON con datos básicos del usuario
```

### Datos Almacenados:

**Access Token (JWT):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": 3,
  "company_id": "507f1f77bcf86cd799439012",
  "exp": 1699999999,
  "iat": 1699913599
}
```

**User Data:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": 3,
  "company_id": "507f1f77bcf86cd799439012",
  "category": "travel",
  "onboarding_completed": true
}
```

---

## 📝 CONCLUSIÓN

Las variables de `environment.security` están **bien implementadas** en los servicios principales (ApiService, AuthInterceptor), pero hay **inconsistencias** en algunos componentes (SignUp, SignIn) que usan strings hardcoded.

**Archivos principales que las usan correctamente:**
1. ✅ `api.service.ts` - Gestión central
2. ✅ `auth.interceptor.ts` - Interceptor HTTP
3. ✅ `auth.service.ts` - Usa ApiService (indirecto)

**Archivos que necesitan corrección:**
1. ⚠️ `sign-up.component.ts` - Líneas 133-134, 149
2. ⚠️ `sig-in.component.ts` - Líneas 614, 624

**Impacto actual:** ✅ Funciona correctamente  
**Riesgo futuro:** ⚠️ Si cambias las keys, algunos componentes fallarán  
**Solución:** Centralizar TODO el acceso a través de ApiService

---

**Creado:** 2025-10-12  
**Autor:** GitHub Copilot  
**Propósito:** Documentación de uso de variables de seguridad
