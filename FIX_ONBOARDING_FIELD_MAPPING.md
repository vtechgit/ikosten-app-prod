# Fix: Redirección al Onboarding Después del Pago - Mapeo de Campos

## 🐛 Problema Crítico Identificado

Después de realizar un pago exitoso (PayPal o RevenueCat), los usuarios eran **redirigidos incorrectamente al onboarding** aunque ya lo hubieran completado previamente.

## 🔍 Causa Raíz

### Problema de Mapeo de Campos del Servidor

El servidor (backend) devuelve el campo `lead_onboarding_completed` pero el código del front-end buscaba `onboarding_completed` (sin el prefijo `lead_`).

**Flujo del problema:**

```typescript
// 1. Después del pago, se obtienen los datos del usuario desde el servidor
this.api.read('leads/'+this.userSession._id).subscribe(updatedUserResponse => {
  const updatedUserData = updatedUserResponse['body'];
  // Servidor devuelve: { _id: "...", lead_email: "...", lead_onboarding_completed: true, ... }
  
  // 2. ❌ PROBLEMA: Se verificaba un campo que NO existe
  if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
    updatedUserData.onboarding_completed = true; // Se establecía en memoria
  }
  
  // 3. ❌ PROBLEMA: Se guardaba updatedUserData SIN el campo onboarding_completed
  localStorage.setItem('userSession', JSON.stringify(updatedUserData));
  // El objeto guardado NO tiene onboarding_completed, solo lead_onboarding_completed
  
  // 4. ✅ AuthService recibía el valor correcto
  const user: any = {
    onboarding_completed: updatedUserData.onboarding_completed !== false // true
  };
  this.authService.updateCurrentUser(user);
});

// 5. ❌ PROBLEMA: Al navegar a /customer/trips
// El onboardingGuard lee desde localStorage o AuthService
// Si lee desde localStorage.userSession, encuentra lead_onboarding_completed pero no onboarding_completed
// Algunos guards o componentes buscan onboarding_completed → undefined → Redirige a /onboarding
```

### Inconsistencia de Nombres de Campos

**Backend (modelo Lead):**
```javascript
{
  lead_name: String,
  lead_email: String,
  lead_role: Number,
  lead_onboarding_completed: Boolean, // ✅ Con prefijo lead_
  // ...
}
```

**Front-end (esperado por AuthService):**
```typescript
interface User {
  name: string,
  email: string,
  role: number,
  onboarding_completed?: boolean, // ❌ Sin prefijo lead_
}
```

**localStorage.userSession:**
```json
{
  "_id": "...",
  "lead_name": "...",
  "lead_email": "...",
  "lead_role": 3,
  "lead_onboarding_completed": true
}
```

## ✅ Solución Implementada

### 1. Mapeo Explícito de Campos

Ahora se mapea explícitamente `lead_onboarding_completed` a `onboarding_completed` antes de guardar en localStorage:

```typescript
// ✅ Mapear lead_onboarding_completed a onboarding_completed para consistencia
if (updatedUserData.hasOwnProperty('lead_onboarding_completed')) {
  updatedUserData.onboarding_completed = updatedUserData.lead_onboarding_completed;
} else if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
  // Si no existe ninguno de los dos campos, asumir que está completado (usuario existente)
  updatedUserData.onboarding_completed = true;
  updatedUserData.lead_onboarding_completed = true;
}

// Ahora updatedUserData tiene AMBOS campos
localStorage.setItem('userSession', JSON.stringify(updatedUserData));
```

### 2. Uso del Campo Correcto en AuthService

Al actualizar el AuthService, ahora se usa el campo correcto del servidor:

```typescript
const user: any = {
  id: updatedUserData._id || updatedUserData.id,
  email: updatedUserData.lead_email || updatedUserData.email,
  name: updatedUserData.lead_name || updatedUserData.name,
  role: updatedUserData.lead_role || updatedUserData.role,
  company_id: updatedUserData.lead_company_id || updatedUserData.company_id,
  category: updatedUserData.lead_category || updatedUserData.category,
  onboarding_completed: updatedUserData.lead_onboarding_completed !== false // ✅ Usa lead_onboarding_completed
};

this.authService.updateCurrentUser(user);
```

### 3. Aplicado en Todos los Flujos de Pago

La corrección se aplicó en:

1. **RevenueCat (In-App Purchases)** - `membership-modal.component.ts`
2. **PayPal Web** - `membership-modal.component.ts`
3. **PayPal Legacy** - `memberships.page.ts`
4. **Bloques de error/fallback** en todos los flujos

## 📁 Archivos Modificados

### 1. `front-end/src/app/pages/memberships/memberships.page.ts`

**Líneas ~312-338**: Callback de lectura exitosa del usuario
**Líneas ~340-365**: Error handler (fallback)

**Cambios principales:**
- Mapeo de `lead_onboarding_completed` → `onboarding_completed`
- Almacenamiento de ambos campos en localStorage
- Uso de `lead_onboarding_completed` para AuthService

### 2. `front-end/src/app/components/membership-modal/membership-modal.component.ts`

**Líneas ~271-298**: Flujo de In-App Purchases (RevenueCat)
**Líneas ~391-413**: Flujo de PayPal Web

**Cambios principales:**
- Mapeo de `lead_onboarding_completed` → `onboarding_completed`
- Almacenamiento de ambos campos en localStorage
- Uso correcto del campo del servidor

### 3. `front-end/docs/FIX_ONBOARDING_REDIRECT_AFTER_PURCHASE.md`

**Actualizado**: Documentación completa del problema y solución con el nuevo descubrimiento del mapeo de campos.

## 🎯 Resultado Esperado

Ahora cuando un usuario completa un pago:

1. ✅ Se obtienen los datos actualizados del servidor
2. ✅ Se mapea `lead_onboarding_completed` a `onboarding_completed`
3. ✅ Se guardan AMBOS campos en localStorage para compatibilidad
4. ✅ Se actualiza AuthService con los datos correctos
5. ✅ Al navegar a `/customer/trips`, el guard encuentra `onboarding_completed = true`
6. ✅ El usuario **NO** es redirigido al onboarding

## 🧪 Casos de Prueba

### Escenario 1: Usuario Nuevo con Onboarding Completado
```
1. Usuario se registra
2. Completa onboarding (lead_onboarding_completed = true)
3. Compra membresía
4. ✅ Redirige a /customer/trips (NO a /onboarding)
```

### Escenario 2: Usuario Existente Sin Campo Onboarding
```
1. Usuario existente (lead_onboarding_completed no existe en BD)
2. Compra membresía
3. Sistema asume onboarding_completed = true
4. ✅ Redirige a /customer/trips (NO a /onboarding)
```

### Escenario 3: Usuario Nuevo Sin Completar Onboarding
```
1. Usuario se registra
2. NO completa onboarding (lead_onboarding_completed = false)
3. Compra membresía
4. ✅ Redirige a /onboarding (correcto)
```

## 🔄 Compatibilidad

El sistema ahora mantiene **ambos campos** en localStorage:
- `lead_onboarding_completed`: Para compatibilidad con código legacy que espera campos con prefijo `lead_`
- `onboarding_completed`: Para compatibilidad con AuthService y guards que esperan el campo sin prefijo

Esto asegura que cualquier parte del código que busque cualquiera de los dos campos funcionará correctamente.

## 📝 Notas Importantes

1. **No rompe código existente**: Al mantener ambos campos, el código legacy sigue funcionando
2. **Migración automática**: Los usuarios existentes con `lead_onboarding_completed` obtendrán automáticamente `onboarding_completed` en su próximo inicio de sesión
3. **Default seguro**: Si ningún campo existe, se asume `true` (usuario existente que puede haber completado el onboarding antes de que existiera el campo)

## 🚀 Despliegue

Este fix debe desplegarse junto con los cambios de backend que corrigieron el campo `lead_role` (bug donde se usaba `user.user_rol` en lugar de `user.lead_role`).

Ambos bugs estaban causando problemas similares de redirección incorrecta después de eventos de webhook.
