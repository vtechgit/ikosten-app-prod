import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) {}

  private getToken(): string | null {
    return localStorage.getItem(environment.security.tokenStorageKey);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(environment.security.refreshTokenStorageKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(environment.security.tokenStorageKey, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(environment.security.refreshTokenStorageKey, refreshToken);
  }

  private setUserData(userData: any): void {
    localStorage.setItem(environment.security.userStorageKey, JSON.stringify(userData));
  }

  private clearAuthData(): void {
    localStorage.removeItem(environment.security.tokenStorageKey);
    localStorage.removeItem(environment.security.refreshTokenStorageKey);
    localStorage.removeItem(environment.security.userStorageKey);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Agregar token de autenticación si está disponible
    const token = this.getToken();
    
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.getRefreshToken();

      if (refreshToken) {
        console.log('🔄 Intentando refrescar token...');
        
        // Hacer la llamada al endpoint de refresh
        const refreshRequest = new HttpRequest('POST', `${environment.apiUrl}/leads/refresh-token`, 
          { refreshToken },
          { responseType: 'json' }
        );
        
        return next.handle(refreshRequest).pipe(
          switchMap((event: any) => {
            // Solo procesar cuando tengamos el body completo
            if (event.type === 4 && event.body) { // HttpEventType.Response = 4
              const response = event.body;
              
              console.log('✅ Respuesta del refresh token:', response);
              
              if (response.status && response.data && response.data.tokens) {
                const newToken = response.data.tokens.accessToken;
                const newRefreshToken = response.data.tokens.refreshToken;
                
                console.log('✅ Nuevos tokens obtenidos, guardando...');
                
                this.setToken(newToken);
                this.setRefreshToken(newRefreshToken);
                this.setUserData(response.data.user);
                
                this.isRefreshing = false;
                this.refreshTokenSubject.next(newToken);
                
                // Reintentar la petición original con el nuevo token
                return next.handle(this.addTokenHeader(request, newToken));
              } else {
                console.error('❌ Token refresh falló - respuesta inválida');
                this.isRefreshing = false;
                this.clearAuthData();
                this.router.navigate(['/auth/login']);
                return throwError(() => new Error('Session expired'));
              }
            }
            
            // Para otros eventos HTTP (como progress), simplemente dejarlos pasar
            return [event];
          }),
          catchError((error) => {
            console.error('❌ Error al refrescar token:', error);
            this.isRefreshing = false;
            this.clearAuthData();
            this.router.navigate(['/auth/login']);
            return throwError(() => error);
          })
        );
      } else {
        console.warn('⚠️ No hay refresh token disponible');
        this.isRefreshing = false;
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
        return throwError(() => new Error('No refresh token available'));
      }
    }

    // Si ya se está refrescando el token, esperar
    console.log('⏳ Ya se está refrescando el token, esperando...');
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}