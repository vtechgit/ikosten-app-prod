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
    console.log('📋 Query params en ruta:', route.queryParams);
    
    // Preservar query params de la URL original durante la redirección
    const queryParams: any = { returnUrl: state.url };
    
    // Agregar lead_source si existe en los query params originales
    if (route.queryParams['lead_source']) {
      queryParams.lead_source = route.queryParams['lead_source'];
      console.log('✅ Preservando lead_source en redirección:', route.queryParams['lead_source']);
    }
    
    // Agregar utm_lead si existe en los query params originales
    if (route.queryParams['utm_lead']) {
      queryParams.utm_lead = route.queryParams['utm_lead'];
      console.log('✅ Preservando utm_lead en redirección:', route.queryParams['utm_lead']);
    }
    
    // Construir la ruta de login según la estructura de la app
    const loginRoute = state.url.startsWith('/customer') ? '/auth/login' : '/auth/login';
    
    router.navigate([loginRoute], { 
      queryParams: queryParams
    });
    return false;
  }
};
