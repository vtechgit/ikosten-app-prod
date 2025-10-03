import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 managerGuard: Verificando acceso de manager...');
  console.log('🔍 Estado de autenticación:', authService.isLoggedIn());
  console.log('👤 Usuario actual:', authService.getCurrentUser());

  if (!authService.isLoggedIn()) {
    console.log('❌ managerGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (authService.isManager()) {
    console.log('✅ managerGuard: Usuario es manager o superior, permitiendo acceso');
    return true;
  } else {
    console.log('❌ managerGuard: Usuario no tiene permisos de manager');
    router.navigate(['/customer/trips']);
    return false;
  }
};