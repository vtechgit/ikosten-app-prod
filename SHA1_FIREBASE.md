# 🔑 SHA-1 para Firebase Console

## Tu SHA-1 Debug Keystore:

```
5A:E2:06:0E:59:13:B5:F7:B5:E8:9B:72:2B:56:C9:1A:23:30:79:D4
```

---

## 📋 Pasos para Agregarlo a Firebase:

### 1. Ir a Firebase Console
Abre: **https://console.firebase.google.com**

### 2. Seleccionar Proyecto
- Click en **"ikosten-app"**

### 3. Configuración del Proyecto
- Click en el **ícono de engranaje** (⚙️) arriba a la izquierda
- Click en **"Configuración del proyecto"** o **"Project Settings"**

### 4. Agregar Huella Digital
- Baja hasta la sección **"Tus apps"** o **"Your apps"**
- Busca tu app Android: **com.ikosten.app**
- En la card de Android, busca la sección de **"Huellas digitales de certificados SHA"**
- Click en **"Agregar huella digital"** o **"Add fingerprint"**

### 5. Pegar SHA-1
Pega este valor exacto:
```
5A:E2:06:0E:59:13:B5:F7:B5:E8:9B:72:2B:56:C9:1A:23:30:79:D4
```

### 6. Guardar
- Click en **"Guardar"** o **"Save"**

### 7. Descargar Nuevo google-services.json
- Después de guardar, verás un botón para descargar `google-services.json`
- Click en **"google-services.json"** para descargarlo

### 8. Reemplazar Archivo
Copia el archivo descargado y reemplázalo en:
```
D:\development\Kosten\app\front-end\android\app\google-services.json
```

---

## ✅ Verificación

Después de agregar el SHA-1, deberías ver en Firebase Console algo como:

```
SHA-1 certificate fingerprints:
- 5ae2060e5913b5f7b5e89b722b56c91a233079d4  ✓ (Nuevo - Tu debug keystore)
- 1ffd4f04d6f5b1087e3e917447cbbf818ea55e7e  ✓ (Existente)
```

---

## 🔄 Después de Agregar el SHA-1

Ejecuta estos comandos en PowerShell:

```powershell
cd D:\development\Kosten\app\front-end

# Sync el nuevo google-services.json
ionic cap sync android

# Abrir en Android Studio
ionic cap open android
```

En Android Studio:
1. Espera a que termine la sincronización
2. Click en **Run** (▶️)
3. Selecciona tu emulador de tablet
4. Prueba el login con Google

---

## 📝 Nota Importante

Este SHA-1 es de tu **debug keystore** (para desarrollo).

**Si ya tienes un keystore de producción** (`ikosten_keystore.jks`), también necesitarás:

```powershell
keytool -list -v -keystore D:\development\Kosten\app\front-end\ikosten_keystore.jks
```

Y agregar ese SHA-1 también a Firebase para que funcione en producción.

---

## ⚠️ Recordatorio

No olvides:
1. ✅ Agregar el SHA-1 a Firebase Console
2. ✅ Descargar el nuevo `google-services.json`
3. ✅ Reemplazar el archivo en `android/app/google-services.json`
4. ✅ Ejecutar `ionic cap sync android`
5. ✅ Asegurarte de que tu emulador tiene **Google Play** instalado
6. ✅ Asegurarte de que tu emulador tiene una **cuenta Google** configurada

---

**Fecha**: 15 de Octubre, 2025  
**Keystore**: C:\Users\mario\.android\debug.keystore  
**Válido hasta**: Friday, October 2, 2054
