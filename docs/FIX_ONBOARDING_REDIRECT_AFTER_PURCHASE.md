# Fix: Redirección Automática al Onboarding Después de Comprar Membresía

## 🔍 Problema Identificado

Después de comprar una membresía (PayPal o Google Play), el usuario era **redirigido automáticamente al onboarding** aunque ya lo hubiera completado.

---

## 🔴 Causa Raíz

### Problema #1: Mapeo Incorrecto de Campos del Servidor (CRÍTICO - Nueva Corrección)

El servidor devuelve el campo `lead_onboarding_completed` pero el código en el front-end buscaba `onboarding_completed` (sin el prefijo `lead_`).

**Flujo problemático:**

```typescript
// memberships.page.ts línea 312
this.api.read('leads/'+this.userSession._id).subscribe(updatedUserResponse => {
  const updatedUserData = updatedUserResponse['body'];
  
  // ❌ ANTES: Verificaba onboarding_completed que NO existe en la respuesta
  if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
    updatedUserData.onboarding_completed = true; // Lo establecía en true
  }
  
  // ❌ PROBLEMA: Guardaba updatedUserData sin onboarding_completed
  localStorage.setItem('userSession', JSON.stringify(updatedUserData));
  
  // El servidor devuelve: { lead_onboarding_completed: true, ... }
  // Se guardaba en localStorage sin onboarding_completed
  // AuthService recibía el valor correcto pero localStorage no
});
```

**Resultado:**
1. Servidor devuelve `lead_onboarding_completed: false` (usuario nuevo) o `true` (usuario existente)
2. Código establece `onboarding_completed = true` en memoria
3. Pero guarda `updatedUserData` original sin `onboarding_completed` en localStorage
4. Al navegar a `/customer/trips`, el guard lee de localStorage
5. Como `onboarding_completed` no existe → undefined → Redirige a `/onboarding`

### Problema #2: Dos Sistemas de Almacenamiento de Usuario

La aplicación tiene **dos lugares diferentes** donde se guarda la información del usuario:

1. **`userSession`** (legacy) - localStorage key: `"userSession"`
2. **`ikosten_user_data`** (nuevo) - localStorage key: `environment.security.userStorageKey`

**El flujo problemático era:**

```typescript
// membership-modal.component.ts
// Solo actualizaba 'userSession' pero NO 'ikosten_user_data'
this.userSession.lead_role = membership.membership_role;
this.userSession.role = membership.membership_role;
localStorage.setItem('userSession', JSON.stringify(this.userSession)); // ❌ Solo legacy

// Llamaba AuthService pero con datos incorrectos
this.authService.updateCurrentUser(this.userSession); // ❌ userSession no tiene el formato User
```

**El guard onboardingGuard leía de AuthService:**

```typescript
// onboarding.guard.ts
const currentUser = authService.getCurrentUser(); // Lee de 'ikosten_user_data'

if (!currentUser?.onboarding_completed) { // ❌ undefined porque no se actualizó
    router.navigate(['/onboarding']); // Redirección forzada
    return false;
}
```

### Problema #2: Formato Incorrecto de User

`userSession` tiene formato de Lead (backend) con campos como:
- `lead_role`
- `lead_email`
- `lead_name`
- `_id`

Pero `AuthService` espera el interface `User`:
```typescript
interface User {
  id: string;        // No _id
  email: string;     // No lead_email
  name: string;      // No lead_name
  role: number;      // No lead_role
  onboarding_completed?: boolean; // ❌ No existía en userSession
}
```

### Problema #3: onboarding_completed No Se Mantenía

Al actualizar el rol después de comprar membresía, se perdía el campo `onboarding_completed`:

```typescript
// ❌ ANTES
this.userSession.lead_role = membership.membership_role;
this.userSession.role = membership.membership_role;
// onboarding_completed se perdía o quedaba undefined
```

---

## ✅ Solución Implementada

### 1. Mapear lead_onboarding_completed a onboarding_completed (NUEVA CORRECCIÓN)

```typescript
// ✅ DESPUÉS: Mapear correctamente el campo del servidor
if (updatedUserData.hasOwnProperty('lead_onboarding_completed')) {
  updatedUserData.onboarding_completed = updatedUserData.lead_onboarding_completed;
} else if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
  // Si no existe ninguno de los dos campos, asumir que está completado (usuario existente)
  updatedUserData.onboarding_completed = true;
  updatedUserData.lead_onboarding_completed = true;
}

// Ahora localStorage tendrá AMBOS campos para compatibilidad
localStorage.setItem('userSession', JSON.stringify(updatedUserData));

// AuthService usa lead_onboarding_completed que SÍ existe
const user: any = {
  id: updatedUserData._id || updatedUserData.id,
  email: updatedUserData.lead_email || updatedUserData.email,
  name: updatedUserData.lead_name || updatedUserData.name,
  role: updatedUserData.lead_role || updatedUserData.role,
  company_id: updatedUserData.lead_company_id || updatedUserData.company_id,
  category: updatedUserData.lead_category || updatedUserData.category,
  onboarding_completed: updatedUserData.lead_onboarding_completed !== false // ✅ Usa el campo correcto
};
```

### 2. Mapear Correctamente al Interface User

```typescript
// Crear estructura correcta de User para AuthService
const updatedUser: any = {
  id: this.userSession.id || this.userSession._id,
  email: this.userSession.email || this.userSession.lead_email,
  name: this.userSession.name || this.userSession.lead_name,
  role: membership.membership_role,
  company_id: this.userSession.company_id || this.userSession.lead_company_id,
  category: this.userSession.category || this.userSession.lead_category,
  onboarding_completed: this.userSession.onboarding_completed !== false // true si es undefined o true
};

// Actualizar AuthService con el formato correcto
this.authService.updateCurrentUser(updatedUser);
```

### 2. Actualizar Ambos Campos en Fallback (Error Handler)

```typescript
// En el bloque catch/error, también mapear correctamente
if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
  this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
} else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
  this.userSession.onboarding_completed = true;
  this.userSession.lead_onboarding_completed = true;
}

const user: any = {
  id: this.userSession._id || this.userSession.id,
  email: this.userSession.lead_email || this.userSession.email,
  name: this.userSession.lead_name || this.userSession.name,
  role: membership.membership_role,
  company_id: this.userSession.lead_company_id || this.userSession.company_id,
  category: this.userSession.lead_category || this.userSession.category,
  onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
};
```

### 3. Actualizar Ambos Storages

```typescript
// 1. Actualizar userSession (legacy)
localStorage.setItem('userSession', JSON.stringify(this.userSession));

// 2. AuthService actualiza ikosten_user_data automáticamente
this.authService.updateCurrentUser(updatedUser);
// Internamente llama: apiService.setUserData(userData)
// Que guarda en: localStorage[environment.security.userStorageKey]
```

---

## 📁 Archivos Modificados

### 1. `membership-modal.component.ts`

**Cambios en flujo de Google Play/App Store** (líneas ~271-298):
```typescript
// ✅ DESPUÉS
// Actualizar sesión local - IMPORTANTE: mapear lead_onboarding_completed
this.userSession.lead_role = membership.membership_role;
this.userSession.role = membership.membership_role;

// ✅ Mapear lead_onboarding_completed a onboarding_completed
if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
  this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
} else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
  this.userSession.onboarding_completed = true;
  this.userSession.lead_onboarding_completed = true;
}

localStorage.setItem('userSession', JSON.stringify(this.userSession));

const updatedUser: any = {
  id: this.userSession.id || this.userSession._id,
  email: this.userSession.email || this.userSession.lead_email,
  name: this.userSession.name || this.userSession.lead_name,
  role: membership.membership_role,
  company_id: this.userSession.company_id || this.userSession.lead_company_id,
  category: this.userSession.category || this.userSession.lead_category,
  onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
};

this.authService.updateCurrentUser(updatedUser);
```

**Cambios en flujo de PayPal** (líneas ~391-413):
```typescript
// ✅ Mapear lead_onboarding_completed a onboarding_completed
if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
  this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
} else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
  this.userSession.onboarding_completed = true;
  this.userSession.lead_onboarding_completed = true;
}
```

### 2. `memberships.page.ts`

**Cambios en el callback de actualización exitosa** (líneas ~312-338):
```typescript
this.api.read('leads/'+this.userSession._id).subscribe(updatedUserResponse => {
  if(updatedUserResponse['body']) {
    const updatedUserData = updatedUserResponse['body'];
    
    // ✅ Mapear lead_onboarding_completed a onboarding_completed para consistencia
    if (updatedUserData.hasOwnProperty('lead_onboarding_completed')) {
      updatedUserData.onboarding_completed = updatedUserData.lead_onboarding_completed;
    } else if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
      updatedUserData.onboarding_completed = true;
      updatedUserData.lead_onboarding_completed = true;
    }
    
    localStorage.setItem('userSession', JSON.stringify(updatedUserData));
    
    const user: any = {
      id: updatedUserData._id || updatedUserData.id,
      email: updatedUserData.lead_email || updatedUserData.email,
      name: updatedUserData.lead_name || updatedUserData.name,
      role: updatedUserData.lead_role || updatedUserData.role,
      company_id: updatedUserData.lead_company_id || updatedUserData.company_id,
      category: updatedUserData.lead_category || updatedUserData.category,
      onboarding_completed: updatedUserData.lead_onboarding_completed !== false
    };
    
    this.authService.updateCurrentUser(user);
  }
});
```

**Cambios en el error handler** (líneas ~340-365):
```typescript
}, error => {
  // ✅ Mapear lead_onboarding_completed si existe
  if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
    this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
  } else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
    this.userSession.onboarding_completed = true;
    this.userSession.lead_onboarding_completed = true;
  }
  
  const user: any = {
    id: this.userSession._id || this.userSession.id,
    email: this.userSession.lead_email || this.userSession.email,
    name: this.userSession.lead_name || this.userSession.name,
    role: membership.membership_role,
    company_id: this.userSession.lead_company_id || this.userSession.company_id,
    category: this.userSession.lead_category || this.userSession.category,
    onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
  };
  
  this.authService.updateCurrentUser(user);
});
```

// Asegurarse de que onboarding_completed se mantenga
if (!this.userSession.hasOwnProperty('onboarding_completed')) {
  this.userSession.onboarding_completed = true;
}

localStorage.setItem('userSession', JSON.stringify(this.userSession));

// Actualizar AuthService con la estructura correcta de User
const updatedUser: any = {
  id: this.userSession.id || this.userSession._id,
  email: this.userSession.email || this.userSession.lead_email,
  name: this.userSession.name || this.userSession.lead_name,
  role: membership.membership_role,
  company_id: this.userSession.company_id || this.userSession.lead_company_id,
  category: this.userSession.category || this.userSession.lead_category,
  onboarding_completed: this.userSession.onboarding_completed !== false
};

this.authService.updateCurrentUser(updatedUser);
```

**Cambios en flujo de PayPal** (líneas ~388-414):
- Misma lógica aplicada

### 2. `memberships.page.ts`

**Importaciones agregadas**:
```typescript
import { AuthService } from '../../services/auth.service';
```

**Constructor actualizado**:
```typescript
constructor(
    public api:ApiService,
    private authService: AuthService, // 🆕 Agregado
    private router:Router,
    // ...
```

**Actualización después de compra** (líneas ~305-360):
```typescript
// Después de obtener usuario actualizado del backend
const updatedUserData = updatedUserResponse['body'];

// Asegurarse de que onboarding_completed se mantenga
if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
  updatedUserData.onboarding_completed = true;
}

localStorage.setItem('userSession', JSON.stringify(updatedUserData));
this.userSession = updatedUserData;

// Actualizar AuthService con la estructura correcta de User
const user: any = {
  id: updatedUserData._id || updatedUserData.id,
  email: updatedUserData.lead_email || updatedUserData.email,
  name: updatedUserData.lead_name || updatedUserData.name,
  role: updatedUserData.lead_role || updatedUserData.role,
  company_id: updatedUserData.lead_company_id || updatedUserData.company_id,
  category: updatedUserData.lead_category || updatedUserData.category,
  onboarding_completed: updatedUserData.onboarding_completed !== false
};

this.authService.updateCurrentUser(user);
```

---

## 🧪 Testing

### Caso 1: Compra con Google Play
1. Usuario compra membresía con Google Play
2. Verificar logs:
   ```
   ✅ User updated: {...}
   🔄 AuthService actualizado con el nuevo rol del usuario: { onboarding_completed: true, ... }
   ```
3. Confirmar que NO redirige a `/onboarding`
4. Confirmar que permanece en la página de membresías/perfil

### Caso 2: Compra con PayPal
1. Usuario compra membresía con PayPal
2. Verificar logs similares
3. Confirmar que NO redirige a `/onboarding`

### Caso 3: Verificar localStorage
Después de comprar, revisar en DevTools:
```javascript
// Debe tener ambos
localStorage.getItem('userSession')
// { ..., onboarding_completed: true }

localStorage.getItem('ikosten_user_data')
// { id, email, name, role, onboarding_completed: true }
```

---

## 🎯 Prevención Futura

### Recomendaciones:

1. **Migrar completamente a User interface**
   - Deprecar `userSession` (legacy)
   - Usar solo `ikosten_user_data` a través de AuthService

2. **Centralizar actualización de usuario**
   ```typescript
   // Crear método helper en AuthService
   updateUserRole(userId: string, newRole: number): Observable<void> {
     return this.apiService.update(`leads/${userId}`, { lead_role: newRole }).pipe(
       tap(() => {
         const currentUser = this.getCurrentUser();
         if (currentUser) {
           currentUser.role = newRole;
           this.updateCurrentUser(currentUser);
         }
       })
     );
   }
   ```

3. **Validar onboarding_completed en backend**
   - Al registrar usuario, siempre incluir `onboarding_completed`
   - Al actualizar usuario, preservar este campo

4. **Testing automatizado**
   - Agregar test E2E para flujo de compra
   - Verificar que no redirige a onboarding
   - Validar que ambos storages se actualizan

---

## 📊 Impacto

### Antes del fix:
- ❌ Usuario compra membresía
- ❌ Es redirigido a `/onboarding`
- ❌ Confusión: "¿Por qué tengo que hacer onboarding otra vez?"
- ❌ Experiencia de usuario degradada

### Después del fix:
- ✅ Usuario compra membresía
- ✅ Ve mensaje de éxito
- ✅ Permanece en la página actual
- ✅ onboarding_completed se mantiene como `true`
- ✅ AuthService actualizado correctamente
- ✅ Guard permite acceso sin redirigir

---

## 🔗 Referencias

- Interface User: `front-end/src/app/services/auth.service.ts:10-17`
- Onboarding Guard: `front-end/src/app/guards/onboarding.guard.ts`
- AuthService.updateCurrentUser: `front-end/src/app/services/auth.service.ts:364-370`
- ApiService.setUserData: `front-end/src/app/services/api.service.ts:82-95`
