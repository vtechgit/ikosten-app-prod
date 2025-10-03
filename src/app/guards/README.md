# Guards de Autenticación JWT

Este archivo documenta los guards implementados para el sistema de autenticación JWT de la aplicación.

## Guards Disponibles

### 1. `notLoggedGuard`
**Propósito**: Proteger rutas que requieren autenticación.
**Comportamiento**: 
- ✅ Permite acceso si el usuario está autenticado
- ❌ Redirige a login si el usuario NO está autenticado
**Uso**: Rutas de área privada (`/customer/*`)

### 2. `isLoggedGuard`
**Propósito**: Proteger rutas que solo deben ver usuarios NO autenticados.
**Comportamiento**:
- ✅ Permite acceso si el usuario NO está autenticado
- ❌ Redirige al área principal si el usuario YA está autenticado
**Uso**: Rutas de autenticación (`/auth/*`)

### 3. `adminGuard`
**Propósito**: Proteger rutas que solo pueden acceder administradores.
**Comportamiento**:
- ✅ Permite acceso si el usuario es administrador (role = 0)
- ❌ Redirige a login si no está autenticado
- ❌ Redirige a área usuario si no es administrador
**Uso**: Rutas administrativas (`/admin/*`)

### 4. `managerGuard`
**Propósito**: Proteger rutas que pueden acceder managers y administradores.
**Comportamiento**:
- ✅ Permite acceso si el usuario es manager o admin (role = 0 o 1)
- ❌ Redirige a login si no está autenticado
- ❌ Redirige a área usuario si no tiene permisos
**Uso**: Rutas de gestión (`/management/*`)

## Implementación Actual

### Rutas Protegidas

```typescript
// app-routing.module.ts
{
  path: '',
  loadChildren: () => import('./pages/pages.module'),
  canActivate: [notLoggedGuard] // Área principal protegida
},
{
  path: 'auth',
  loadChildren: () => import('./auth/auth.module'),
  canActivate: [isLoggedGuard] // Solo usuarios no autenticados
}
```

### Características JWT

- **Tokens JWT**: Los guards utilizan `AuthService.isLoggedIn()` que verifica la validez del JWT token
- **Refresh automático**: Los tokens se renuevan automáticamente en el interceptor
- **Roles de usuario**: Los guards verifican roles usando `AuthService.isAdmin()` y `AuthService.isManager()`
- **Redirección inteligente**: Los guards redirigen según el contexto y rol del usuario

### Logging y Debug

Todos los guards incluyen logging detallado para facilitar el debugging:
- Estado de autenticación
- Usuario actual
- Decisiones de acceso
- Rutas de redirección

## Importación

```typescript
import { 
  notLoggedGuard, 
  isLoggedGuard, 
  adminGuard, 
  managerGuard 
} from '../guards';
```