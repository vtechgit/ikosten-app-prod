# Botón Cancelar en Selector de País

## Cambios Implementados

Se agregó un botón de cancelar en el modal de selección de país para permitir a los usuarios cancelar el proceso de agregar un nuevo país sin seleccionar ninguno.

### **1. HTML (country-picker.component.html)**

**Antes:**
- El footer solo aparecía cuando había una selección (`*ngIf="this.selected"`)
- Solo tenía el botón "Confirmar"

**Después:**
- El footer ahora siempre está visible
- Contiene dos botones:
  1. **Cancelar** - Siempre visible, permite cerrar el modal sin hacer cambios
  2. **Confirmar** - Solo visible cuando hay una selección

```html
<ion-footer color="light" style="padding: 10px 5px 20px 5px;">
  <div class="footer-buttons">
    <!-- Botón Cancelar: siempre visible -->
    <ion-button 
      fill="outline" 
      color="medium" 
      class="button-controll cancel-button" 
      (click)="cancelSelection()">
      <ion-icon name="close-outline" slot="start"></ion-icon>
      {{'buttons.cancel' | translate}}
    </ion-button>

    <!-- Botón Confirmar: solo visible cuando hay selección -->
    <ion-button 
      *ngIf="this.selected"
      color="primary" 
      class="button-controll confirm-button" 
      (click)="confirmOptionSelected()">
      {{'buttons.confirm' | translate}}
      <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
    </ion-button>
  </div>
</ion-footer>
```

### **2. TypeScript (country-picker.component.ts)**

Se agregó el método `cancelSelection()`:

```typescript
cancelSelection(){
  console.log('🚫 Cancelando selección de país');
  
  // Limpiar selección
  this.selected = undefined;
  this.searchText = '';
  this.options = this.temp;
  
  // Cerrar modal
  this.isModalOpen = false;
  
  // Emitir evento de dismiss
  this.dismiss.emit(true);
}
```

**Funcionalidad:**
- Limpia cualquier selección previa
- Resetea el campo de búsqueda
- Restaura la lista completa de opciones
- Cierra el modal
- Emite el evento `dismiss` para que el componente padre lo maneje

### **3. Estilos (country-picker.component.scss)**

Se agregaron estilos para el nuevo layout del footer:

```scss
ion-footer {
    border-top: 1px solid var(--ion-color-light-shade);
    
    .footer-buttons {
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
        padding: 0 5px;
        
        .button-controll {
            flex: 1;
            margin: 0;
            height: 44px;
            font-weight: 600;
            
            &.cancel-button {
                max-width: 140px;
            }
        }
        
        // Responsive para móviles pequeños
        @media (max-width: 360px) {
            gap: 8px;
            
            .button-controll {
                font-size: 14px;
                
                &.cancel-button {
                    max-width: 120px;
                }
            }
        }
    }
}
```

**Características:**
- Layout flexible con `display: flex`
- Espaciado consistente entre botones
- Botón cancelar con ancho máximo para no dominar el espacio
- Diseño responsive para pantallas pequeñas
- Borde superior para separar visualmente del contenido

## Comportamiento del Usuario

### **Caso 1: Usuario no selecciona ningún país**
1. Abre el modal de países
2. Ve la lista de países
3. **Presiona "Cancelar"**
4. El modal se cierra sin agregar ningún país
5. Vuelve a la vista de recibos

### **Caso 2: Usuario selecciona un país pero cambia de opinión**
1. Abre el modal de países
2. Selecciona un país (aparece el botón "Confirmar")
3. **Presiona "Cancelar"**
4. La selección se limpia
5. El modal se cierra
6. No se agrega ningún país

### **Caso 3: Usuario selecciona y confirma**
1. Abre el modal de países
2. Selecciona un país
3. **Presiona "Confirmar"**
4. El país se agrega a la lista
5. El modal se cierra

## Alternativas de Cancelación

Los usuarios tienen **3 formas** de cancelar:

1. **Botón "Cancelar"** en el footer (nuevo)
2. **Botón "Atrás"** en el header (existente)
3. **Swipe down** o tocar fuera del modal (comportamiento nativo de Ionic)

## Traducción

Usa la clave existente `buttons.cancel` que ya está traducida en todos los idiomas:
- **Español**: "Cancelar"
- **Inglés**: "Cancel"
- **Portugués**: "Cancelar"
- **Alemán**: "Abbrechen"
- etc.

## Testing

**Escenarios a probar:**

1. ✅ Abrir modal y presionar cancelar sin selección
2. ✅ Seleccionar un país y presionar cancelar
3. ✅ Seleccionar un país y confirmar (flujo normal)
4. ✅ Verificar diseño responsive en móviles pequeños
5. ✅ Verificar que el botón "Atrás" sigue funcionando
6. ✅ Verificar swipe down para cerrar modal

## Archivos Modificados

1. ✅ `country-picker.component.html` - Layout del footer con botones
2. ✅ `country-picker.component.ts` - Método `cancelSelection()`
3. ✅ `country-picker.component.scss` - Estilos del footer

## Notas

- **No rompe funcionalidad existente**: Todos los flujos actuales siguen funcionando
- **Mejora UX**: Más claro para el usuario cómo cancelar la acción
- **Consistente**: Usa patrones de diseño ya establecidos en la app
- **Accesible**: Botones grandes y fáciles de presionar
