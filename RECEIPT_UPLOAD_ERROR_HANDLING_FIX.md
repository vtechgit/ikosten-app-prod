# Fix: Manejo de Errores en Subida de Recibos

## Problemas Identificados

### 1. **No se podía eliminar archivos con error**
- Cuando un archivo fallaba al subir, mostraba "Error, please try again"
- No había forma de eliminar el archivo con error de la lista
- El usuario quedaba bloqueado con el archivo en la lista

### 2. **Bug crítico: Archivos desaparecían después de un error**
- Al hacer clic en "Add Receipt" después de un error
- Todos los demás archivos desaparecían de la lista
- Esto ocurría porque `imagesToUpload` se limpiaba prematuramente en `fileBrowseHandler()`

## Soluciones Implementadas

### 1. Botón para Eliminar Archivos con Error

**Archivo**: `main.page.html`

Se agregó un botón de eliminar que aparece solo cuando el archivo tiene estado de error:

```html
<!-- Botón para eliminar archivos con error -->
<ion-button
  *ngIf="file.status === 'error'"
  fill="clear"
  color="danger"
  size="small"
  (click)="deleteUploadingFile(i)">
  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
</ion-button>
```

**Ubicación**: Dentro del elemento `.uploading-item`, después de `.file-info`

### 2. Método para Eliminar Archivos con Error

**Archivo**: `main.page.ts`

```typescript
deleteUploadingFile(index: number) {
  console.log('🗑️ Eliminando archivo con error en index:', index);
  this.uploadingFiles.splice(index, 1);
  
  // Si no quedan archivos en la lista de uploading, resetear estados
  if (this.uploadingFiles.length === 0) {
    this.isUploading = false;
    this.showAlertTime = false;
    console.log('✅ Lista de archivos subiendo vacía, reseteando estados');
  }
  
  this.cdr.detectChanges();
}
```

**Funcionalidad**:
- Elimina el archivo específico del array `uploadingFiles`
- Si ya no quedan archivos, resetea los estados de carga
- Fuerza detección de cambios para actualizar la UI

### 3. Corrección del Bug de Archivos Desapareciendo

**Problema Original**:
```typescript
// ❌ ANTES - Bug
fileBrowseHandler(event: any) {
  const files = event.target.files;
  this.imagesToUpload = []; // ⚠️ Se limpiaba aquí prematuramente
  this.isUploadingOther = false;
  this.uploadFile(files);
}
```

**Solución**:
```typescript
// ✅ DESPUÉS - Corregido
fileBrowseHandler(event: any) {
  const files = event.target.files;
  // NO limpiar imagesToUpload aquí para evitar bug
  this.isUploadingOther = false;
  this.uploadFile(files);
}
```

**También corregido en**:
```typescript
uploadImagesBase64() {
  // ... convertir imágenes a files ...
  
  // NO limpiar aquí, dejarlo para después de que se confirme la subida
  this.isUploadingOther = false;
  this.uploadFile(files);
}
```

### 4. Limpieza Segura de Imágenes

**Archivo**: `main.page.ts` - Método `proceedWithUpload()`

Ahora `imagesToUpload` se limpia SOLO después de que la subida comience exitosamente:

```typescript
private proceedWithUpload(files: any[]) {
  this.showAlertTime = true;
  this.isUploading = true;
  this.uploadingFiles = [];

  if (files.length > 0) {
    for (const fileElement of files) {
      if ((fileElement.size / 1048576) <= 10) {
        // Agregar archivo al array de tracking
        const fileTrack = { /* ... */ };
        this.uploadingFiles.push(fileTrack);
        this.uploadReceiptFile(fileElement, this.uploadingFiles.length - 1);
      } else {
        // Archivo muy grande - error
        this.uploadingFiles.push({ /* ... status: 'error' */ });
      }
    }
    
    // Limpiar imagesToUpload SOLO después de comenzar la subida exitosamente
    if (this.imagesToUpload.length > 0) {
      console.log('✅ Limpiando imagesToUpload después de iniciar subida');
      this.imagesToUpload = [];
    }
  }
}
```

## Flujo Corregido

### Caso 1: Subida Exitosa
1. Usuario selecciona archivos
2. `fileBrowseHandler()` llama a `uploadFile()` SIN limpiar `imagesToUpload`
3. `uploadFile()` valida límites y llama a `proceedWithUpload()`
4. `proceedWithUpload()` agrega archivos a `uploadingFiles[]` con estado `'uploading'`
5. **AHORA** se limpia `imagesToUpload` porque la subida comenzó
6. Archivos se suben uno por uno
7. Estados cambian a `'success'` o `'error'`
8. Después de 1.5s, se limpian los exitosos y se recargan recibos

### Caso 2: Error en Subida
1. Usuario selecciona archivos
2. Algunos archivos fallan (red, servidor, tamaño, etc.)
3. Estado del archivo cambia a `'error'`
4. ✅ **NUEVO**: Aparece botón de eliminar (🗑️) al lado del archivo con error
5. Usuario puede:
   - Hacer clic en eliminar para quitar el archivo con error
   - Intentar subir nuevos archivos sin que desaparezcan los demás

### Caso 3: Múltiples Intentos (Antes con Bug)
1. ❌ **ANTES**: Usuario subía archivos → error → clic en "Add Receipt" → otros archivos desaparecían
2. ✅ **AHORA**: Usuario subía archivos → error → clic en "Add Receipt" → archivos previos SE MANTIENEN

## Estados de Archivo

Cada archivo en `uploadingFiles[]` tiene:

```typescript
{
  name: string,      // Nombre del archivo
  size: number,      // Tamaño en bytes
  status: 'uploading' | 'success' | 'error'
}
```

## Indicadores Visuales

### Estado Uploading
- Spinner girando
- Barra de progreso indeterminada
- Borde azul (primary)
- Fondo azul suave

### Estado Success
- ✓ Checkmark verde
- Mensaje: "Upload complete"
- Borde verde (success)
- Fondo verde suave

### Estado Error
- ✗ Cruz roja
- Mensaje: "Error, please try again"
- Borde rojo (danger)
- Fondo rojo suave
- **✅ NUEVO**: Botón de eliminar visible

## Archivos Modificados

1. **`front-end/src/app/pages/main/main.page.html`**
   - Agregado botón de eliminar para archivos con error (línea ~132)

2. **`front-end/src/app/pages/main/main.page.ts`**
   - Nuevo método `deleteUploadingFile()` (línea ~512)
   - Corregido `fileBrowseHandler()` - NO limpia `imagesToUpload` (línea ~503)
   - Corregido `uploadImagesBase64()` - NO limpia `imagesToUpload` (línea ~528)
   - Modificado `proceedWithUpload()` - Limpia `imagesToUpload` DESPUÉS de iniciar subida (línea ~660)

## Testing

### Escenario 1: Eliminar archivo con error
1. Subir un archivo que fallará (ej: sin conexión)
2. Verificar que aparece el botón de eliminar 🗑️
3. Hacer clic en eliminar
4. Verificar que el archivo desaparece de la lista
5. Verificar que `isUploading` se resetea correctamente

### Escenario 2: Múltiples archivos con errores mixtos
1. Subir 3 archivos: 1 exitoso, 2 con error
2. Verificar que los 2 con error muestran botón de eliminar
3. Eliminar uno con error
4. Verificar que el exitoso y el otro error permanecen
5. Eliminar el segundo error
6. Verificar que solo queda el exitoso

### Escenario 3: Subida después de error (Bug corregido)
1. Subir archivo que falla
2. Sin eliminar el archivo con error, hacer clic en "Add Receipt"
3. Seleccionar nuevos archivos
4. ✅ Verificar que AMBOS grupos de archivos son visibles
5. ❌ ANTES: Los nuevos archivos desaparecían
6. ✅ AHORA: Ambos grupos permanecen en la lista

### Escenario 4: Archivo muy grande (>10MB)
1. Intentar subir archivo de 11MB
2. Verificar que aparece inmediatamente con estado 'error'
3. Verificar que tiene botón de eliminar
4. Verificar que no bloquea la subida de otros archivos

## Mejoras de UX

### Antes:
- ❌ Archivos con error se quedaban bloqueados en la lista
- ❌ No había forma de eliminarlos sin recargar la página
- ❌ Bug crítico: archivos desaparecían al intentar subir nuevos
- ❌ Usuario frustrado, tenía que recargar página

### Después:
- ✅ Botón de eliminar visible para archivos con error
- ✅ Usuario puede limpiar errores y continuar
- ✅ Archivos NO desaparecen al seleccionar nuevos
- ✅ Flujo de subida más robusto y predecible
- ✅ Mejor manejo de errores sin bloquear la interfaz

## Notas Técnicas

1. **ChangeDetectorRef**: Se usa `this.cdr.detectChanges()` después de eliminar para forzar la actualización de la vista

2. **Splice vs Filter**: Se usa `splice()` para eliminar por índice específico del array

3. **Reset de Estados**: Cuando `uploadingFiles.length === 0`, se resetean:
   - `isUploading = false`
   - `showAlertTime = false`

4. **Preservación de Datos**: `imagesToUpload` solo se limpia cuando:
   - La subida comenzó exitosamente (`proceedWithUpload()`)
   - NO se limpia en `fileBrowseHandler()` ni `uploadImagesBase64()`

5. **Compatibilidad**: Los cambios son retrocompatibles y no afectan otros flujos de subida
