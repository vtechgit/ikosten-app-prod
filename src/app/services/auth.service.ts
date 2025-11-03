import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PaymentService } from './payment.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
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
  private userDataRefreshTimer: any = null; // Timer para actualizar datos del usuario

  constructor(
    private apiService: ApiService,
    private paymentService: PaymentService,
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    // Verificar si hay usuario guardado al inicializar
    const savedUser = this.apiService.getUserData();
    
    console.log('🔍 AuthService constructor - Usuario guardado:', savedUser);
    console.log('🔍 AuthService constructor - onboarding_completed:', savedUser?.onboarding_completed);
    
    if (savedUser) {
      // 🔧 Si el usuario guardado no tiene onboarding_completed, asumir true para usuarios existentes
      if (savedUser.onboarding_completed === undefined) {
        console.log('⚠️ Usuario sin onboarding_completed, estableciendo como true (usuario existente)');
        savedUser.onboarding_completed = true;
        // Actualizar en localStorage
        this.apiService.setUserData(savedUser);
      }
      
      this.currentUserSubject.next(savedUser);
      // Verificar si el token necesita ser renovado
      this.checkAndRefreshToken();
      // Verificar datos del usuario desde el backend (esto lo actualizará con el valor real)
      this.checkAndRefreshUserData();
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
   * Verifica y actualiza los datos del usuario desde el backend
   * Esto asegura que cambios en lead_role (ej: expiración de membresía) se reflejen sin relogin
   */
  private async checkAndRefreshUserData(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        console.log('⚠️ No hay usuario actual para actualizar');
        return;
      }

      console.log('🔄 Verificando datos del usuario desde el backend...');
      
      // Consultar datos actualizados del usuario
      this.apiService.read(`leads/${currentUser.id}`).subscribe({
        next: (response: any) => {
          if (response && response.body) {
            const updatedUserData = response.body;
            
            // Mapear lead_onboarding_completed a onboarding_completed
            const onboardingCompleted = updatedUserData.lead_onboarding_completed !== undefined 
              ? updatedUserData.lead_onboarding_completed 
              : updatedUserData.onboarding_completed !== undefined
              ? updatedUserData.onboarding_completed
              : true; // Por defecto true para usuarios existentes
            
            // Verificar si cambió el lead_role o el onboarding_completed
            const roleChanged = updatedUserData.lead_role !== currentUser.role;
            const onboardingChanged = onboardingCompleted !== currentUser.onboarding_completed;
            
            if (roleChanged || onboardingChanged || currentUser.onboarding_completed === undefined) {
              if (roleChanged) {
                console.log(`🔄 lead_role actualizado: ${currentUser.role} → ${updatedUserData.lead_role}`);
              }
              if (onboardingChanged) {
                console.log(`🔄 onboarding_completed actualizado: ${currentUser.onboarding_completed} → ${onboardingCompleted}`);
              }
              if (currentUser.onboarding_completed === undefined) {
                console.log(`✅ onboarding_completed establecido: ${onboardingCompleted}`);
              }
              
              // Actualizar el usuario con los nuevos datos
              const updatedUser: User = {
                ...currentUser,
                role: updatedUserData.lead_role,
                onboarding_completed: onboardingCompleted
              };
              
              this.updateCurrentUser(updatedUser);
              
              // Si el usuario perdió su membresía, mostrar notificación
              if (roleChanged && currentUser.role > 0 && updatedUserData.lead_role === 0) {
                this.showInfoToast('Tu membresía ha expirado. Ahora tienes acceso limitado.');
              }
            } else {
              console.log('✅ Datos del usuario sin cambios - role:', currentUser.role, 'onboarding:', onboardingCompleted);
            }
          }
          
          // Programar la próxima verificación (cada 5 minutos)
          this.scheduleUserDataRefresh();
        },
        error: (error) => {
          console.error('❌ Error al actualizar datos del usuario:', error);
          // Intentar de nuevo en 1 minuto si hubo error
          setTimeout(() => this.checkAndRefreshUserData(), 60 * 1000);
        }
      });
    } catch (error) {
      console.error('❌ Error en checkAndRefreshUserData:', error);
    }
  }

  /**
   * Programa la próxima actualización de datos del usuario
   */
  private scheduleUserDataRefresh(): void {
    // Limpiar cualquier timer anterior
    if (this.userDataRefreshTimer) {
      clearTimeout(this.userDataRefreshTimer);
    }

    // Actualizar cada 5 minutos
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
    
    console.log('⏰ Próxima actualización de datos del usuario en 5 minutos');
    
    this.userDataRefreshTimer = setTimeout(async () => {
      console.log('⏰ Timer ejecutado - actualizando datos del usuario...');
      await this.checkAndRefreshUserData();
    }, REFRESH_INTERVAL);
  }

  /**
   * Cancela la actualización automática de datos del usuario
   */
  private cancelUserDataRefresh(): void {
    if (this.userDataRefreshTimer) {
      clearTimeout(this.userDataRefreshTimer);
      this.userDataRefreshTimer = null;
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
        // El backend devuelve: { error: false, status: 200, body: { status: true, data: {...} } }
        if (response && response.body && response.body.status && response.body.data) {
          this.setAuthData(response.body.data);
          return true;
        }
        return false;
      }),
      tap(success => {
        if (success) {
          this.showSuccessToast(this.translate.instant('auth.toast.welcome-back'));
        } else {
          this.showErrorToast(this.translate.instant('auth.toast.invalid-credentials'));
        }
      })
    );
  }

  register(userData: any): Observable<boolean> {
    return this.apiService.register(userData).pipe(
      map((response: any) => {
        // El backend devuelve: { error: false, status: 200, body: { status: true, data: {...} } }
        if (response && response.body && response.body.status && response.body.data) {
          this.setAuthData(response.body.data);
          return true;
        }
        return false;
      }),
      tap(success => {
        if (success) {
          this.showSuccessToast(this.translate.instant('auth.toast.account-created'));
        } else {
          this.showErrorToast(this.translate.instant('auth.toast.account-creation-error'));
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
          this.showSuccessToast(this.translate.instant('auth.toast.welcome-back'));
        } else {
          this.showErrorToast(this.translate.instant('auth.toast.social-auth-error'));
        }
      })
    );
  }

  async logout(): Promise<void> {
    // Cancelar cualquier renovación programada
    this.cancelTokenRefresh();
    
    // Cancelar verificaciones de datos del usuario
    this.cancelUserDataRefresh();
    
    // Cerrar sesión en PaymentService
    await this.paymentService.logoutUser();
    console.log('👋 Usuario desconectado de PaymentService');
    
    this.apiService.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
    this.showSuccessToast(this.translate.instant('auth.toast.session-closed'));
  }

  isLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Fuerza la actualización de datos del usuario desde el backend
   * Útil para llamar después de acciones que pueden cambiar el lead_role (compras, cancelaciones, etc)
   */
  async forceRefreshUserData(): Promise<void> {
    console.log('🔄 Forzando actualización de datos del usuario...');
    await this.checkAndRefreshUserData();
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
      
      // 🔧 Mapear lead_onboarding_completed a onboarding_completed si existe
      const userData = authData.user;
      const userDataWithOnboarding: User = {
        ...userData,
        onboarding_completed: (userData as any).lead_onboarding_completed !== undefined 
          ? (userData as any).lead_onboarding_completed 
          : userData.onboarding_completed !== undefined
          ? userData.onboarding_completed
          : true // Por defecto true para usuarios existentes
      };
      
      console.log('✅ Usuario con onboarding_completed:', userDataWithOnboarding.onboarding_completed);
      
      // Guardar datos de usuario
      this.apiService.setUserData(userDataWithOnboarding);
      this.currentUserSubject.next(userDataWithOnboarding);
      
      // ✅ Identificar usuario en PaymentService de forma asíncrona (sin bloquear)
      // Esto evita que el login se demore esperando por RevenueCat
      if (userDataWithOnboarding && userDataWithOnboarding.id) {
        // No usar await para no bloquear el flujo de login
        this.paymentService.identifyUser(userDataWithOnboarding.id).then(() => {
          console.log('👤 Usuario identificado en PaymentService después del login');
        }).catch(error => {
          console.error('⚠️ Error identificando usuario en PaymentService (no crítico):', error);
        });
      }
      
      // Programar verificación periódica de datos del usuario
      this.scheduleUserDataRefresh();
      console.log('⏰ Verificación periódica de datos del usuario activada');
      
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

  private async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      position: 'top',
      color: 'warning',
      icon: 'information-circle-outline'
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