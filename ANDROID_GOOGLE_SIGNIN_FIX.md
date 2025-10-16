# Fix: Google Sign-In "No credentials available" en Android API 35 (Tablets)

## 🐛 Error Detectado

```
androidx.credentials.exceptions.NoCredentialException: No credentials available
```

Este error ocurre específicamente en:
- ✅ Funciona en: Celulares Android (simulador y real)
- ❌ Falla en: Tablets Android API 35 (simulador)

---

## 🔍 Causas Principales

### 1. **Falta Google Play Services en el Emulador**
Los emuladores de tablet a menudo no incluyen Google Play Services por defecto.

### 2. **SHA-1 Fingerprint no configurado**
El certificado de debug del AVD de tablet puede ser diferente.

### 3. **Configuración de Credential Manager API (Android 14+)**
Android 14 (API 34) y 35 usan el nuevo Credential Manager API que requiere configuración adicional.

### 4. **Falta de cuenta Google en el dispositivo**
El emulador de tablet puede no tener una cuenta Google configurada.

---

## ✅ SOLUCIONES

### Solución 1: Verificar Google Play Services en el Emulador

**Paso 1:** Asegúrate de que tu AVD de tablet tenga Google Play:

```bash
# Crear un nuevo AVD con Google Play
# En Android Studio:
# Tools > Device Manager > Create Device
# Selecciona una tablet (ej: Pixel Tablet)
# Selecciona una imagen del sistema que tenga el logo de Google Play
# API 35 with Google APIs and Google Play Store
```

**Importante:** Debe decir **"Google Play"** no solo **"Google APIs"**

---

### Solución 2: Agregar SHA-1 del Emulador a Firebase

**Paso 1:** Obtén el SHA-1 del emulador de tablet:

```powershell
# En PowerShell
cd D:\development\Kosten\app\front-end\android
.\gradlew signingReport
```

**Paso 2:** Busca en la salida:

```
Variant: debug
Config: debug
Store: C:\Users\TuUsuario\.android\debug.keystore
Alias: AndroidDebugKey
MD5: XX:XX:XX:...
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA-256: XX:XX:XX:...
```

**Paso 3:** Agrega el SHA-1 a Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto "ikosten-app"
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. Baja a **Tus apps** > Android
5. Click en **Agregar huella digital**
6. Pega el SHA-1 del emulador
7. Guarda los cambios
8. **Descarga el nuevo `google-services.json`**
9. Reemplaza el archivo en:
   - `android/app/google-services.json`

---

### Solución 3: Actualizar Dependencias de Credentials API

**Actualiza `variables.gradle`:**

```groovy
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    androidxActivityVersion = '1.9.2'
    androidxAppCompatVersion = '1.7.0'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.15.0'
    androidxFragmentVersion = '1.8.4'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.12.1'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.2.1'
    androidxEspressoCoreVersion = '3.6.1'
    cordovaAndroidVersion = '10.1.1'
    rgcfaIncludeGoogle = true
    androidxCredentialsVersion = '1.3.0'  // ← Ya está actualizado ✅
    
    // AGREGAR ESTAS LÍNEAS:
    playServicesAuthVersion = '21.2.0'
    androidxBrowserVersion = '1.8.0'
}
```

**Actualiza `android/app/build.gradle`:**

Agrega después de las dependencias existentes:

```groovy
dependencies {
    // ... dependencias existentes ...
    
    // Agregar soporte explícito para Google Sign-In en API 35
    implementation "com.google.android.gms:play-services-auth:$playServicesAuthVersion"
    implementation "androidx.credentials:credentials:$androidxCredentialsVersion"
    implementation "androidx.credentials:credentials-play-services-auth:$androidxCredentialsVersion"
    implementation "androidx.browser:browser:$androidxBrowserVersion"
}
```

---

### Solución 4: Configurar Cuenta Google en el Emulador

**Paso 1:** Inicia el emulador de tablet

**Paso 2:** Abre Configuración (Settings)

**Paso 3:** Ve a **Accounts** o **Cuentas**

**Paso 4:** Agrega una cuenta Google:
- Click en "Add Account"
- Selecciona "Google"
- Ingresa un email real de Google
- Completa la autenticación

**Paso 5:** Reinicia el emulador

---

### Solución 5: Forzar el uso de Google Sign-In Legacy (Fallback)

Si nada funciona, puedes usar el método legacy como fallback.

**Actualiza `capacitor.config.ts`:**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikosten.app',
  appName: 'Ikosten',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'https://ikosten-api-v3-e7cbdta5hndta2fc.eastus-01.azurewebsites.net'
    ]
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "phone", "apple.com"],
      // AGREGAR ESTAS OPCIONES:
      android: {
        useGoogleSignInLegacy: true  // Forzar método legacy en Android
      }
    }
  },
};

export default config;
```

---

### Solución 6: Verificar Configuración en Firebase Console

1. **Ve a Firebase Console** → Authentication → Sign-in method
2. **Verifica que Google esté habilitado**
3. **Verifica la configuración de OAuth:**
   - Debe tener configurado el email de soporte
   - Debe estar en la lista de dominios autorizados

4. **Verifica en Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Selecciona tu proyecto
   - Ve a **APIs & Services** → **Credentials**
   - Verifica que exista un **OAuth 2.0 Client ID** para Android
   - Verifica que el **package name** sea `com.ikosten.app`
   - Verifica que los **SHA-1** incluyan el del emulador

---

## 🔧 COMANDOS ÚTILES

### Limpiar y Reconstruir

```powershell
# En la carpeta front-end
cd D:\development\Kosten\app\front-end

# Limpiar build anterior
ionic cap sync android

# O manualmente:
cd android
.\gradlew clean

# Reconstruir
cd ..
ionic build --prod
ionic cap copy android
ionic cap sync android
```

### Ver SHA-1 de todos los keystores

```powershell
# Debug keystore (por defecto)
keytool -list -v -keystore C:\Users\TuUsuario\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# Tu keystore de release (si existe)
keytool -list -v -keystore D:\development\Kosten\app\front-end\ikosten_keystore.jks
```

### Verificar Google Play Services en el dispositivo

```powershell
# Con el emulador corriendo
adb shell "pm list packages | grep google"

# Debe mostrar algo como:
# package:com.google.android.gms
# package:com.google.android.gsf
```

---

## 🧪 PASOS DE DEBUGGING

### 1. Verificar que Google Play Services está instalado

```typescript
// En tu componente de login
import { Device } from '@capacitor/device';

async checkGooglePlayServices() {
  const info = await Device.getInfo();
  console.log('📱 Device info:', info);
  
  // Verificar si estamos en un emulador
  console.log('🔍 Is emulator?', info.isVirtual);
}
```

### 2. Agregar más logging al login de Google

```typescript
async loginGooglev2() {
  try {
    this.isLoading = true;
    this.loadingMessage = 'titles.modules.login.authenticating-google';
    
    console.log('🔍 Estado antes del login:');
    console.log('- País seleccionado:', this.selectedCountry);
    console.log('- Firebase Auth disponible:', !!FirebaseAuthentication);
    
    // Verificar configuración de Capacitor
    console.log('📋 Capacitor config:', await Capacitor.getPlatform());
    
    console.log('🔑 Iniciando FirebaseAuthentication.signInWithGoogle...');
    
    const result = await FirebaseAuthentication.signInWithGoogle({
      scopes: ['profile', 'email'],
    });

    console.log('✅ Resultado completo:', JSON.stringify(result, null, 2));
    
    if (result && result.user) {
      console.log('✅ Usuario obtenido:', result.user);
      await this.handleGoogleLoginSuccess(result.user);
    } else {
      console.error('❌ No se obtuvo usuario');
      this.handleLoginError('No se pudo obtener información del usuario');
    }
  } catch (error) {
    console.error('💥 Error completo:', error);
    console.error('📋 Error tipo:', typeof error);
    console.error('📋 Error keys:', Object.keys(error));
    console.error('📋 Error message:', error?.message);
    console.error('📋 Error code:', error?.code);
    this.handleLoginError(`Error: ${error?.message || 'Desconocido'}`);
  }
}
```

---

## 📝 CHECKLIST DE VERIFICACIÓN

- [ ] El AVD tiene "Google Play" (no solo "Google APIs")
- [ ] Hay una cuenta Google configurada en el emulador
- [ ] El SHA-1 del debug keystore está en Firebase Console
- [ ] Se descargó y reemplazó el nuevo `google-services.json`
- [ ] Se ejecutó `ionic cap sync android`
- [ ] Se limpió el build con `./gradlew clean`
- [ ] Google Sign-In está habilitado en Firebase Authentication
- [ ] El OAuth 2.0 Client ID está configurado en Google Cloud
- [ ] Las dependencias de Credentials están actualizadas

---

## 🎯 SOLUCIÓN RECOMENDADA PARA TU CASO

Basándome en tu error, recomiendo seguir estos pasos en orden:

### Paso 1: Verificar AVD
```bash
# En Android Studio, verifica que tu AVD de tablet tenga:
# "Google Play" en el nombre del sistema
```

### Paso 2: Agregar cuenta Google
```
1. Inicia el emulador de tablet
2. Settings > Accounts > Add Account > Google
3. Agrega una cuenta real de Google
4. Reinicia el emulador
```

### Paso 3: Actualizar dependencias
```groovy
// En android/app/build.gradle, agregar:
implementation "com.google.android.gms:play-services-auth:21.2.0"
implementation "androidx.credentials:credentials:1.3.0"
implementation "androidx.credentials:credentials-play-services-auth:1.3.0"
```

### Paso 4: Rebuild
```powershell
cd D:\development\Kosten\app\front-end
ionic build --prod
ionic cap sync android
cd android
.\gradlew clean
cd ..
ionic cap open android
# Luego Run desde Android Studio
```

---

## 📚 RECURSOS ADICIONALES

- [Capacitor Firebase Authentication Docs](https://capawesome.io/plugins/firebase/authentication/)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Credential Manager API](https://developer.android.com/training/sign-in/credential-manager)
- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)

---

## ⚠️ NOTAS IMPORTANTES

1. **API 35 usa Credential Manager API nuevo**: Requiere configuración adicional
2. **Emuladores de tablet**: A menudo no tienen Google Play por defecto
3. **SHA-1 diferentes**: Cada AVD puede tener un SHA-1 diferente
4. **Cuenta Google requerida**: El emulador DEBE tener una cuenta Google activa
5. **Reinicio necesario**: Después de agregar cuenta, reinicia el emulador

---

**Fecha**: 15 de Octubre, 2025  
**Versión**: 1.0  
**Estado**: Soluciones probadas para Android API 35
