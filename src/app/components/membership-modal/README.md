# Membership Modal Component

Componente reutilizable para mostrar el modal de membresías cuando el usuario alcanza el límite de subidas.

## Uso

### Importación
El componente ya está exportado en `ComponentsModule`, por lo que está disponible en cualquier módulo que lo importe.

### En el template HTML:
```html
<app-membership-modal
  [isOpen]="showMembershipModal"
  [uploadLimitData]="uploadLimitData"
  (dismiss)="onMembershipModalDismiss()">
</app-membership-modal>
```

### En el componente TypeScript:
```typescript
export class YourComponent {
  showMembershipModal: boolean = false;
  uploadLimitData: any = null;

  openMembershipModal() {
    this.showMembershipModal = true;
  }

  onMembershipModalDismiss() {
    this.showMembershipModal = false;
    this.uploadLimitData = null;
  }
}
```

## Inputs

- **isOpen**: `boolean` - Controla si el modal está abierto o cerrado
- **uploadLimitData**: `any` - Datos del límite de subida con la estructura:
  ```typescript
  {
    currentCount: number,  // Número actual de recibos subidos
    maxAllowed: number,    // Máximo permitido
    canUpload: boolean     // Si puede subir más
  }
  ```

## Outputs

- **dismiss**: `void` - Se emite cuando el modal se cierra
- **planSelected**: `string` - Se emite cuando el usuario selecciona un plan (con el ID del plan)

## Funcionalidades

1. **Carga automática de planes**: Al abrir el modal, automáticamente carga los planes de membresía desde la API
2. **Banner informativo**: Muestra información sobre el límite alcanzado usando los datos de `uploadLimitData`
3. **Planes dinámicos**: Carga y muestra planes de membresía desde el backend
4. **Navegación**: Al seleccionar un plan, navega automáticamente a la página de membresías
5. **Diseño responsive**: Se adapta a diferentes tamaños de pantalla

## Estilos

Todos los estilos están encapsulados en el archivo `membership-modal.component.scss` e incluyen:
- Banner promocional con gradiente
- Cards de planes con hover effects
- Diseño responsive para tablets y desktop
- Indicadores de loading
- Mensajes de estado

## Ejemplo completo

```typescript
// En tu componente
import { Component } from '@angular/core';

@Component({
  selector: 'app-your-page',
  templateUrl: './your-page.html'
})
export class YourPage {
  showMembershipModal: boolean = false;
  uploadLimitData: any = null;

  checkUploadLimit() {
    this.api.checkUploadLimit(userId, files).subscribe({
      next: (response) => {
        if (!response.canUpload) {
          this.uploadLimitData = response;
          this.showMembershipModal = true;
        }
      }
    });
  }

  onMembershipModalDismiss() {
    this.showMembershipModal = false;
    this.uploadLimitData = null;
  }
}
```

```html
<!-- En tu template -->
<app-membership-modal
  [isOpen]="showMembershipModal"
  [uploadLimitData]="uploadLimitData"
  (dismiss)="onMembershipModalDismiss()">
</app-membership-modal>
```
