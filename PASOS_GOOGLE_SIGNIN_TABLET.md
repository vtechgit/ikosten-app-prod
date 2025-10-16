# 🔧 Pasos para Solucionar Google Sign-In en Tablet Android

## ✅ Lo que ya hicimos:

1. ✅ Actualizamos `android/variables.gradle` con las versiones necesarias
2. ✅ Agregamos dependencias de Credential Manager en `android/app/build.gradle`
3. ✅ Limpiamos el build con `gradlew clean`
4. ✅ Sincronizamos con `ionic cap sync android`

---

## 🎯 Pasos que DEBES hacer ahora:

### Paso 1: Verificar tu Emulador de Tablet

**Opción A: Verificar si tiene Google Play**

1. Abre **Android Studio**
2. Ve a **Tools** → **Device Manager**
3. Busca tu emulador de tablet actual
4. Verifica si dice **"Google Play"** o solo **"Google APIs"**

**Si dice solo "Google APIs"** → Necesitas crear uno nuevo con Google Play

**Opción B: Crear nuevo emulador con Google Play**

```
1. Tools → Device Manager → Create Device
2. Selecciona: "Pixel Tablet" o cualquier tablet
3. Click "Next"
4. Selecciona una imagen del sistema que tenga el logo de Google Play
   ⚠️ IMPORTANTE: Debe decir "Google Play" no solo "Google APIs"
5. Descarga la imagen si es necesario (API 35 con Google Play)
6. Click "Next" → "Finish"
```

---

### Paso 2: Configurar Cuenta Google en el Emulador

**CRÍTICO**: El emulador DEBE tener una cuenta Google activa.

```
1. Inicia tu emulador de tablet (el que tiene Google Play)
2. Espera a que cargue completamente
3. Abre "Settings" (Configuración)
4. Busca "Accounts" o "Cuentas"
5. Click en "Add Account" (Agregar cuenta)
6. Selecciona "Google"
7. Ingresa tu cuenta real de Google (email y password)
8. Completa la verificación de seguridad si aparece
9. ⚠️ IMPORTANTE: Reinicia el emulador después de agregar la cuenta
```

---

### Paso 3: Obtener SHA-1 del Emulador

Abre PowerShell y ejecuta:

```powershell
cd D:\development\Kosten\app\front-end\android
.\gradlew signingReport
```

**Busca en la salida** algo como:

```
Variant: debug
Config: debug
Store: C:\Users\TuUsuario\.android\debug.keystore
Alias: AndroidDebugKey
SHA1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD
```

**Copia ese SHA-1** (el valor después de "SHA1:")

---

### Paso 4: Agregar SHA-1 a Firebase Console

1. Ve a **[Firebase Console](https://console.firebase.google.com)**
2. Selecciona tu proyecto: **"ikosten-app"**
3. Click en el **ícono de engranaje** (⚙️) → **"Configuración del proyecto"**
4. Baja hasta la sección **"Tus apps"**
5. Busca tu app Android (com.ikosten.app)
6. Click en **"Agregar huella digital"** o **"Add fingerprint"**
7. Pega el **SHA-1** que copiaste
8. Click **"Guardar"**
9. **MUY IMPORTANTE**: Descarga el nuevo `google-services.json`
10. Reemplaza el archivo en:
    - `D:\development\Kosten\app\front-end\android\app\google-services.json`

---

### Paso 5: Rebuild y Probar

Ejecuta en PowerShell:

```powershell
cd D:\development\Kosten\app\front-end

# Rebuild
ionic build --prod

# Sync
ionic cap sync android

# Abrir en Android Studio
ionic cap open android
```

En Android Studio:
1. Espera a que termine de sincronizar
2. Selecciona tu emulador de tablet (el que tiene Google Play)
3. Click en el botón **Run** (▶️)
4. Espera a que la app se instale y abra
5. Prueba el login con Google

---

## 🧪 Verificar si Funcionó

### Test Rápido:

1. Abre la app en el emulador
2. Ve a la pantalla de login
3. Click en **"Sign in with Google"**
4. Debería aparecer un diálogo mostrando tu cuenta Google
5. Selecciona la cuenta
6. ✅ Debería completar el login exitosamente

---

## ❌ Si Sigue Fallando

### Opción 1: Verificar Google Play Services

```powershell
# Con el emulador corriendo, ejecuta:
adb shell "pm list packages | grep google"
```

**Debe mostrar**:
```
package:com.google.android.gms
package:com.google.android.gsf
package:com.android.vending
```

Si no aparecen, el emulador **NO tiene Google Play Services**.

---

### Opción 2: Ver Logs Detallados

En Android Studio:
1. Abre **Logcat** (View → Tool Windows → Logcat)
2. Filtra por: `FirebaseAuthentication`
3. Prueba el login con Google
4. Busca mensajes de error detallados

---

### Opción 3: Verificar Firebase Configuration

1. Ve a Firebase Console
2. Authentication → Sign-in method
3. Verifica que **Google** esté **Enabled** (habilitado)
4. Ve a **Project Settings** → **General**
5. Verifica que el **SHA-1** que agregaste esté listado

---

## 📋 Checklist Final

Antes de probar, verifica:

- [ ] Emulador tiene "Google Play" (no solo "Google APIs")
- [ ] Hay una cuenta Google configurada en el emulador
- [ ] Se reinició el emulador después de agregar la cuenta
- [ ] Se ejecutó `gradlew signingReport` y se copió el SHA-1
- [ ] Se agregó el SHA-1 a Firebase Console
- [ ] Se descargó el nuevo `google-services.json` de Firebase
- [ ] Se reemplazó el archivo `google-services.json` en android/app/
- [ ] Se ejecutó `ionic build --prod`
- [ ] Se ejecutó `ionic cap sync android`
- [ ] Se limpió el build anterior
- [ ] Se ejecuta la app desde Android Studio

---

## 🎯 Resumen Rápido

```bash
# 1. Crear emulador con Google Play
# 2. Agregar cuenta Google al emulador
# 3. Reiniciar emulador

# 4. En PowerShell:
cd D:\development\Kosten\app\front-end\android
.\gradlew signingReport

# 5. Copiar el SHA-1
# 6. Agregar SHA-1 a Firebase Console
# 7. Descargar nuevo google-services.json
# 8. Reemplazar google-services.json en android/app/

# 9. Rebuild:
cd ..
ionic build --prod
ionic cap sync android
ionic cap open android

# 10. Run desde Android Studio
```

---

## 💡 Tip Importante

Si tienes **múltiples emuladores**, cada uno puede tener un **SHA-1 diferente**. 

Puedes agregar **múltiples SHA-1** a Firebase Console. Así funcionará en todos tus emuladores.

---

## 📞 Si Nada Funciona

Como último recurso, puedes:

1. Probar en un **dispositivo físico** (tablet real)
2. Usar el método **legacy** (ver ANDROID_GOOGLE_SIGNIN_FIX.md, Solución 5)
3. Verificar en **Google Cloud Console** que el OAuth Client ID esté bien configurado

---

**Fecha**: 15 de Octubre, 2025  
**Estado**: Listo para probar  
**Próximo paso**: Seguir Paso 1 (Verificar emulador)
