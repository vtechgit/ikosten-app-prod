import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const isLoggedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔓 isLoggedGuard: Verificando si usuario NO debe estar autenticado...');
  console.log('🔍 Estado de autenticación:', authService.isLoggedIn());
  console.log('👤 Usuario actual:', authService.getCurrentUser());

  if (authService.isLoggedIn()) {
    console.log('❌ isLoggedGuard: Usuario ya autenticado, redirigiendo a área principal');
    
    // Redirigir al área principal de la aplicación
    const currentUser = authService.getCurrentUser();
    if (currentUser) {

        router.navigate(['/customer/trips']);
      
    } else {
      router.navigate(['/customer/trips']);
    }
    
    return false;
  } else {
    console.log('✅ isLoggedGuard: Usuario no autenticado, permitiendo acceso a página pública');
    return true;
  }
};
