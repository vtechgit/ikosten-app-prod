import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const notLoggedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 notLoggedGuard: Verificando autenticación...');
  console.log('🔍 Estado de autenticación:', authService.isLoggedIn());
  console.log('👤 Usuario actual:', authService.getCurrentUser());

  if (authService.isLoggedIn()) {
    console.log('✅ notLoggedGuard: Usuario autenticado, permitiendo acceso');
    return true;
  } else {
    console.log('❌ notLoggedGuard: Usuario no autenticado, redirigiendo a login');
    console.log('🔄 URL de retorno:', state.url);
    
    // Construir la ruta de login según la estructura de la app
    const loginRoute = state.url.startsWith('/customer') ? '/auth/login' : '/auth/login';
    
    router.navigate([loginRoute], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
