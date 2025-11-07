#!/bin/bash

# Script de diagnóstico para Google Sign-In en Android
# Ejecutar desde: front-end/

echo "🔍 DIAGNÓSTICO DE GOOGLE SIGN-IN ANDROID"
echo "========================================"
echo ""

# 1. Verificar google-services.json
echo "📄 1. Verificando google-services.json..."
if [ -f "android/app/google-services.json" ]; then
    echo "   ✅ Archivo encontrado: android/app/google-services.json"
    
    # Extraer package name
    PACKAGE_NAME=$(grep -o '"package_name": "[^"]*"' android/app/google-services.json | head -1 | cut -d'"' -f4)
    echo "   📦 Package Name: $PACKAGE_NAME"
    
    # Contar OAuth clients
    OAUTH_COUNT=$(grep -c '"client_type": 1' android/app/google-services.json)
    echo "   🔑 OAuth Clients configurados: $OAUTH_COUNT"
    
    # Mostrar SHA-1 fingerprints
    echo "   🔐 SHA-1 Fingerprints registrados:"
    grep -o '"certificate_hash": "[^"]*"' android/app/google-services.json | cut -d'"' -f4 | while read hash; do
        echo "      - $hash"
    done
else
    echo "   ❌ ERROR: google-services.json NO encontrado"
fi
echo ""

# 2. Verificar capacitor.config.ts
echo "📄 2. Verificando capacitor.config.ts..."
if [ -f "capacitor.config.ts" ]; then
    echo "   ✅ Archivo encontrado"
    
    APP_ID=$(grep 'appId:' capacitor.config.ts | cut -d"'" -f2)
    echo "   📦 App ID: $APP_ID"
    
    SKIP_NATIVE=$(grep 'skipNativeAuth:' capacitor.config.ts | grep -o 'false\|true')
    echo "   🔧 skipNativeAuth: $SKIP_NATIVE"
    
    if [ "$SKIP_NATIVE" == "false" ]; then
        echo "   ✅ Configuración correcta para Google Sign-In nativo"
    else
        echo "   ⚠️  skipNativeAuth debería ser 'false' para usar Google Sign-In nativo"
    fi
else
    echo "   ❌ ERROR: capacitor.config.ts NO encontrado"
fi
echo ""

# 3. Verificar SHA-1 del keystore local
echo "🔐 3. Verificando SHA-1 del keystore local..."
if [ -f "ikosten_keystore.jks" ]; then
    echo "   ✅ Keystore encontrado: ikosten_keystore.jks"
    echo "   📝 Para ver el SHA-1, ejecuta:"
    echo "      keytool -list -v -keystore ikosten_keystore.jks -alias ikosten"
else
    echo "   ⚠️  Keystore no encontrado en directorio actual"
fi
echo ""

# 4. Verificar Firebase Authentication en código
echo "📱 4. Verificando implementación de Firebase Auth..."
if [ -f "src/app/components/sig-in/sig-in.component.ts" ]; then
    if grep -q "FirebaseAuthentication.signInWithGoogle" src/app/components/sig-in/sig-in.component.ts; then
        echo "   ✅ signInWithGoogle implementado"
    else
        echo "   ❌ signInWithGoogle NO encontrado"
    fi
    
    if grep -q "skipNativeAuth: false" src/app/components/sig-in/sig-in.component.ts; then
        echo "   ✅ skipNativeAuth: false en código"
    fi
else
    echo "   ⚠️  Componente de login no encontrado"
fi
echo ""

# 5. Verificar build.gradle
echo "📄 5. Verificando build.gradle..."
if [ -f "android/app/build.gradle" ]; then
    echo "   ✅ build.gradle encontrado"
    
    APP_ID_GRADLE=$(grep 'applicationId' android/app/build.gradle | cut -d'"' -f2)
    echo "   📦 Application ID: $APP_ID_GRADLE"
    
    if grep -q "google-services" android/app/build.gradle; then
        echo "   ✅ Plugin google-services aplicado"
    else
        echo "   ❌ Plugin google-services NO aplicado"
    fi
else
    echo "   ❌ build.gradle NO encontrado"
fi
echo ""

# 6. Resumen y recomendaciones
echo "📊 RESUMEN Y PRÓXIMOS PASOS"
echo "========================================"
echo ""
echo "✅ PASOS COMPLETADOS:"
echo "   1. Verificar configuración local"
echo ""
echo "⚠️  PENDIENTE - OBTENER DE GOOGLE PLAY CONSOLE:"
echo "   2. SHA-1 del App Signing Key de Google Play Console"
echo "      → https://play.google.com/console/"
echo "      → Selecciona tu app: Ikosten"
echo "      → Configuración → Integridad de la aplicación → App signing"
echo "      → Copia el SHA-1 del 'App signing key certificate'"
echo ""
echo "⚠️  PENDIENTE - CONFIGURAR EN FIREBASE:"
echo "   3. Agregar SHA-1 a Firebase Console"
echo "      → https://console.firebase.google.com/"
echo "      → Proyecto: ikosten-app"
echo "      → Configuración → Tus aplicaciones → Android"
echo "      → Agregar huella digital → Pega SHA-1 → Guardar"
echo ""
echo "⚠️  PENDIENTE - CONFIGURAR EN GOOGLE CLOUD:"
echo "   4. Agregar SHA-1 a Google Cloud OAuth"
echo "      → https://console.cloud.google.com/"
echo "      → APIs y servicios → Credenciales"
echo "      → Editar cliente OAuth Android"
echo "      → Agregar SHA-1 → Guardar"
echo ""
echo "⚠️  PENDIENTE - ACTUALIZAR PROYECTO:"
echo "   5. Descargar nuevo google-services.json"
echo "   6. ionic cap sync android"
echo "   7. cd android && ./gradlew clean"
echo "   8. ./gradlew bundleRelease"
echo "   9. Subir nuevo bundle a Play Store"
echo ""
echo "📚 Documentación completa: GOOGLE_SIGNIN_ANDROID_FIX.md"
echo ""
