import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
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

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController
  ) {
    // Verificar si hay usuario guardado al inicializar
    const savedUser = this.apiService.getUserData();
    
    if (savedUser) {
      this.currentUserSubject.next(savedUser);
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

  logout(): void {
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

  private setAuthData(authData: AuthResponse): void {
    try {
      // Guardar tokens
      this.apiService.setToken(authData.tokens.accessToken);
      this.apiService.setRefreshToken(authData.tokens.refreshToken);
      
      // Guardar datos de usuario
      this.apiService.setUserData(authData.user);
      this.currentUserSubject.next(authData.user);
      
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