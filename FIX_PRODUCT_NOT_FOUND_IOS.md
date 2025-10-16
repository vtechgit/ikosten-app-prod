# Fix: Error "Producto no encontrado" en In-App Purchases (iOS)

## 🐛 Problema Identificado

Al intentar comprar una membresía desde el simulador de iPhone (Xcode), RevenueCat devuelve un array vacío de productos, causando el error:

```
❌ PaymentService: Error en compra: {}
❌ Compra fallida: Error procesando el pago
```

**Log específico del problema:**
```javascript
⚡  [log] - 💰 PaymentService: Iniciando compra de producto: ikosten_pro_full
⚡  TO JS {"products":[]} // ❌ Array vacío
⚡  [error] - ❌ PaymentService: Error en compra: {}
```

## 🔍 Causas Posibles

### 1. Producto NO configurado en App Store Connect

El producto `ikosten_pro_full` no existe o no está aprobado en App Store Connect.

**Verificar:**
1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Seleccionar la app "Ikosten"
3. Ir a **Features** → **In-App Purchases**
4. Buscar el producto con ID `ikosten_pro_full`
5. Verificar su estado:
   - ✅ **Ready to Submit** o **Approved**: OK
   - ⚠️ **Waiting for Review**: NO funcionará hasta aprobación
   - ❌ **Rejected**: Necesita corrección
   - ❌ **No existe**: Debe crearse

### 2. Product ID No Coincide

El Product ID en la base de datos no coincide con el configurado en App Store Connect.

**Verificar:**
- **Base de datos** (campo `membership_in_app_product_id`): `ikosten_pro_full`
- **App Store Connect** (Product ID): ¿`ikosten_pro_full`?
- **RevenueCat** (Identifier): ¿`ikosten_pro_full`?

**Debe ser EXACTAMENTE el mismo en los 3 lugares** (case-sensitive).

### 3. Producto NO sincronizado en RevenueCat

El producto existe en App Store Connect pero no está importado/configurado en RevenueCat.

**Verificar:**
1. Ir a [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Ir a tu proyecto "ikosten"
3. Ir a **Products**
4. Buscar `ikosten_pro_full`
5. Si no existe, debe agregarse manualmente

### 4. Bundle ID Incorrecto

El Bundle ID de la app no coincide con el configurado en App Store Connect y RevenueCat.

**Verificar:**
- **Xcode** → Target → General → **Bundle Identifier**: `com.ikosten.app`
- **App Store Connect** → App → **Bundle ID**: `com.ikosten.app`
- **RevenueCat** → Project Settings → Apple App Store → **Bundle ID**: `com.ikosten.app`

### 5. Problema con Simulador de iOS

Los simuladores de iOS tienen limitaciones con StoreKit Testing.

**Verificar:**
- ¿Estás usando un simulador o un dispositivo físico?
- Los simuladores requieren configuración adicional de StoreKit

### 6. API Key Incorrecta

La API Key de iOS en el código no es la correcta.

**Verificar en `app.component.ts` línea ~125:**
```typescript
const iosApiKey = 'appl_RpVMsKlHqPrYfXhCUXWhoXxWDUl';
```

**Debe coincidir con:**
RevenueCat Dashboard → Project Settings → API Keys → **iOS Public API Key**

## ✅ Soluciones Paso a Paso

### Solución 1: Verificar/Crear Producto en App Store Connect

1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Seleccionar "Ikosten"
3. Ir a **Features** → **In-App Purchases**
4. Si el producto NO existe:
   - Click en **[+]**
   - Seleccionar **Auto-Renewable Subscription**
   - **Product ID**: `ikosten_pro_full`
   - **Reference Name**: "iKOSTEN Pro Full"
   - **Subscription Group**: Crear o seleccionar grupo existente
   - **Duration**: Monthly
   - **Price**: $20 USD
   - Agregar localizaciones (inglés, español, etc.)
   - **Save** y **Submit for Review**

5. Si el producto existe pero está "Waiting for Review":
   - ⚠️ **NO funcionará** hasta que Apple lo apruebe
   - **Opción temporal**: Usar StoreKit Configuration File para testing

### Solución 2: Configurar StoreKit Testing (Para Simulador)

Si estás usando el simulador de Xcode, necesitas configurar StoreKit Testing:

1. **Crear StoreKit Configuration File:**
   - En Xcode, click derecho en el proyecto
   - **New File** → **StoreKit Configuration File**
   - Nombrar: `Ikosten.storekit`
   - Click **Create**

2. **Agregar Productos al StoreKit File:**
   - Abrir `Ikosten.storekit`
   - Click en **[+]** → **Add Auto-Renewable Subscription**
   - Configurar:
     - **Reference Name**: iKOSTEN Pro Full
     - **Product ID**: `ikosten_pro_full` (EXACTO)
     - **Price**: $20.00 USD
     - **Subscription Duration**: 1 Month
     - **Family Shareable**: No
   - **Save**

3. **Habilitar StoreKit Testing en Scheme:**
   - En Xcode, ir a **Product** → **Scheme** → **Edit Scheme**
   - Seleccionar **Run** (izquierda)
   - Tab **Options**
   - **StoreKit Configuration**: Seleccionar `Ikosten.storekit`
   - **Close**

4. **Limpiar y Rebuildar:**
   ```bash
   # En el directorio front-end
   ionic capacitor sync ios
   ```

5. **Ejecutar en simulador:**
   - Ahora el producto debería aparecer
   - Las compras serán simuladas (no reales)

### Solución 3: Configurar Producto en RevenueCat

1. Ir a [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Ir a tu proyecto
3. Ir a **Products** → **[+] Add**
4. Configurar:
   - **Identifier**: `ikosten_pro_full`
   - **Type**: Subscription
   - **Display Name**: iKOSTEN Pro Full
   - **Description**: Plan completo mensual
5. **Attach to Store Product:**
   - **iOS Product ID**: `ikosten_pro_full`
   - **Google Play Product ID**: `ikosten_pro_full` (si aplica)
6. **Save**

7. **Asociar a Entitlement:**
   - Ir a **Entitlements**
   - Crear o seleccionar entitlement (ej: "premium")
   - Click **Attach Products**
   - Seleccionar `ikosten_pro_full`
   - **Save**

### Solución 4: Verificar Base de Datos

Verificar que la membresía en MongoDB tiene el Product ID correcto:

```javascript
// Conectar a MongoDB y verificar
db.memberships.findOne({ membership_title: "titles.modules.memberships.plans.senador.title" })

// Debe tener:
{
  "_id": "6799a3da0b6057808d5e899e",
  "membership_in_app_product_id": "ikosten_pro_full", // ✅ Este campo
  "membership_price": "20",
  "membership_currency": "USD",
  // ...
}
```

Si el campo no existe o está vacío:

```javascript
db.memberships.updateOne(
  { _id: ObjectId("6799a3da0b6057808d5e899e") },
  { $set: { membership_in_app_product_id: "ikosten_pro_full" } }
)
```

### Solución 5: Probar en Dispositivo Físico

Los simuladores tienen limitaciones. Para probar con App Store Connect real:

1. **Configurar Sandbox Tester:**
   - App Store Connect → **Users and Access** → **Sandbox Testers**
   - Click **[+]**
   - Crear usuario con email único (ej: `test+ios1@ikosten.com`)
   - Establecer contraseña
   - Seleccionar región

2. **Configurar Dispositivo iOS:**
   - Settings → App Store → Sandbox Account
   - Iniciar sesión con el Sandbox Tester creado
   - **NO** usar tu Apple ID real

3. **Instalar app en dispositivo:**
   ```bash
   ionic capacitor run ios --target="Nombre-del-Dispositivo"
   ```

4. **Probar compra:**
   - La compra será real en Sandbox (no se cobrará dinero)
   - Deberías ver el diálogo de confirmación de Apple
   - El producto debería aparecer correctamente

## 🔍 Diagnóstico con Logs Adicionales

Agregar logs adicionales para diagnóstico en `payment.service.ts`:

```typescript
async purchaseProduct(productId: string): Promise<PurchaseResult> {
  // ... código existente ...
  
  try {
    console.log('💰 PaymentService: Iniciando compra de producto:', productId);
    console.log('📱 PaymentService: Plataforma:', this.platform.platforms());
    console.log('🔑 PaymentService: Inicializado:', this.isInitialized);
    
    // Primero obtener el producto completo
    const { products } = await Purchases.getProducts({
      productIdentifiers: [productId],
    });

    console.log('📦 PaymentService: Productos obtenidos:', products);
    console.log('📦 PaymentService: Cantidad de productos:', products?.length || 0);
    
    if (!products || products.length === 0) {
      console.error('❌ PaymentService: No se encontró el producto:', productId);
      console.error('❌ PaymentService: Posibles causas:');
      console.error('   1. Producto no configurado en App Store Connect');
      console.error('   2. Product ID incorrecto');
      console.error('   3. Producto no importado en RevenueCat');
      console.error('   4. Bundle ID no coincide');
      console.error('   5. API Key incorrecta');
      throw new Error('Producto no encontrado en la tienda');
    }
    
    // ... resto del código ...
  }
}
```

## 📋 Checklist de Verificación

Usar esta lista para verificar cada punto:

- [ ] **App Store Connect**: Producto `ikosten_pro_full` existe y está aprobado
- [ ] **RevenueCat Products**: Producto `ikosten_pro_full` está configurado
- [ ] **RevenueCat Entitlements**: Producto está asociado a un entitlement
- [ ] **Bundle ID**: Coincide en Xcode, App Store Connect y RevenueCat
- [ ] **API Key iOS**: Es correcta en `app.component.ts`
- [ ] **Base de datos**: Campo `membership_in_app_product_id` es `ikosten_pro_full`
- [ ] **StoreKit Config**: Creado para testing en simulador (si aplica)
- [ ] **Sandbox Tester**: Configurado para testing en dispositivo físico
- [ ] **Logs adicionales**: Agregados para diagnóstico

## 🎯 Recomendación Inmediata

**Para probar AHORA mismo:**

1. **Crear StoreKit Configuration File** (Solución 2)
2. **Agregar logs de diagnóstico** en `payment.service.ts`
3. **Ejecutar en simulador nuevamente**
4. **Revisar logs** para ver qué productos se obtienen

**Para producción:**

1. **Crear producto en App Store Connect** (Solución 1)
2. **Configurar en RevenueCat** (Solución 3)
3. **Probar en dispositivo físico con Sandbox Tester** (Solución 5)

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. Verificar que el producto esté en estado "Ready to Submit" en App Store Connect
2. Esperar 24-48 horas después de crear el producto (sincronización de Apple)
3. Contactar a soporte de RevenueCat con los logs

## 🔗 Referencias

- [RevenueCat - iOS Quickstart](https://www.revenuecat.com/docs/getting-started/installation/ios)
- [Apple - Creating Auto-Renewable Subscriptions](https://developer.apple.com/documentation/storekit/in-app_purchase/creating_auto-renewable_subscriptions)
- [RevenueCat - StoreKit Testing](https://www.revenuecat.com/docs/test-and-launch/sandbox-testing/ios-app-testing)
