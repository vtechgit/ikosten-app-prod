import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    console.log('🔒 onboardingGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/auth/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();
  console.log('👤 onboardingGuard: Usuario actual:', currentUser);
  console.log('✅ onboardingGuard: onboarding_completed =', currentUser?.onboarding_completed);

  // Si el usuario no ha completado el onboarding, redirigir a onboarding
  if (!currentUser?.onboarding_completed) {
    console.log('❌ onboardingGuard: Onboarding no completado, redirigiendo a /onboarding');
    router.navigate(['/onboarding']);
    return false;
  }

  console.log('✅ onboardingGuard: Onboarding completado, permitiendo acceso');
  return true;
};