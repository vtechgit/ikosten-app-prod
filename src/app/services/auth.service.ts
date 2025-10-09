import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PaymentService } from './payment.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: number;
  company_id?: string;
  category?: 'travel' | 'finance';
  onboarding_completed?: boolean;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenRefreshTimer: any = null;

  constructor(
    private apiService: ApiService,
    private paymentService: PaymentService,
    private router: Router,
    private toastController: ToastController
  ) {
    // Verificar si hay usuario guardado al inicializar
    const savedUser = this.apiService.getUserData();
    
    if (savedUser) {
      this.currentUserSubject.next(savedUser);
      // Verificar si el token necesita ser renovado
      this.checkAndRefreshToken();
    }
  }

  /**
   * Verifica si el token actual está próximo a expirar y lo renueva automáticamente
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const token = this.apiService.getToken();
      const refreshToken = this.apiService.getRefreshToken();
      
      if (!token || !refreshToken) {
        console.log('⚠️ No hay tokens disponibles');
        return;
      }

      // Decodificar el token para ver su fecha de expiración
      const tokenPayload = this.decodeToken(token);
      
      if (!tokenPayload || !tokenPayload.exp) {
        console.log('⚠️ Token inválido o sin fecha de expiración');
        return;
      }

      const expirationTime = tokenPayload.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      console.log('🕐 Token expira en:', Math.floor(timeUntilExpiration / 1000 / 60), 'minutos');
      
      // Si el token ya expiró o está por expirar en menos de 5 minutos, renovarlo inmediatamente
      if (timeUntilExpiration < 5 * 60 * 1000) {
        console.log('🔄 Token expirado o próximo a expirar, renovando...');
        await this.refreshAccessToken();
      } else {
        // Programar la renovación automática 5 minutos antes de que expire
        this.scheduleTokenRefresh(timeUntilExpiration);
      }
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
    }
  }

  /**
   * Programa la renovación automática del token antes de que expire
   */
  private scheduleTokenRefresh(timeUntilExpiration: number): void {
    // Limpiar cualquier timer anterior
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Programar renovación 5 minutos antes de expirar (o inmediatamente si faltan menos de 5 minutos)
    const refreshTime = Math.max(0, timeUntilExpiration - (5 * 60 * 1000));
    
    console.log('⏰ Renovación automática programada en:', Math.floor(refreshTime / 1000 / 60), 'minutos');
    
    this.tokenRefreshTimer = setTimeout(async () => {
      console.log('⏰ Timer ejecutado - renovando token...');
      await this.refreshAccessToken();
    }, refreshTime);
  }

  /**
   * Cancela la renovación automática programada
   */
  private cancelTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Decodifica un JWT token sin verificar la firma (solo para leer el payload)
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Renueva el access token usando el refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const refreshToken = this.apiService.getRefreshToken();
      
      if (!refreshToken) {
        console.log('⚠️ No hay refresh token disponible');
        this.logout();
        return;
      }

      const response: any = await this.apiService.refreshAccessToken().toPromise();
      
      if (response && response.status && response.data) {
        console.log('✅ Token renovado exitosamente');
        this.setAuthData(response.data);
        
        // Programar la próxima renovación
        const newToken = response.data.tokens.accessToken;
        const tokenPayload = this.decodeToken(newToken);
        
        if (tokenPayload && tokenPayload.exp) {
          const expirationTime = tokenPayload.exp * 1000;
          const timeUntilExpiration = expirationTime - Date.now();
          this.scheduleTokenRefresh(timeUntilExpiration);
        }
      } else {
        console.error('❌ Error al renovar token - respuesta inválida');
        this.logout();
      }
    } catch (error) {
      console.error('❌ Error al renovar token:', error);
      this.logout();
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return this.apiService.login({
      lead_email: email.toLowerCase(),
      lead_password: password
    }).pipe(
      map((response: any) => {
        if (response.status && response.data) {
          this.setAuthData(response.data);
          return true;
        }
        return false;
      }),
      tap(success => {
        if (success) {
          this.showSuccessToast('Bienvenido de vuelta');
        } else {
          this.showErrorToast('Credenciales inválidas');
        }
      })
    );
  }

  register(userData: any): Observable<boolean> {
    return this.apiService.register(userData).pipe(
      map((response: any) => {
        if (response.status && response.data) {
          this.setAuthData(response.data);
          return true;
        }
        return false;
      }),
      tap(success => {
        if (success) {
          this.showSuccessToast('Cuenta creada exitosamente');
        } else {
          this.showErrorToast('Error al crear la cuenta');
        }
      })
    );
  }

  loginSocial(socialData: any): Observable<boolean> {
    return this.apiService.loginSocial(socialData).pipe(
      map((response: any) => {
        if (response && response.body && response.body.status && response.body.data) {
          this.setAuthData(response.body.data);
          return true;
        }
        return false;
      }),
      tap(success => {
        if (success) {
          this.showSuccessToast('Bienvenido de vuelta');
        } else {
          this.showErrorToast('Error en la autenticación social');
        }
      })
    );
  }

  async logout(): Promise<void> {
    // Cancelar cualquier renovación programada
    this.cancelTokenRefresh();
    
    // Cerrar sesión en PaymentService
    await this.paymentService.logoutUser();
    console.log('👋 Usuario desconectado de PaymentService');
    
    this.apiService.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
    this.showSuccessToast('Sesión cerrada exitosamente');
  }

  isLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: User): void {
    // Actualizar el subject
    this.currentUserSubject.next(userData);
    
    // Actualizar también en localStorage a través del ApiService
    this.apiService.setUserData(userData);
  }



  hasRole(roles: number[]): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole([0]);
  }

  isManager(): boolean {
    return this.hasRole([0, 1]);
  }

  canAccessCompany(companyId: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin puede acceder a cualquier empresa
    if (currentUser.role === 0) return true;
    
    // Otros usuarios solo pueden acceder a su empresa
    return currentUser.company_id === companyId;
  }

  private async setAuthData(authData: AuthResponse): Promise<void> {
    try {
      // Guardar tokens
      this.apiService.setToken(authData.tokens.accessToken);
      this.apiService.setRefreshToken(authData.tokens.refreshToken);
      
      // Guardar datos de usuario
      this.apiService.setUserData(authData.user);
      this.currentUserSubject.next(authData.user);
      
      // Identificar usuario en PaymentService para In-App Purchases
      if (authData.user && authData.user.id) {
        await this.paymentService.identifyUser(authData.user.id);
        console.log('👤 Usuario identificado en PaymentService después del login');
      }
      
    } catch (error) {
      console.error('Error en setAuthData:', error);
    }
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }
}