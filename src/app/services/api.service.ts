import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private endpoint = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un token al inicializar
    this.checkAuthenticationStatus();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  private getFormHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // Token management
  setToken(token: string): void {
    console.log('🔑 ApiService.setToken llamado');
    console.log('🔑 Token a guardar:', token.substring(0, 20) + '...');
    console.log('🔑 Storage key:', environment.security.tokenStorageKey);
    
    localStorage.setItem(environment.security.tokenStorageKey, token);
    console.log('✅ Token guardado en localStorage');
    
    this.isAuthenticatedSubject.next(true);
    console.log('✅ isAuthenticatedSubject actualizado a true');
    
    // Verificar que se guardó correctamente
    const savedToken = localStorage.getItem(environment.security.tokenStorageKey);
    console.log('🔍 Verificación - Token guardado:', !!savedToken);
  }

  getToken(): string | null {
    return localStorage.getItem(environment.security.tokenStorageKey);
  }

  setRefreshToken(refreshToken: string): void {
    console.log('🔄 ApiService.setRefreshToken llamado');
    console.log('🔄 Refresh token a guardar:', refreshToken.substring(0, 20) + '...');
    console.log('🔄 Storage key:', environment.security.refreshTokenStorageKey);
    
    localStorage.setItem(environment.security.refreshTokenStorageKey, refreshToken);
    console.log('✅ Refresh token guardado en localStorage');
    
    // Verificar que se guardó correctamente
    const savedToken = localStorage.getItem(environment.security.refreshTokenStorageKey);
    console.log('🔍 Verificación - Refresh token guardado:', !!savedToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.security.refreshTokenStorageKey);
  }

  setUserData(userData: any): void {
    console.log('👤 ApiService.setUserData llamado');
    console.log('👤 Datos a guardar:', userData);
    console.log('👤 Storage key:', environment.security.userStorageKey);
    
    localStorage.setItem(environment.security.userStorageKey, JSON.stringify(userData));
    console.log('✅ Datos de usuario guardados en localStorage');
    
    // Verificar que se guardó correctamente
    const savedData = localStorage.getItem(environment.security.userStorageKey);
    console.log('🔍 Verificación - Datos guardados:', !!savedData);
    console.log('🔍 Datos recuperados:', savedData ? JSON.parse(savedData) : null);
  }

  getUserData(): any {
    const userData = localStorage.getItem(environment.security.userStorageKey);
    return userData ? JSON.parse(userData) : null;
  }

  clearAuthData(): void {
    localStorage.removeItem(environment.security.tokenStorageKey);
    localStorage.removeItem(environment.security.refreshTokenStorageKey);
    localStorage.removeItem(environment.security.userStorageKey);
    this.isAuthenticatedSubject.next(false);
  }

  private checkAuthenticationStatus(): void {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  // API Methods
  create(endpoint: string, params: any = {}): Observable<any> {
    const url = `${this.endpoint}/${endpoint}`;
    return this.http.post(url, params, { headers: this.getAuthHeaders() });
  }

  read(endpoint: string, params: any = {}): Observable<any> {
    const url = `${this.endpoint}/${endpoint}`;
    params._ = Date.now(); // Cache busting
    return this.http.get(url, { 
      headers: this.getAuthHeaders(), 
      params: params 
    });
  }

  update(endpoint: string, params: any = {}): Observable<any> {
    const url = `${this.endpoint}/${endpoint}`;
    return this.http.put(url, params, { headers: this.getAuthHeaders() });
  }

  delete(endpoint: string, params: any = {}): Observable<any> {
    const url = `${this.endpoint}/${endpoint}`;
    return this.http.delete(url, { 
      headers: this.getAuthHeaders(), 
      params: params 
    });
  }

  sendForm(endpoint: string, form: FormData): Observable<any> {
    const url = `${this.endpoint}/${endpoint}`;
    return this.http.post(url, form, { headers: this.getFormHeaders() });
  }

  // Auth specific methods
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.endpoint}/leads/auth`, credentials);
  }

  loginSocial(socialData: any): Observable<any> {
    console.log('🔗 ApiService.loginSocial llamado con datos:', socialData);
    console.log('🌐 Endpoint completo:', `${this.endpoint}/leads/auth/social`);
    const headers = this.getAuthHeaders();
    console.log('📋 Headers a enviar:', headers);
    
    return this.http.post(`${this.endpoint}/leads/auth/social`, socialData, { headers }).pipe(
      tap((response) => {
        console.log('✅ loginSocial - Respuesta exitosa:', response);
      }),
      catchError((error) => {
        console.error('💥 loginSocial - Error:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.endpoint}/leads/registerNew`, userData);
  }

  refreshAccessToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.endpoint}/leads/refresh-token`, { refreshToken });
  }

  logout(): void {
    this.clearAuthData();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
