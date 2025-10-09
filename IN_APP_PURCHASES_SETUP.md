# Configuración de In-App Purchases

## Resumen de Implementación

Se ha implementado un sistema dual de pagos que automáticamente detecta la plataforma:
- **iOS/Android**: Usa In-App Purchases nativos mediante RevenueCat
- **Web**: Usa PayPal (implementación existente)

## Archivos Modificados

### Servicios
- ✅ `payment.service.ts` - Nuevo servicio para manejar In-App Purchases
- ✅ `auth.service.ts` - Modificado para identificar usuario en RevenueCat al login/logout
- ✅ `app.component.ts` - Inicializa RevenueCat al arrancar la app

### Componentes
- ✅ `membership-modal.component.ts` - Detecta plataforma y usa el método de pago apropiado
- ✅ `membership-modal.component.html` - Muestra precios de In-App Purchase
- ✅ `membership-modal.component.scss` - Estilos para el precio

## Pasos de Configuración

### 📝 Aclaración sobre API Keys

**Pregunta Común**: ¿Necesito una API key diferente para iOS y Android?

**Respuesta**: **SÍ** ✅

RevenueCat genera **un Public API Key diferente para cada plataforma**:
- **iOS**: Key con prefijo `appl_`
- **Android**: Key con prefijo `goog_`

Cada plataforma necesita usar su API Key correspondiente para funcionar correctamente.

**Ejemplo**:
```typescript
// ✅ CORRECTO: Usar la key correcta según la plataforma
const iosApiKey = 'appl_YOUR_IOS_API_KEY';
const androidApiKey = 'goog_YOUR_ANDROID_API_KEY';
const apiKey = this.platform.is('ios') ? iosApiKey : androidApiKey;

// ❌ INCORRECTO: Usar la misma key para ambas
const apiKey = 'appl_AbCdEfGhIjKlMnOpQrStUvWxYz';
```

**Tipos de keys en RevenueCat**:
- 🟢 **Public API Key** (iOS): Con prefijo `appl_` - Para tu app iOS
- 🟢 **Public API Key** (Android): Con prefijo `goog_` - Para tu app Android
- 🔴 **Secret API Key**: Con prefijo `sk_` - Solo para tu backend/servidor
- 🔵 **Stripe Key**: Si usas Stripe - No aplica para tu caso

---

### 1. Obtener API Keys de RevenueCat

1. Crear cuenta en [RevenueCat](https://www.revenuecat.com/)
2. Crear un nuevo proyecto
3. Agregar ambas plataformas a tu proyecto:
   - Agregar app iOS
   - Agregar app Android
4. Ir a **Settings** → **API Keys**
5. Encontrarás **dos Public API Keys**:
   - **iOS Key**: Formato `appl_XXXXXXXXXX`
   - **Android Key**: Formato `goog_XXXXXXXXXX`

6. Actualizar ambas keys en `app.component.ts` (línea ~115):
```typescript
const iosApiKey = 'appl_YOUR_IOS_API_KEY_HERE';
const androidApiKey = 'goog_YOUR_ANDROID_API_KEY_HERE';
const apiKey = this.platform.is('ios') ? iosApiKey : androidApiKey;
```

**⚠️ IMPORTANTE**: Cada plataforma debe usar su key correspondiente. No uses la key de iOS para Android ni viceversa.

### 2. Configurar Productos en App Store Connect (iOS)

1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Seleccionar tu app
3. Ir a **Features** → **In-App Purchases**
4. Crear nuevas suscripciones:

**Para cada plan de membresía:**
- Click en **[+]** → **Auto-Renewable Subscription**
- **Reference Name**: Nombre descriptivo (ej: "Plan Premium Mensual")
- **Product ID**: Identificador único (ej: `com.ikosten.premium.monthly`)
  - ⚠️ Este ID debe guardarse en el campo `membership_in_app_product_id` de cada membresía en la base de datos
- **Subscription Group**: Crear o seleccionar grupo
- **Duration**: Mensual/Anual según el plan
- **Price**: Establecer precio en cada región

**Configuración adicional:**
- Agregar localización (idiomas)
- Agregar descripción del producto
- Subir screenshot (si es necesario)
- **Submit for Review** (una vez listo para producción)

**Configurar Free Trial (Opcional pero recomendado):**
1. En tu suscripción, ir a **Subscription Prices**
2. Click en **Add Introductory Offer**
3. Seleccionar **Free Trial**
4. **Duration**: 7 days (recomendado)
5. **Eligibility**: New Subscribers (solo usuarios nuevos)
6. **Save**

**Cómo funciona el Free Trial:**
- Se activa automáticamente al comprar
- Usuario tiene 7 días gratis con acceso completo
- Al finalizar los 7 días, se cobra automáticamente
- Si cancela durante el trial, NO se le cobra nada
- Un usuario solo puede usar el trial UNA VEZ por Apple ID
- En sandbox, el trial dura solo 3 minutos (para testing rápido)

### 3. Configurar Productos en Google Play Console (Android)

1. Ir a [Google Play Console](https://play.google.com/console/)
2. Seleccionar tu app
3. Ir a **Monetization** → **In-app products** → **Subscriptions**
4. Click en **Create subscription**

**Para cada plan de membresía:**
- **Product ID**: Mismo que usaste en iOS (ej: `com.ikosten.premium.monthly`)
  - ⚠️ Este ID debe guardarse en el campo `membership_in_app_product_id` de cada membresía en la base de datos
- **Name**: Nombre visible al usuario
- **Description**: Descripción del plan
- **Billing period**: Mensual/Anual según el plan
- **Default price**: Establecer precio base
- **Free trial**: Configurar si aplica

**Configuración adicional:**
- Agregar precios para diferentes países
- Configurar opciones de renovación
- **Activate** cuando esté listo

**Configurar Free Trial (Opcional pero recomendado):**
1. En tu suscripción, activar el toggle **Free trial**
2. **Duration**: 7 days (recomendado)
3. **Eligibility**: Configurar quién puede usar el trial
4. **Save** y **Activate**

**Cómo funciona el Free Trial:**
- Se activa automáticamente al comprar
- Usuario tiene 7 días gratis con acceso completo
- Google envía notificaciones antes de cobrar
- Al finalizar los 7 días, se cobra automáticamente
- Si cancela durante el trial, NO se le cobra nada
- Un usuario solo puede usar el trial UNA VEZ por Google Account
- En testing tracks, el trial dura solo 5 minutos (para testing rápido)

### 4. Conectar Tiendas con RevenueCat

#### iOS (App Store)
1. En RevenueCat, ir a tu proyecto
2. Ir a **Settings** → **Apple App Store**
3. Ingresar:
   - **App Name**: Nombre de tu app
   - **Bundle ID**: (ej: `com.ikosten.app`)
   - **Shared Secret**: Obtenerlo de App Store Connect → Users and Access → Shared Secret

#### Android (Google Play)
1. En RevenueCat, ir a tu proyecto
2. Ir a **Settings** → **Google Play**
3. Ingresar:
   - **Package Name**: (ej: `com.ikosten.app`)
4. Crear Service Account en Google Cloud:
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear proyecto o seleccionar existente
   - Habilitar **Google Play Android Developer API**
   - Crear Service Account
   - Descargar JSON key
5. Subir JSON key a RevenueCat

### 5. Configurar Productos en RevenueCat

1. En RevenueCat, ir a **Products**
2. Click en **[+] New**
3. Para cada producto:
   - **Identifier**: Mismo Product ID de las tiendas (ej: `com.ikosten.premium.monthly`)
   - **Type**: Subscription
   - **iOS Store Product**: Seleccionar el producto de App Store
   - **Google Play Product**: Seleccionar el producto de Google Play
   - **Save**

### 6. Crear Entitlements (Permisos)

1. En RevenueCat, ir a **Entitlements**
2. Click en **[+] New Entitlement**
3. Crear entitlement:
   - **Identifier**: `premium` (o el nombre que quieras)
   - **Description**: "Acceso a funciones premium"
4. Asociar productos al entitlement:
   - Seleccionar el entitlement creado
   - Click en **Attach Products**
   - Seleccionar todos los productos premium

### 7. Actualizar Base de Datos

Agregar el campo `membership_in_app_product_id` a cada documento de membresía en la colección `memberships`:

```javascript
{
  "_id": "...",
  "membership_title": "Plan Premium Mensual",
  "membership_price": 9.99,
  "membership_currency": "USD",
  "membership_sub_id": "P-XXXXX", // PayPal (para web)
  "membership_in_app_product_id": "com.ikosten.premium.monthly", // ← NUEVO
  "membership_recurring": "month",
  "membership_role": 1,
  // ... otros campos
}
```

**Importante:** El `membership_in_app_product_id` debe coincidir exactamente con el Product ID configurado en App Store y Google Play.

## Testing

### Usuarios de Prueba en iOS

1. En App Store Connect, ir a **Users and Access** → **Sandbox Testers**
2. Crear usuario de prueba con email y contraseña
3. En tu dispositivo iOS:
   - Settings → App Store → Sandbox Account
   - Iniciar sesión con usuario de prueba
4. Probar la compra en la app (no se cobrará)

### Usuarios de Prueba en Android

1. En Google Play Console, ir a **Settings** → **License Testing**
2. Agregar emails de testers en **License testers**
3. Los usuarios deben estar agregados como testers en **Testing** → **Internal testing**
4. Instalar la app desde Internal Testing track
5. Probar la compra (no se cobrará a license testers)

### Testing en RevenueCat

RevenueCat tiene un modo sandbox automático que detecta cuando usas usuarios de prueba. Puedes ver las transacciones en el dashboard en tiempo real.

## Flujo de Usuario

### iOS/Android
1. Usuario abre modal de membresías
2. Ve los planes con precios obtenidos de la tienda (en su moneda local)
3. Selecciona un plan
4. Se abre el diálogo nativo de compra de iOS/Android
5. Usuario confirma con Face ID/Touch ID/PIN
6. La compra se procesa
7. RevenueCat notifica a la app
8. Se registra la compra en el backend
9. Se actualiza el rol del usuario
10. Usuario tiene acceso premium

### Web
1. Usuario abre modal de membresías
2. Ve los planes con precios del backend
3. Selecciona un plan
4. Se abre checkout de PayPal (flujo existente)
5. Usuario completa pago en PayPal
6. Se procesa igual que antes

## Ventajas de esta Implementación

✅ **Transparente**: El usuario no nota diferencia, todo funciona automáticamente
✅ **No rompe funcionalidad existente**: PayPal sigue funcionando en web
✅ **Cumple políticas de tiendas**: iOS y Android requieren usar sus sistemas de pago
✅ **Mejor UX**: Pagos nativos más rápidos y seguros
✅ **Moneda local**: Los usuarios ven precios en su moneda
✅ **Gestión centralizada**: RevenueCat maneja toda la lógica de suscripciones
✅ **Fácil de probar**: Modo sandbox para testing
✅ **Actualización automática de roles**: Webhooks manejan cancelaciones y vencimientos

## 🔔 Configuración de Webhooks (CRÍTICO)

Los webhooks de RevenueCat son **esenciales** para que el sistema actualice automáticamente el rol del usuario cuando:
- Se cancela una suscripción
- Falla un pago y la suscripción expira
- Se renueva una suscripción

### 1. Configurar Webhook en RevenueCat

1. Ir a RevenueCat Dashboard → Tu proyecto
2. Ir a **Integrations** → **Webhooks**
3. Click en **+ Add Webhook**
4. Configurar:
   - **URL**: `https://tu-dominio.com/api/webhooks/revenuecat`
   - **Authorization header** (opcional): Token para seguridad adicional
   - **Events to send**: Seleccionar todos (recomendado)

### 2. Eventos Manejados

El backend automáticamente procesa estos eventos:

| Evento | Descripción | Acción del Sistema |
|--------|-------------|-------------------|
| `CANCELLATION` | Usuario cancela suscripción | ❌ Rol → FREE (0), Estado → CANCELLED |
| `EXPIRATION` | Suscripción expira por falta de pago | ❌ Rol → FREE (0), Estado → EXPIRED |
| `RENEWAL` | Suscripción se renueva exitosamente | ✅ Rol → PREMIUM (1), Estado → ACTIVE |
| `INITIAL_PURCHASE` | Primera compra (informativo) | ℹ️ Log del evento |
| `BILLING_ISSUE` | Problema con el pago | ⚠️ Se registra pero NO se downgrade |
| `UNCANCELLATION` | Usuario reactiva suscripción cancelada | ✅ Rol → PREMIUM (1), Estado → ACTIVE |

### 3. Endpoint del Backend

**URL del webhook**: `/api/webhooks/revenuecat`

**Archivos creados**:
- ✅ `src/modules/revenuecatWebhooks/revenuecatWebhooks.routes.js`
- ✅ `src/modules/revenuecatWebhooks/revenuecatWebhooks.controller.js`

**Funcionalidad**:
```javascript
// Cuando RevenueCat envía un evento
POST /api/webhooks/revenuecat
Body: {
  event: {
    type: "CANCELLATION",
    app_user_id: "user_id_123",
    product_id: "com.ikosten.premium.monthly"
  }
}

// El sistema automáticamente:
// 1. Busca al usuario por app_user_id
// 2. Busca su suscripción activa
// 3. Actualiza el estado de la suscripción
// 4. Actualiza el rol del usuario (0 = FREE, 1 = PREMIUM)
```

### 4. Testing de Webhooks

**Endpoint de prueba**: `/api/webhooks/revenuecat/test`

Para probar manualmente:

```bash
# Simular cancelación
curl -X POST https://tu-dominio.com/api/webhooks/revenuecat/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CANCELLATION",
    "app_user_id": "USER_ID_AQUI",
    "product_id": "com.ikosten.premium.monthly"
  }'

# Simular expiración
curl -X POST https://tu-dominio.com/api/webhooks/revenuecat/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPIRATION",
    "app_user_id": "USER_ID_AQUI",
    "product_id": "com.ikosten.premium.monthly"
  }'
```

**También puedes probar desde RevenueCat Dashboard**:
1. Ir a **Integrations** → **Webhooks**
2. Seleccionar tu webhook
3. Click en **Send Test Event**
4. Seleccionar tipo de evento
5. Verificar en los logs del backend que se procesó correctamente

### 5. Logs y Monitoreo

El sistema registra detalladamente cada evento:

```javascript
// Logs que verás en la consola del backend:
🔔 RevenueCat webhook recibido: { type: 'CANCELLATION', app_user_id: '...' }
❌ Cancelación detectada para usuario: user_id_123
✅ Usuario downgradeado a FREE: { userId: '...', newRole: 0 }
```

### 6. Seguridad

**Verificación de firma** (opcional pero recomendado):

1. En RevenueCat Dashboard → Webhooks → Tu webhook
2. Copiar el **Webhook Secret**
3. Agregar a tu archivo `.env`:
   ```
   REVENUECAT_WEBHOOK_SECRET=your_secret_here
   ```

4. El controller verificará automáticamente la firma en el header `x-revenuecat-signature`

### 7. Estados de Suscripción

El sistema usa estos estados en la tabla `purchasedmemberships`:

- `ACTIVE`: Suscripción activa y pagada
- `CANCELLED`: Usuario canceló (pero puede tener acceso hasta fin de período)
- `EXPIRED`: Suscripción expiró por falta de pago
- `PENDING`: Pago en proceso

### 8. Flujo Completo de Cancelación

```
1. Usuario cancela en App Store/Google Play
   ↓
2. Apple/Google notifica a RevenueCat
   ↓
3. RevenueCat envía webhook CANCELLATION a tu backend
   ↓
4. Backend recibe webhook en /api/webhooks/revenuecat
   ↓
5. Controller busca usuario y suscripción
   ↓
6. Actualiza:
   - purchasedMembership_status: 'CANCELLED'
   - purchasedMembership_cancelled_date: fecha actual
   - user.user_rol: 0 (FREE)
   ↓
7. Usuario pierde acceso premium inmediatamente
   ↓
8. La app detecta rol = 0 y muestra límites
```

### 9. Consideraciones Importantes

⚠️ **Período de Gracia**:
- Cuando hay un fallo de pago, las tiendas dan tiempo para resolver
- Durante este período, el usuario mantiene acceso
- Solo cuando expira definitivamente, se envía evento `EXPIRATION`

⚠️ **Cancelación vs Expiración**:
- **CANCELLATION**: Usuario activamente cancela
- **EXPIRATION**: Falla renovación automática por falta de pago

⚠️ **Rate Limiting**:
- Los webhooks de RevenueCat están exentos del rate limiting
- Asegúrate de que la URL del webhook sea accesible públicamente

⚠️ **Idempotencia**:
- RevenueCat puede enviar el mismo evento varias veces
- El sistema maneja esto correctamente (operaciones idempotentes)

## Troubleshooting

### "Producto no disponible"
- Verificar que el Product ID sea exacto en todos lados
- Asegurarse de que el producto esté activo en la tienda
- Esperar hasta 24 horas después de crear el producto

### "Compra cancelada"
- Normal si el usuario cancela
- No se muestra error al usuario si cancela

### "Error de conexión"
- Verificar que las API keys de RevenueCat sean correctas
- Verificar que la app tenga conexión a internet
- Verificar que RevenueCat esté correctamente conectado a las tiendas

### "Usuario no identificado"
- Verificar que el usuario esté logueado antes de comprar
- El servicio debería identificar automáticamente al usuario

### "Webhook no se recibe"
- Verificar que la URL del webhook sea accesible públicamente (no localhost)
- Revisar logs del servidor para ver si llega la petición
- Usar herramientas como ngrok para testing local
- Verificar que no haya firewall bloqueando las peticiones de RevenueCat

### "Rol no se actualiza después de cancelar"
- Verificar que el webhook esté configurado correctamente en RevenueCat
- Revisar los logs del backend para ver si el webhook fue procesado
- Usar el endpoint de prueba `/api/webhooks/revenuecat/test` para simular el evento
- Verificar que el `app_user_id` en RevenueCat coincida con el `_id` del usuario en tu base de datos

## Próximos Pasos

1. ✅ Implementación completada
2. ✅ Sistema de webhooks implementado
3. ⏳ Obtener API keys de RevenueCat
4. ⏳ Configurar productos en App Store Connect
5. ⏳ Configurar productos en Google Play Console
6. ⏳ Conectar tiendas con RevenueCat
7. ⏳ **Configurar webhook en RevenueCat** (CRÍTICO)
8. ⏳ Actualizar base de datos con `membership_in_app_product_id`
9. ⏳ Crear usuarios de prueba
10. ⏳ Testing exhaustivo en ambas plataformas
11. ⏳ Probar webhooks con eventos de prueba
12. ⏳ Submit para review en las tiendas

## Recursos

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat Webhooks Guide](https://docs.revenuecat.com/docs/webhooks)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Capacitor RevenueCat Plugin](https://github.com/RevenueCat/purchases-capacitor)

## 📋 Scripts de Prueba

Se han creado dos scripts para probar los webhooks localmente:

### Windows (PowerShell):
```powershell
# Editar test-webhook.ps1 y cambiar:
# - $API_URL a tu URL local o de producción
# - $USER_ID a un ID de usuario real de tu base de datos

.\test-webhook.ps1
```

### Linux/Mac (Bash):
```bash
# Editar test-webhook.sh y cambiar:
# - API_URL a tu URL local o de producción
# - USER_ID a un ID de usuario real de tu base de datos

bash test-webhook.sh
```

Los scripts prueban todos los eventos: CANCELLATION, EXPIRATION, RENEWAL, BILLING_ISSUE, UNCANCELLATION.

## Notas Importantes

⚠️ **Políticas de las Tiendas:**
- Apple toma 30% de comisión (15% para suscripciones del 2do año en adelante)
- Google Play toma 30% de comisión (15% para suscripciones del 2do año en adelante)
- No se puede mencionar otros métodos de pago dentro de la app
- No se puede redirigir a web para evitar la comisión

⚠️ **Testing:**
- Siempre usar usuarios de prueba, nunca comprar con cuenta real durante desarrollo
- Las compras de prueba se renuevan más rápido (mensual = 5 minutos en sandbox)

⚠️ **Producción:**
- Asegurarse de que los productos estén aprobados antes del lanzamiento
- Probar el flujo completo en TestFlight (iOS) e Internal Testing (Android)
- Monitorear RevenueCat dashboard después del lanzamiento
