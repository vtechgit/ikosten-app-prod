# Debugging del Login - Pasos a Seguir

## 1. Verificar que el componente se está cargando

Después de recargar la página, deberías ver estos logs:
```
🔧 SigInComponent: ngOnInit iniciado
📋 Formulario de login inicializado: [FormGroup object]
✅ SigInComponent: ngOnInit completado
```

Si NO ves estos logs, el componente no se está cargando correctamente.

## 2. Probar el login manualmente desde la interfaz

1. Ve a la página de login
2. Ingresa email y password válidos
3. Haz clic en el botón "Iniciar Sesión"
4. Revisa la consola para ver si aparece:
   ```
   🎯 doLoginEmail: Método llamado - INICIO
   ```

## 3. Si el método NO se ejecuta, probar desde la consola

En la consola del navegador, ejecuta:
```javascript
// Encontrar el componente
const componentElement = document.querySelector('app-sig-in');
const component = ng.getComponent(componentElement);

// Llamar al método de testing
component.testLogin('tu_email@ejemplo.com', 'tu_password');
```

## 4. Verificar el estado del formulario

En la consola del navegador:
```javascript
const componentElement = document.querySelector('app-sig-in');
const component = ng.getComponent(componentElement);

console.log('Formulario válido:', component.loginForm.valid);
console.log('Email:', component.email?.value);
console.log('Password presente:', !!component.password?.value);
console.log('Errores del formulario:', component.loginForm.errors);
```

## 5. Si el login se ejecuta pero falla

Revisa estos logs en orden:
```
🎯 doLoginEmail: Método llamado - INICIO
🔑 doLoginEmail: Iniciando login con email - FORMULARIO VÁLIDO
🔐 AuthService.login iniciado
📥 AuthService.login - Respuesta recibida: [...]
💾 AuthService.setAuthData iniciado
🔑 ApiService.setToken llamado
✅ Token guardado en localStorage
```

## 6. Verificar que el backend esté funcionando

El backend debe estar corriendo en el puerto 4001:
```bash
cd back-end
npm run dev
```

## 7. Verificar comunicación con el backend

En la consola del navegador:
```javascript
fetch('http://localhost:4001/api/leads/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lead_email: 'test@example.com',
    lead_password: 'test123'
  })
}).then(res => res.json()).then(console.log);
```

## 8. Posibles Problemas y Soluciones

### Problema: No aparecen logs de ngOnInit
**Solución**: El componente no se está cargando. Verificar rutas y imports.

### Problema: doLoginEmail no se ejecuta
**Solución**: 
- Verificar que el botón no esté deshabilitado
- Verificar que no haya errores de JavaScript
- Usar el método testLogin() desde la consola

### Problema: Formulario inválido
**Solución**: Verificar que email y password cumplan las validaciones

### Problema: Error de comunicación con backend
**Solución**: Verificar que el backend esté corriendo y sea accesible

### Problema: Respuesta del backend incorrecta
**Solución**: Verificar que el backend esté devolviendo el formato JWT correcto

## Logs Esperados para un Login Exitoso

```
🎯 doLoginEmail: Método llamado - INICIO
🔑 doLoginEmail: Iniciando login con email - FORMULARIO VÁLIDO
🔐 AuthService.login iniciado
📧 Email: usuario@ejemplo.com
📥 AuthService.login - Respuesta recibida: { status: true, data: {...} }
✅ AuthService.login - Respuesta válida, guardando datos...
💾 AuthService.setAuthData iniciado
🔑 ApiService.setToken llamado
✅ Token guardado en localStorage
👤 ApiService.setUserData llamado
✅ Datos de usuario guardados en localStorage
✅ AuthService.setAuthData completado exitosamente
🎯 AuthService.login - Resultado final: true
✅ doLoginEmail: Login exitoso
🛠️ DEBUG AUTH STATE: [...]
```