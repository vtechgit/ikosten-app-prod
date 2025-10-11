# Sincronización de lead_role entre Backend y Frontend

## 📋 Problema Identificado

**Problema:** El `lead_role` del usuario se almacenaba en `localStorage` y NO se actualizaba automáticamente cuando cambiaba en el backend (ej: cuando expiraba una membresía). El usuario tenía que hacer logout/login para ver los cambios.

**Síntomas:**
- ❌ Usuario cancela membresía → `lead_role` se cambiaba a 0 inmediatamente en frontend (incorrecto)
- ❌ Membresía expira en backend → Usuario seguía viendo acceso premium en frontend
- ❌ `lead_role` quedaba "congelado" en `localStorage` hasta próximo login

---

## ✅ Solución Implementada

### 1. **Verificación Periódica Automática**
Creado sistema de actualización automática de datos del usuario cada 5 minutos.

**Archivo:** `front-end/src/app/services/auth.service.ts`

#### Nuevas Funciones Agregadas:

```typescript
// Timer para actualización periódica
private userDataRefreshTimer: any = null;

// Verifica y actualiza datos del usuario desde backend
private async checkAndRefreshUserData(): Promise<void>

// Programa próxima actualización (cada 5 minutos)
private scheduleUserDataRefresh(): void

// Cancela actualización automática
private cancelUserDataRefresh(): void

// Método público para forzar actualización
async forceRefreshUserData(): Promise<void>
```

#### Comportamiento:

1. **Al iniciar sesión:** Se programa verificación cada 5 minutos
2. **Cada 5 minutos:** Consulta `GET /api/leads/:id` desde backend
3. **Si `lead_role` cambió:** 
   - Actualiza usuario en memoria
   - Actualiza `localStorage`
   - Muestra notificación si perdió membresía
4. **Al logout:** Cancela verificaciones programadas

---

### 2. **Actualización Forzada Después de Acciones Críticas**

Ahora después de cancelar membresía, se fuerza una actualización inmediata.

**Archivo:** `front-end/src/app/pages/profile/profile.page.ts`

#### Cambios en `cancelMembership()`:

**ANTES (❌ Incorrecto):**
```typescript
// Cambiaba lead_role a 0 inmediatamente (incorrecto)
if (this.userSession) {
  this.userSession.lead_role = 0;
}

const currentUser = this.authService.getCurrentUser();
if (currentUser) {
  this.authService.updateCurrentUser({
    ...currentUser,
    role: 0
  });
}
```

**AHORA (✅ Correcto):**
```typescript
// NO cambiar lead_role aquí - el usuario mantiene acceso hasta el fin del período
// Forzar actualización desde backend
this.authService.forceRefreshUserData();
```

---

### 3. **Mensajes de Usuario Actualizados**

Actualizados mensajes de cancelación en **8 idiomas** para informar correctamente.

#### Español (es.json):
```json
// ANTES
"alerts.cancel-membership.message": "¿Estás seguro que deseas cancelar tu membresía? Perderás el acceso a las funciones premium."
"messages.membership-cancelled": "Tu membresía ha sido cancelada exitosamente"

// AHORA
"alerts.cancel-membership.message": "¿Estás seguro que deseas cancelar tu membresía? Mantendrás acceso a las funciones premium hasta el final de tu período de facturación actual."
"messages.membership-cancelled": "Tu membresía ha sido cancelada. Mantendrás acceso premium hasta el final de tu período de facturación actual"
```

#### Inglés (en.json):
```json
// ANTES
"alerts.cancel-membership.message": "Are you sure you want to cancel your membership? You will lose access to premium features."
"messages.membership-cancelled": "Your membership has been cancelled successfully"

// AHORA
"alerts.cancel-membership.message": "Are you sure you want to cancel your membership? You will keep access to premium features until the end of your current billing period."
"messages.membership-cancelled": "Your membership has been cancelled. You will keep premium access until the end of your current billing period"
```

**Idiomas actualizados:**
- ✅ Español (es)
- ✅ Inglés (en)
- ✅ Italiano (it)
- ✅ Alemán (de)
- ✅ Portugués (pt)
- ✅ Japonés (ja)
- ✅ Coreano (ko)
- ✅ Árabe (ar)

---

## 📊 Flujo Completo

### Escenario 1: Usuario con sesión activa cuando expira su membresía

```
🗓️ Usuario tiene membresía activa (lead_role: 1)
   └─ Sesión iniciada en la app
   └─ localStorage: { role: 1 }

⏰ 5 minutos después
   └─ Timer ejecuta checkAndRefreshUserData()
   └─ Consulta: GET /api/leads/:id
   └─ Backend responde: { lead_role: 1 } (sin cambios)
   └─ localStorage: { role: 1 } (sin cambios)

🗓️ Membresía expira en backend (job periódico)
   └─ Backend: lead_role 1 → 0
   └─ Frontend: sigue mostrando role: 1 (hasta próxima verificación)

⏰ Siguiente verificación (máximo 5 minutos después)
   └─ Consulta: GET /api/leads/:id
   └─ Backend responde: { lead_role: 0 }
   └─ Detecta cambio: 1 → 0
   └─ Actualiza localStorage: { role: 0 }
   └─ Muestra notificación: "Tu membresía ha expirado"
   └─ Usuario ve cambios inmediatamente ✅
```

### Escenario 2: Usuario cancela membresía manualmente

```
👤 Usuario hace clic en "Cancelar Membresía"
   └─ Muestra alerta: "Mantendrás acceso hasta fin del período"
   └─ Usuario confirma

📡 Frontend: PUT /api/purchasedMemberships/cancel/:id
   └─ Backend marca membresía como CANCELLED
   └─ Backend NO cambia lead_role (mantiene acceso)

🔄 Frontend ejecuta forceRefreshUserData()
   └─ Consulta inmediata: GET /api/leads/:id
   └─ Backend responde: { lead_role: 1 } (sin cambios aún)
   └─ localStorage: { role: 1 } (correcto) ✅
   └─ Usuario sigue viendo acceso premium ✅

⏰ Verificaciones periódicas continúan cada 5 minutos
   └─ Monitoreando cambios en lead_role

🗓️ Cuando llegue next_billing_date
   └─ Job backend cambia lead_role a 0
   └─ Próxima verificación (máximo 5 minutos) detecta cambio
   └─ Actualiza frontend: role: 1 → 0
   └─ Usuario pierde acceso premium ✅
```

---

## 🎯 Beneficios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Sincronización** | ❌ Manual (logout/login) | ✅ Automática cada 5 minutos |
| **Cancelación** | ❌ Pérdida inmediata de acceso | ✅ Acceso hasta fin de período |
| **UX** | ❌ Confuso, injusto | ✅ Claro, justo, transparente |
| **Datos actuales** | ❌ Desincronizados | ✅ Máximo 5 min de retraso |
| **Mensajes** | ❌ Incorrectos | ✅ Precisos en 8 idiomas |

---

## 🔧 Archivos Modificados

### Backend (ya implementado previamente):
1. ✅ `purchasedMemberships.routes.js` - NO cambia lead_role al cancelar
2. ✅ `paypalWebhooks.controller.js` - NO cambia lead_role al recibir cancelación
3. ✅ `src/jobs/expireCancelledMemberships.js` - Job que expira membresías

### Frontend (nuevo):
4. ✅ `src/app/services/auth.service.ts` - Sistema de verificación periódica
5. ✅ `src/app/pages/profile/profile.page.ts` - NO cambia lead_role al cancelar
6. ✅ `i18n/es.json` - Mensajes actualizados
7. ✅ `i18n/en.json` - Mensajes actualizados
8. ✅ `i18n/it.json` - Mensajes actualizados
9. ✅ `i18n/de.json` - Mensajes actualizados
10. ✅ `i18n/pt.json` - Mensajes actualizados
11. ✅ `i18n/ja.json` - Mensajes actualizados
12. ✅ `i18n/ko.json` - Mensajes actualizados
13. ✅ `i18n/ar.json` - Mensajes actualizados

---

## 🧪 Testing

### 1. Probar Verificación Automática

```typescript
// 1. Iniciar sesión
// 2. Abrir DevTools Console
// 3. Ver logs cada 5 minutos:

"🔄 Verificando datos del usuario desde el backend..."
"✅ lead_role sin cambios: 1"
"⏰ Próxima actualización de datos del usuario en 5 minutos"
```

### 2. Probar Cambio de lead_role

```typescript
// 1. Usuario con lead_role: 1 (Premium)
// 2. Manualmente en DB cambiar lead_role a 0
// 3. Esperar máximo 5 minutos
// 4. Ver en console:

"🔄 lead_role actualizado: 1 → 0"
// 5. Ver toast:
"Tu membresía ha expirado. Ahora tienes acceso limitado."
```

### 3. Probar Cancelación de Membresía

```typescript
// 1. Ir a Perfil
// 2. Click en "Cancelar Membresía"
// 3. Ver alerta con mensaje actualizado
// 4. Confirmar cancelación
// 5. Ver mensaje: "Tu membresía ha sido cancelada. Mantendrás acceso premium..."
// 6. Ver en console:

"🔄 Forzando actualización de datos del usuario..."
"✅ lead_role sin cambios: 1" // Correcto - mantiene acceso
```

### 4. Probar Limpieza al Logout

```typescript
// 1. Hacer logout
// 2. Ver en console:

"👋 Usuario desconectado de PaymentService"
// Timers de verificación cancelados automáticamente
```

---

## 📈 Métricas de Rendimiento

- **Frecuencia de verificación:** Cada 5 minutos
- **Impacto en red:** 1 petición GET cada 5 minutos por usuario activo
- **Retraso máximo de sincronización:** 5 minutos
- **Cancelación de timers:** Automática al logout

---

## 🚨 Consideraciones

### Retraso de hasta 5 minutos
- **Aceptable:** Para cambios de membresía (no son tiempo-real críticos)
- **Mitigado:** Se puede forzar actualización manualmente con `forceRefreshUserData()`

### Consumo de red
- **Mínimo:** 1 request cada 5 minutos = 12 requests/hora = 288 requests/día por usuario
- **Cacheable:** Se usa cache busting solo cuando es necesario

### Casos edge
- Si la API falla, reintenta en 1 minuto
- Si el usuario no tiene conexión, reintenta automáticamente cuando se reconecte
- Los timers se cancelan correctamente al logout

---

## 🔮 Mejoras Futuras Opcionales

1. **WebSockets/SSE:** Para actualizaciones en tiempo real (más complejo, no necesario ahora)
2. **Ajustar intervalo:** Hacer configurable desde environment
3. **Notificación push:** Avisar cuando membresía está por expirar
4. **Dashboard:** Mostrar countdown hasta expiración

---

## ✅ Checklist Final

- [x] Implementar verificación periódica en AuthService
- [x] Agregar método forceRefreshUserData()
- [x] Cancelar timers al logout
- [x] Corregir cancelMembership() en profile.page.ts
- [x] Actualizar mensajes en 8 idiomas
- [x] Documentar funcionamiento
- [ ] Testing en desarrollo
- [ ] Testing en staging
- [ ] Monitorear logs en producción
- [ ] Obtener feedback de usuarios

---

**Fecha de implementación:** 10 de Octubre, 2025  
**Desarrollador:** GitHub Copilot  
**Relacionado con:** MEMBERSHIP_CANCELLATION_FIX.md  
**Versión:** 1.0
