# Sistema de Onboarding iKosten

## 📋 Descripción
Sistema de onboarding post-login que permite a los usuarios elegir cómo quieren usar iKosten: para viajes o para finanzas personales.

## 🎯 Funcionalidades

### ✅ Página de Onboarding
- **Ubicación**: `/onboarding`
- **Diseño**: Moderno con gradientes y cards interactivas
- **Opciones**:
  - 🛫 **Quiero usarlo para viajar**: Gestión de gastos de viaje
  - 💰 **Quiero usarlo para finanzas**: Control de finanzas personales
- **Acciones**:
  - Continuar con selección
  - Saltar por ahora (sin seleccionar)

### ✅ Guards Implementados
- **`onboardingGuard`**: Verifica si el usuario completó el onboarding
- Protege rutas `/customer/*` 
- Redirige a `/onboarding` si no está completado

### ✅ Navegación Automática
- **Después del login**: Verifica onboarding → redirige según estado
- **Después del onboarding**: Navega a `/customer/trips`

## 🔧 Arquitectura

### Componentes Creados
```
/pages/onboarding/
├── onboarding.component.ts     # Lógica del componente
├── onboarding.component.html   # Template responsivo
├── onboarding.component.scss   # Estilos modernos
└── onboarding.component.spec.ts # Tests
```

### Servicios Actualizados
- **AuthService**: 
  - `updateCurrentUser()` - Actualizar datos del usuario
  - Interfaz `User` extendida con `category` y `onboarding_completed`

### Guards Nuevos
- **onboardingGuard**: Control de acceso basado en estado de onboarding

### Rutas Configuradas
```typescript
/onboarding              → OnboardingComponent (requiere auth)
/customer/*              → Componentes customer (requiere auth + onboarding)
```

## 🎨 Diseño y UX

### Características Visuales
- **Gradientes**: Fondo moderno con colores degradados
- **Cards interactivas**: Animaciones y efectos hover
- **Responsive**: Adaptable a móvil y desktop
- **Dark mode**: Soporte automático
- **Animaciones**: Transiciones suaves

### Estados de Interacción
- **Sin selección**: Hint para seleccionar
- **Con selección**: Indicador visual de selección
- **Cargando**: Spinner durante procesamiento
- **Error/Éxito**: Toasts informativos

## 🔄 Flujo de Usuario

### Primer Login
```
1. Usuario hace login exitoso
2. navigateAfterLogin() verifica onboarding_completed
3. Si false → Redirige a /onboarding
4. Usuario selecciona categoría o salta
5. Se actualiza BD y localStorage
6. Redirige a /customer/trips
```

### Login Posterior
```
1. Usuario hace login exitoso
2. navigateAfterLogin() verifica onboarding_completed
3. Si true → Redirige directamente a /customer/trips
```

### Acceso a Rutas Protegidas
```
1. Usuario navega a /customer/*
2. onboardingGuard verifica onboarding_completed
3. Si false → Redirige a /onboarding
4. Si true → Permite acceso
```

## 📊 Datos Persistidos

### Base de Datos (Usuario)
```javascript
{
  lead_category: 'travel' | 'finance' | null,
  lead_onboarding_completed: true | false
}
```

### LocalStorage (AuthService)
```javascript
{
  id: string,
  email: string,
  name: string,
  role: number,
  category?: 'travel' | 'finance',
  onboarding_completed?: boolean
}
```

## 🧪 Testing

### Casos de Prueba
1. **Usuario nuevo**: Login → Onboarding → Trips
2. **Usuario existente**: Login → Trips (salta onboarding)
3. **Selección de categoría**: Ambas opciones funcionan
4. **Skip onboarding**: Funciona sin seleccionar categoría
5. **Guards**: Redireccionamiento correcto
6. **Responsive**: Funciona en móvil y desktop

### Comandos de Testing
```bash
# Frontend
cd front-end
npm start

# Verificar rutas:
/onboarding          # Página de onboarding
/customer/trips      # Debe verificar onboarding
```

## 🔍 Logs de Debug

Durante el flujo, verás logs como:
```
🔍 Verificando onboarding para usuario: {...}
🎯 Usuario no ha completado onboarding, redirigiendo...
🎯 onboardingGuard: Verificando estado de onboarding...
🔄 onboardingGuard: Onboarding no completado, redirigiendo a onboarding
📤 Actualizando usuario con datos: {...}
✅ Usuario actualizado exitosamente
```

## 📱 Responsive Design

### Breakpoints
- **Móvil**: < 480px - Cards apiladas, textos ajustados
- **Tablet**: 768px+ - Cards en fila, espaciado mayor
- **Desktop**: Experiencia completa

### Características Móviles
- Touch-friendly buttons
- Tamaños de fuente apropiados
- Espaciado optimizado para dedos
- Animaciones suaves pero no excesivas