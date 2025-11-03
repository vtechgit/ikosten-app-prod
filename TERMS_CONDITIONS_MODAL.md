# Términos y Condiciones en Modal de Membresía

## 📋 Resumen de Cambios

Se agregó una sección de **Términos y Condiciones** en el modal de membresía (`membership-modal.component`), ubicada justo arriba de la sección "Trial Guarantee".

## ✨ Características Implementadas

### 1. **Sección de Términos y Condiciones**
- Título traducido a todos los idiomas disponibles
- Lista de enlaces a documentos legales
- Diseño responsivo y centrado

### 2. **Enlaces Incluidos**

#### Privacy Policy (Todos los dispositivos)
- **URL:** https://ikosten.com/privacy-policy/
- **Traducción:** Disponible en 7 idiomas (EN, ES, DE, PT, IT, JA, KO, AR)
- **Comportamiento:** Se abre en nueva pestaña con `target="_blank"` y `rel="noopener noreferrer"`

#### Terms of Use - EULA (Solo iOS)
- **URL:** https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- **Traducción:** Disponible en 7 idiomas
- **Condicional:** Solo se muestra en dispositivos iOS usando `*ngIf="isIOS"`
- **Comportamiento:** Se abre en nueva pestaña

## 📁 Archivos Modificados

### 1. **Component HTML** 
`front-end/src/app/components/membership-modal/membership-modal.component.html`

```html
<!-- Términos y Condiciones -->
<div class="terms-conditions">
  <h4>{{ 'trial.terms.title' | translate }}</h4>
  <ul class="terms-list">
    <li>
      <a href="https://ikosten.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
        {{ 'trial.terms.privacy-policy' | translate }}
      </a>
    </li>
    <li *ngIf="isIOS">
      <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer">
        {{ 'trial.terms.eula' | translate }}
      </a>
    </li>
  </ul>
</div>
```

### 2. **Component TypeScript**
`front-end/src/app/components/membership-modal/membership-modal.component.ts`

**Cambio:** Agregada propiedad `isIOS` para detección de plataforma iOS

```typescript
// Platform detection
isNativePlatform: boolean = false;
isIOS: boolean = false;  // 🆕 Nueva propiedad

constructor(
  // ... otros parámetros
  private platform: Platform,
  // ...
) {
  this.isNativePlatform = this.platform.is('ios') || this.platform.is('android');
  this.isIOS = this.platform.is('ios');  // 🆕 Detección de iOS
  console.log('🍎 MembershipModal: Es iOS:', this.isIOS);
}
```

### 3. **Component SCSS**
`front-end/src/app/components/membership-modal/membership-modal.component.scss`

**Estilos agregados:**
```scss
.terms-conditions {
  padding: 1rem;
  margin: 1rem 0 0.5rem;
  text-align: center;

  h4 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ion-color-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .terms-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;

    li {
      a {
        color: var(--ion-color-primary);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: color 0.2s ease, opacity 0.2s ease;
        
        &:hover {
          color: var(--ion-color-primary-shade);
          text-decoration: underline;
          opacity: 0.8;
        }

        &::after {
          content: '↗';  // Icono de enlace externo
          font-size: 0.75rem;
          opacity: 0.7;
        }
      }
    }
  }

  // Responsive: En tablets/desktop se muestran en fila
  @media (min-width: 768px) {
    .terms-list {
      flex-direction: row;
      justify-content: center;
      gap: 2rem;
    }
  }
}
```

### 4. **Archivos de Traducción** (7 idiomas)

Todos los archivos `i18n/*.json` fueron actualizados con las siguientes claves:

```json
"trial.terms.title": "Términos y Condiciones",
"trial.terms.privacy-policy": "Política de Privacidad",
"trial.terms.eula": "Términos de Uso (EULA)"
```

#### Archivos modificados:
- ✅ `front-end/i18n/en.json` (English)
- ✅ `front-end/i18n/es.json` (Español)
- ✅ `front-end/i18n/de.json` (Deutsch)
- ✅ `front-end/i18n/pt.json` (Português)
- ✅ `front-end/i18n/it.json` (Italiano)
- ✅ `front-end/i18n/ja.json` (日本語)
- ✅ `front-end/i18n/ko.json` (한국어)
- ✅ `front-end/i18n/ar.json` (العربية)

## 🎨 Diseño Visual

### Móviles (< 768px)
```
┌──────────────────────────────┐
│   TÉRMINOS Y CONDICIONES     │
│                              │
│   • Privacy Policy ↗         │
│   • Terms of Use (EULA) ↗    │ (solo iOS)
│                              │
└──────────────────────────────┘
```

### Tablets/Desktop (≥ 768px)
```
┌──────────────────────────────┐
│   TÉRMINOS Y CONDICIONES     │
│                              │
│   • Privacy Policy ↗  •  Terms of Use (EULA) ↗
│                              │
└──────────────────────────────┘
```

## 🔒 Consideraciones de Seguridad

### Enlaces Externos Seguros
Todos los enlaces usan:
- `target="_blank"` - Abre en nueva pestaña
- `rel="noopener noreferrer"` - Previene ataques de tabnapping y no envía referrer

### Validación de Plataforma
- La detección de iOS usa la API oficial de Ionic Platform
- La directiva `*ngIf="isIOS"` garantiza que el EULA solo aparezca en iOS

## 📱 Plataformas Soportadas

| Plataforma | Privacy Policy | Apple EULA |
|------------|:--------------:|:----------:|
| iOS        | ✅             | ✅         |
| Android    | ✅             | ❌         |
| Web        | ✅             | ❌         |

## 🌐 Traducciones Completas

### English (en.json)
- **Title:** "Terms and Conditions"
- **Privacy Policy:** "Privacy Policy"
- **EULA:** "Terms of Use (EULA)"

### Español (es.json)
- **Title:** "Términos y Condiciones"
- **Privacy Policy:** "Política de Privacidad"
- **EULA:** "Términos de Uso (EULA)"

### Deutsch (de.json)
- **Title:** "Geschäftsbedingungen"
- **Privacy Policy:** "Datenschutzrichtlinie"
- **EULA:** "Nutzungsbedingungen (EULA)"

### Português (pt.json)
- **Title:** "Termos e Condições"
- **Privacy Policy:** "Política de Privacidade"
- **EULA:** "Termos de Uso (EULA)"

### Italiano (it.json)
- **Title:** "Termini e Condizioni"
- **Privacy Policy:** "Informativa sulla Privacy"
- **EULA:** "Termini di Utilizzo (EULA)"

### 日本語 (ja.json)
- **Title:** "利用規約"
- **Privacy Policy:** "プライバシーポリシー"
- **EULA:** "利用規約（EULA）"

### 한국어 (ko.json)
- **Title:** "이용 약관"
- **Privacy Policy:** "개인정보 처리방침"
- **EULA:** "이용 약관 (EULA)"

### العربية (ar.json)
- **Title:** "الشروط والأحكام"
- **Privacy Policy:** "سياسة الخصوصية"
- **EULA:** "شروط الاستخدام (EULA)"

## ✅ Checklist de Implementación

- [x] Agregar sección HTML en modal
- [x] Crear estilos CSS responsivos
- [x] Implementar detección de iOS en TypeScript
- [x] Agregar traducciones en inglés
- [x] Agregar traducciones en español
- [x] Agregar traducciones en alemán
- [x] Agregar traducciones en portugués
- [x] Agregar traducciones en italiano
- [x] Agregar traducciones en japonés
- [x] Agregar traducciones en coreano
- [x] Agregar traducciones en árabe
- [x] Implementar enlaces externos seguros
- [x] Agregar directiva condicional para iOS
- [x] Posicionar correctamente (arriba de trial guarantee)
- [x] Diseño responsivo (móvil y desktop)
- [x] Testing visual en diferentes resoluciones

## 🧪 Testing

### Pruebas Recomendadas

1. **Prueba en iOS**
   - ✅ Verificar que aparecen ambos enlaces (Privacy Policy + EULA)
   - ✅ Confirmar que los enlaces abren en nueva pestaña
   - ✅ Probar en diferentes tamaños de iPhone

2. **Prueba en Android**
   - ✅ Verificar que solo aparece Privacy Policy
   - ✅ Confirmar que NO aparece el enlace a Apple EULA
   - ✅ Probar en diferentes tamaños de dispositivo

3. **Prueba en Web**
   - ✅ Verificar comportamiento en navegador
   - ✅ Probar diseño responsivo (móvil/tablet/desktop)
   - ✅ Verificar que solo aparece Privacy Policy

4. **Prueba de Idiomas**
   - ✅ Cambiar idioma de la app
   - ✅ Verificar que los textos se traducen correctamente
   - ✅ Probar los 7 idiomas disponibles

5. **Prueba de Enlaces**
   - ✅ Hacer clic en Privacy Policy → debe abrir https://ikosten.com/privacy-policy/
   - ✅ En iOS: hacer clic en EULA → debe abrir https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
   - ✅ Verificar que abren en nueva pestaña

## 📝 Notas Adicionales

### Por qué EULA solo en iOS
Apple App Store requiere que las aplicaciones con compras in-app (IAP) muestren el EULA estándar de Apple. Este requisito NO aplica para Android o Web.

### Ubicación de la Sección
La sección se colocó justo arriba de "Trial Guarantee" para:
- ✅ Ser visible antes de iniciar el trial
- ✅ No interrumpir el flujo de selección de planes
- ✅ Cumplir con mejores prácticas de transparencia

### Icono de Enlace Externo
El símbolo `↗` se agrega automáticamente con CSS (`::after`) para indicar visualmente que el enlace abre una página externa.

## 🚀 Próximos Pasos

Si se requiere agregar más enlaces legales (como "Terms of Service" propios):
1. Agregar nuevo `<li>` en el HTML
2. Agregar traducciones en los 7 archivos JSON
3. Agregar URL correspondiente
4. Considerar si debe ser condicional por plataforma

---

**Fecha de implementación:** Octubre 31, 2025
**Componente:** `membership-modal.component`
**Estado:** ✅ Completado
