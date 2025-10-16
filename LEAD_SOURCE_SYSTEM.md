# 🎯 Sistema de Tracking de Lead Source - Documentación

## 📋 Descripción General

Sistema implementado para capturar y guardar automáticamente el parámetro `lead_source` desde la URL al momento del registro de usuarios. Esto permite rastrear de dónde provienen los nuevos registros.

---

## 🚀 Implementación

### Archivos Modificados

**1. `sign-up.component.ts`**
- ✅ Agregada propiedad `lead_source: string`
- ✅ Captura automática desde URL query params
- ✅ Guardado en localStorage
- ✅ Envío al backend en objeto de registro

---

## 🔧 Funcionamiento

### 1. Captura desde URL

El componente captura automáticamente `lead_source` desde los query parameters de la URL:

```typescript
// URL de ejemplo:
https://ikosten.com/auth/register?lead_source=google_ads
https://ikosten.com/auth/register?lead_source=facebook&utm_lead=123

// El sistema captura automáticamente:
this.lead_source = this.activatedRoute.snapshot.queryParamMap.get('lead_source');
```

### 2. Guardado en localStorage

Una vez capturado, se guarda en localStorage para persistencia:

```typescript
if(this.lead_source && this.lead_source != ''){
  localStorage.setItem('lead_source', this.lead_source);
  console.log('✅ lead_source capturado desde URL:', this.lead_source);
}
```

### 3. Sistema de Prioridades

El sistema usa una cascada de prioridades para determinar el `lead_source` final:

```typescript
const finalLeadSource = this.lead_source ||                    // 1. Desde URL (prioridad máxima)
                        localStorage.getItem('lead_source') ||  // 2. Desde localStorage
                        localStorage.getItem('clientSource') || // 3. Legacy (compatibilidad)
                        'direct';                               // 4. Fallback por defecto
```

**Jerarquía:**
1. **URL** - Si viene en la URL actual (`?lead_source=xxx`)
2. **localStorage lead_source** - Si fue capturado previamente
3. **localStorage clientSource** - Sistema legacy (compatibilidad hacia atrás)
4. **'direct'** - Valor por defecto si no hay fuente definida

### 4. Envío al Backend

El `lead_source` se incluye en el objeto de registro:

```typescript
obj = {
  lead_type: 'email',
  lead_email: this.email.value,
  lead_name: this.name.value,
  lead_phone: this.phone.value,
  lead_country: country,
  lead_country_digit: country_digit,
  lead_role: 0,
  lead_source: finalLeadSource,  // ← Aquí se envía
  lead_password: this.password.value
}
```

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Google Ads
```
URL: https://ikosten.com/auth/register?lead_source=google_ads

Resultado:
- localStorage.setItem('lead_source', 'google_ads')
- Registro con lead_source: "google_ads"
```

### Ejemplo 2: Facebook Ads con UTM
```
URL: https://ikosten.com/auth/register?lead_source=facebook&utm_lead=12345

Resultado:
- localStorage.setItem('lead_source', 'facebook')
- localStorage.setItem('utm_lead', '12345')
- Registro con:
  - lead_source: "facebook"
  - lead_id: "12345"
  - lead_invitation_status: "active"
```

### Ejemplo 3: Email Marketing
```
URL: https://ikosten.com/auth/register?lead_source=email_campaign_q4

Resultado:
- localStorage.setItem('lead_source', 'email_campaign_q4')
- Registro con lead_source: "email_campaign_q4"
```

### Ejemplo 4: Sin Parámetro (Direct)
```
URL: https://ikosten.com/auth/register

Resultado:
- No se guarda en localStorage (a menos que exista previamente)
- Registro con lead_source: "direct" (fallback)
```

### Ejemplo 5: Compatibilidad con Sistema Legacy
```
Situación: Usuario llegó hace días y se guardó clientSource
- localStorage ya tiene: clientSource = "instagram"
- Usuario vuelve y se registra sin parámetros en URL

Resultado:
- Registro con lead_source: "instagram" (tomado de clientSource)
```

---

## 🎨 Valores Sugeridos para lead_source

### Redes Sociales
- `facebook`
- `instagram`
- `linkedin`
- `twitter`
- `tiktok`

### Publicidad Pagada
- `google_ads`
- `facebook_ads`
- `instagram_ads`
- `linkedin_ads`
- `display_ads`

### Marketing de Contenido
- `blog`
- `email_campaign`
- `newsletter`
- `webinar`
- `ebook_download`

### Referidos y Partners
- `referral`
- `partner_[nombre]`
- `affiliate`
- `influencer_[nombre]`

### Otros
- `direct` - Acceso directo sin fuente
- `organic_search` - Búsqueda orgánica
- `website` - Desde el sitio web principal
- `app_store` - Desde tienda de aplicaciones
- `qr_code` - Código QR

---

## 🔗 Integración con Marketing

### URLs para Campañas

#### Campaña de Google Ads
```html
https://ikosten.com/auth/register?lead_source=google_ads&utm_campaign=q4_2025&utm_medium=cpc
```

#### Campaña de Email
```html
https://ikosten.com/auth/register?lead_source=email_campaign&utm_campaign=welcome_series
```

#### Post de Instagram
```html
https://ikosten.com/auth/register?lead_source=instagram&utm_content=story_oct
```

#### Referido por Partner
```html
https://ikosten.com/auth/register?lead_source=partner_techcompany&utm_lead=REF123
```

---

## 📈 Analytics y Reportes

### Consultas útiles en MongoDB

#### Contar registros por fuente
```javascript
db.leads.aggregate([
  { $group: { 
    _id: "$lead_source", 
    count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } }
])
```

#### Registros de últimos 30 días por fuente
```javascript
db.leads.aggregate([
  { 
    $match: { 
      createdAt: { 
        $gte: new Date(Date.now() - 30*24*60*60*1000) 
      }
    }
  },
  { 
    $group: { 
      _id: "$lead_source", 
      count: { $sum: 1 } 
    }
  },
  { $sort: { count: -1 } }
])
```

#### Top 5 fuentes con mejor conversión
```javascript
db.leads.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "lead_id",
      as: "user"
    }
  },
  {
    $group: {
      _id: "$lead_source",
      total: { $sum: 1 },
      converted: { 
        $sum: { 
          $cond: [{ $gt: [{ $size: "$user" }, 0] }, 1, 0] 
        }
      }
    }
  },
  {
    $project: {
      source: "$_id",
      total: 1,
      converted: 1,
      conversion_rate: { 
        $multiply: [
          { $divide: ["$converted", "$total"] }, 
          100
        ]
      }
    }
  },
  { $sort: { conversion_rate: -1 } },
  { $limit: 5 }
])
```

---

## 🧪 Testing

### Test Manual en Desarrollo

1. **Test básico con lead_source**
   ```
   http://localhost:8100/auth/register?lead_source=test_manual
   ```
   - Registrarse
   - Verificar consola: "✅ lead_source capturado desde URL: test_manual"
   - Verificar localStorage: `lead_source = "test_manual"`
   - Verificar en base de datos: campo `lead_source` debe ser "test_manual"

2. **Test con lead_source + utm_lead**
   ```
   http://localhost:8100/auth/register?lead_source=google_ads&utm_lead=INV123
   ```
   - Registrarse
   - Verificar ambos valores capturados
   - Verificar en BD: `lead_source: "google_ads"` y `lead_id: "INV123"`

3. **Test sin parámetros (fallback)**
   ```
   http://localhost:8100/auth/register
   ```
   - Limpiar localStorage antes
   - Registrarse
   - Verificar en BD: `lead_source: "direct"`

4. **Test de persistencia**
   ```
   http://localhost:8100/auth/register?lead_source=instagram
   ```
   - NO registrarse, solo cargar la página
   - Navegar a otra página
   - Volver a /auth/register (sin parámetros)
   - Registrarse
   - Verificar en BD: `lead_source: "instagram"` (persistido)

---

## 🐛 Troubleshooting

### Problema: lead_source no se guarda

**Síntomas:**
- localStorage vacío después de cargar URL con parámetro
- lead_source es "direct" en BD cuando debería ser otro valor

**Solución:**
1. Verificar consola del navegador:
   - Debe aparecer: "✅ lead_source capturado desde URL: [valor]"
2. Verificar localStorage:
   ```javascript
   localStorage.getItem('lead_source')
   ```
3. Verificar formato de URL:
   - ✅ Correcto: `?lead_source=google_ads`
   - ❌ Incorrecto: `?leadSource=google_ads` (sin guión bajo)

### Problema: lead_source siempre es "direct"

**Causa:** El parámetro no viene en la URL y no hay valor previo en localStorage

**Solución:**
- Asegurarse de incluir `?lead_source=xxx` en todas las URLs de marketing
- Verificar que no se esté limpiando localStorage antes del registro

### Problema: Conflicto con clientSource

**Situación:** Sistema legacy usa `clientSource`, nuevo sistema usa `lead_source`

**Comportamiento actual:** El sistema da prioridad a `lead_source` sobre `clientSource`

**Si necesitas cambiar prioridad:**
```typescript
const finalLeadSource = localStorage.getItem('clientSource') || // clientSource primero
                        this.lead_source ||                      // URL segundo
                        localStorage.getItem('lead_source') ||   // lead_source tercero
                        'direct';
```

---

## 📝 Logging y Debug

El sistema incluye logging detallado en consola:

```typescript
// Al capturar desde URL
console.log('✅ lead_source capturado desde URL:', this.lead_source);

// Al recuperar de localStorage
console.log('ℹ️  lead_source recuperado de localStorage:', this.lead_source);

// Al enviar al backend
console.log('📊 Lead source para registro:', finalLeadSource);
```

**Para debugging:**
1. Abrir DevTools (F12)
2. Ir a Console
3. Buscar mensajes con prefijos: ✅, ℹ️, 📊
4. Verificar Application → Local Storage → lead_source

---

## 🔄 Migración de Sistema Legacy

Si ya tienes un sistema usando `clientSource`:

### Opción 1: Mantener compatibilidad (Implementada)
```typescript
const finalLeadSource = this.lead_source || 
                        localStorage.getItem('lead_source') || 
                        localStorage.getItem('clientSource') ||  // ← Compatibilidad
                        'direct';
```

### Opción 2: Migrar todo a lead_source
```typescript
// Ejecutar una vez al cargar la app
if(localStorage.getItem('clientSource') && !localStorage.getItem('lead_source')){
  localStorage.setItem('lead_source', localStorage.getItem('clientSource'));
  localStorage.removeItem('clientSource'); // Opcional: limpiar legacy
}
```

---

## 🎯 Mejores Prácticas

### 1. URLs de Marketing
✅ **Hacer:**
- Usar nombres descriptivos: `google_ads_q4`, `facebook_retargeting`
- Ser consistente con el naming
- Documentar todas las fuentes usadas

❌ **Evitar:**
- Nombres genéricos: `ad1`, `campaign2`
- Caracteres especiales: `google ads` (usar guiones bajos)
- URLs demasiado largas

### 2. Gestión de Datos
✅ **Hacer:**
- Limpiar localStorage periódicamente (después del registro)
- Validar valores antes de guardar
- Usar valores predefinidos cuando sea posible

❌ **Evitar:**
- Guardar información sensible en lead_source
- Usar el campo para datos que no son fuente de origen

### 3. Reportes
✅ **Hacer:**
- Crear dashboard de fuentes más efectivas
- Monitorear conversión por fuente
- Establecer metas por canal

❌ **Evitar:**
- Confiar solo en valores no validados
- Ignorar la fuente "direct" (puede tener información valiosa)

---

## 📚 Referencias

### Código Relacionado
- `sign-up.component.ts` - Implementación principal
- `leads.routes.js` (backend) - Endpoint de registro
- `Lead` model (backend) - Schema de MongoDB

### Variables en localStorage
- `lead_source` - Nueva implementación
- `utm_lead` - ID de invitación/referido
- `clientSource` - Sistema legacy (mantener compatibilidad)

### Query Parameters Soportados
- `lead_source` - Fuente de origen del lead
- `utm_lead` - ID de lead (invitación)
- `utm_campaign` - Campaña de marketing
- `utm_medium` - Medio de marketing
- `utm_content` - Contenido específico

---

## ✅ Checklist de Implementación

- [x] Agregar propiedad `lead_source` al componente
- [x] Capturar desde URL query params
- [x] Guardar en localStorage
- [x] Implementar sistema de prioridades
- [x] Enviar al backend en registro
- [x] Mantener compatibilidad con `clientSource`
- [x] Agregar logging para debugging
- [x] Documentar sistema completo
- [ ] Actualizar dashboard de analytics (pendiente)
- [ ] Crear reportes automáticos (pendiente)
- [ ] Implementar en otros puntos de entrada (pendiente)

---

**Fecha de implementación:** 2025-10-15  
**Versión:** 1.0  
**Estado:** ✅ Implementado y documentado
