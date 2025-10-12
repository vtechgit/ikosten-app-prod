# Configuración de StoreKit Testing para Simulador iOS

## 🎯 Objetivo

Configurar StoreKit Testing en Xcode para poder probar In-App Purchases en el simulador sin necesidad de tener los productos configurados en App Store Connect.

## 📋 Pre-requisitos

- Xcode instalado
- Proyecto Ionic/Capacitor ya sincronizado con iOS
- Archivo `Ikosten.storekit` ya creado en `ios/App/Ikosten.storekit`

## 🔧 Pasos de Configuración

### 1. Abrir el Proyecto en Xcode

```bash
cd front-end
open ios/App/App.xcworkspace
```

⚠️ **IMPORTANTE**: Abrir el archivo `.xcworkspace`, NO el `.xcodeproj`

### 2. Agregar el Archivo StoreKit al Proyecto (Si no está visible)

Si el archivo `Ikosten.storekit` no aparece en el navegador de archivos de Xcode:

1. Click derecho en la carpeta **App** en el navegador de archivos
2. Seleccionar **Add Files to "App"...**
3. Navegar a `ios/App/Ikosten.storekit`
4. **Asegurar** que esté marcado: **Copy items if needed**
5. **Target**: Verificar que "App" esté seleccionado
6. Click **Add**

### 3. Habilitar StoreKit Configuration en el Scheme

1. En Xcode, ir al menú: **Product** → **Scheme** → **Edit Scheme...**
   
   O usar el atajo: `Cmd + <` (Command + menor que)

2. En la ventana que se abre:
   - Seleccionar **Run** en el panel izquierdo
   - Ir al tab **Options** en la parte superior
   - Buscar la sección **StoreKit Configuration**

3. En **StoreKit Configuration**:
   - Cambiar de "None" a **Ikosten.storekit**
   - Si no aparece en la lista:
     - Click en el dropdown
     - Seleccionar **Other...**
     - Navegar y seleccionar `ios/App/Ikosten.storekit`

4. Click **Close** para guardar los cambios

### 4. Verificar la Configuración

El archivo `Ikosten.storekit` contiene:

```json
{
  "subscriptionGroups": [
    {
      "name": "iKOSTEN Pro",
      "subscriptions": [
        {
          "productID": "ikosten_pro_full",
          "referenceName": "iKOSTEN Pro Full Monthly",
          "displayPrice": "20.00",
          "familyShareable": false,
          "recurringSubscriptionPeriod": "P1M",
          "introductoryOffer": {
            "paymentMode": "free",
            "subscriptionPeriod": "P1W",
            "numberOfPeriods": 1
          }
        }
      ]
    }
  ]
}
```

**Esto significa:**
- **Product ID**: `ikosten_pro_full` (coincide con la BD)
- **Precio**: $20.00 USD
- **Periodo**: Mensual (P1M = 1 mes)
- **Free Trial**: 1 semana gratis (P1W)

### 5. Limpiar Build y Reinstalar

```bash
# Desde el directorio front-end
ionic capacitor sync ios
```

En Xcode:
1. **Product** → **Clean Build Folder** (`Cmd + Shift + K`)
2. **Product** → **Build** (`Cmd + B`)

### 6. Ejecutar en Simulador

1. Seleccionar un simulador iOS (iPhone 14 o superior recomendado)
2. Click en el botón **Run** o presionar `Cmd + R`
3. Esperar a que la app se instale y ejecute

### 7. Probar la Compra

1. En la app, navegar a la sección de membresías
2. Seleccionar el plan "Senador" o el que tenga `ikosten_pro_full`
3. Click en comprar

**Deberías ver:**
- ✅ El producto aparece correctamente
- ✅ El precio se muestra: "$20.00"
- ✅ Aparece "Free 7-day trial"
- ✅ Al comprar, aparece el diálogo de confirmación de StoreKit

### 8. Confirmar la Compra (Simulador)

En el simulador, cuando se muestre el diálogo de compra:

1. Aparecerá un diálogo **simulado** de App Store
2. Información del producto y precio
3. **Botones:**
   - **Subscribe**: Confirmar compra (simulada)
   - **Cancel**: Cancelar

4. Click en **Subscribe**
5. La compra se procesará instantáneamente (sin autenticación)

## 🔍 Verificar que Funciona

### Logs Esperados en Consola:

```
💰 PaymentService: Iniciando compra de producto: ikosten_pro_full
📱 PaymentService: Plataforma detectada: ["ios", "mobile", "capacitor", "cordova"]
🔑 PaymentService: SDK inicializado: true
📦 PaymentService: Respuesta de getProducts: { count: 1, products: [...] }
✅ PaymentService: Producto encontrado: {
  identifier: "ikosten_pro_full",
  title: "iKOSTEN Pro Full",
  price: "$20.00",
  description: "Full access to all..."
}
✅ PaymentService: Compra exitosa: [customerInfo]
```

### Si Sigue Sin Funcionar:

**Verificar que el StoreKit Configuration esté habilitado:**

1. En Xcode, ir a **Product** → **Scheme** → **Edit Scheme**
2. Verificar que en **Run** → **Options** → **StoreKit Configuration** esté seleccionado **Ikosten.storekit**
3. Si aparece en gris o no se puede seleccionar:
   - Cerrar Xcode
   - Eliminar carpeta `DerivedData`:
     ```bash
     rm -rf ~/Library/Developer/Xcode/DerivedData
     ```
   - Reabrir Xcode
   - Volver a configurar el Scheme

## 🆚 Diferencias: StoreKit Testing vs. Sandbox vs. Producción

| Característica | StoreKit Testing | Sandbox | Producción |
|----------------|------------------|---------|------------|
| **Ubicación** | Simulador | Dispositivo físico | App Store |
| **Requiere App Store Connect** | ❌ No | ✅ Sí | ✅ Sí |
| **Requiere Sandbox Tester** | ❌ No | ✅ Sí | ❌ No |
| **Velocidad trial** | Instantáneo | 3 minutos | 7 días |
| **Cargos reales** | ❌ No | ❌ No | ✅ Sí |
| **Testing local** | ✅ Perfecto | ⚠️ Limitado | ❌ No |
| **RevenueCat Webhooks** | ❌ No se envían | ✅ Se envían | ✅ Se envían |

## 📝 Notas Importantes

### ⚠️ Limitaciones de StoreKit Testing

1. **No envía webhooks a RevenueCat**
   - Las compras son locales
   - No se registrarán en el backend
   - Solo para UI testing

2. **Free Trial es instantáneo**
   - No hay periodo de espera
   - Se activa inmediatamente

3. **No requiere autenticación**
   - No pide Face ID / Touch ID
   - Perfecto para testing rápido

### ✅ Para Testing Completo (con Backend)

Después de verificar que la UI funciona con StoreKit Testing:

1. **Configurar producto en App Store Connect**
2. **Configurar producto en RevenueCat**
3. **Crear Sandbox Tester**
4. **Probar en dispositivo físico**

Esto asegura que todo el flujo (incluyendo webhooks y backend) funcione correctamente.

## 🎬 Video Tutorial (Referencia)

Si necesitas ayuda visual, buscar en YouTube:
- "Xcode StoreKit Configuration File"
- "iOS In-App Purchase Testing Simulator"

## 🐛 Troubleshooting

### Error: "StoreKit Configuration Not Available"

**Causa**: Xcode no reconoce el archivo StoreKit

**Solución:**
```bash
# 1. Limpiar proyecto
cd front-end
rm -rf ios/App/Pods
rm ios/App/Podfile.lock

# 2. Reinstalar
ionic capacitor sync ios

# 3. Abrir y reconfigurar Scheme en Xcode
open ios/App/App.xcworkspace
```

### Error: "Product Not Found" sigue apareciendo

**Verificar:**
1. El Product ID en `Ikosten.storekit` es exactamente `ikosten_pro_full`
2. El campo en la BD es exactamente `ikosten_pro_full`
3. StoreKit Configuration está habilitado en el Scheme
4. Se hizo Clean Build Folder antes de ejecutar

### El diálogo de compra no aparece

**Verificar:**
1. Estás ejecutando en simulador (no navegador)
2. El código detecta correctamente la plataforma iOS
3. PaymentService se inicializó correctamente
4. Los logs muestran "Producto encontrado"

## ✅ Checklist Final

Antes de continuar con testing en dispositivo físico:

- [ ] Archivo `Ikosten.storekit` creado en `ios/App/`
- [ ] StoreKit Configuration habilitado en Scheme de Xcode
- [ ] Clean Build Folder ejecutado
- [ ] App ejecutándose en simulador iOS
- [ ] Logs muestran "Producto encontrado"
- [ ] Diálogo de compra aparece correctamente
- [ ] Compra se completa sin errores

Si todos están ✅, la UI está funcionando correctamente y puedes proceder a configurar App Store Connect y RevenueCat para testing real.

## 📞 Próximos Pasos

Una vez que StoreKit Testing funciona:

1. Seguir guía en `IN_APP_PURCHASES_SETUP.md`
2. Configurar productos en App Store Connect
3. Configurar productos en RevenueCat
4. Crear Sandbox Tester
5. Probar en dispositivo físico
6. Verificar webhooks en backend
