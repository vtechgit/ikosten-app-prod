import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private toastController: ToastController) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error inesperado';

        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del lado del servidor
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Solicitud inválida';
              break;
            case 401:
              errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente';
              break;
            case 403:
              errorMessage = 'No tienes permisos para realizar esta acción';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflicto en la solicitud';
              break;
            case 422:
              errorMessage = error.error?.message || 'Datos de entrada inválidos';
              break;
            case 429:
              errorMessage = 'Demasiadas solicitudes. Intenta de nuevo más tarde';
              break;
            case 500:
              errorMessage = 'Error interno del servidor';
              break;
            case 503:
              errorMessage = 'Servicio no disponible temporalmente';
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
          }
        }

        // Solo mostrar toast para errores que no sean 401 (estos se manejan en el auth interceptor)
        if (error.status !== 401) {
          this.showErrorToast(errorMessage);
        }

        return throwError(() => ({
          ...error,
          userMessage: errorMessage
        }));
      })
    );
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}