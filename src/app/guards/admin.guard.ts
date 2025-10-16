import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 adminGuard: Verificando acceso de administrador...');
  console.log('🔍 Estado de autenticación:', authService.isLoggedIn());
  console.log('👤 Usuario actual:', authService.getCurrentUser());

  if (!authService.isLoggedIn()) {
    console.log('❌ adminGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (authService.isAdmin()) {
    console.log('✅ adminGuard: Usuario es administrador, permitiendo acceso');
    return true;
  } else {
    console.log('❌ adminGuard: Usuario no tiene permisos de administrador');
    router.navigate(['/customer/trips']);
    return false;
  }
};