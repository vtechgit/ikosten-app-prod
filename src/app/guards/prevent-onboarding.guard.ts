import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const preventOnboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar que el usuario esté autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();

  // Si el usuario ya completó el onboarding, no puede acceder nuevamente
  if (currentUser?.onboarding_completed) {
    router.navigate(['/customer/trips']);
    return false;
  }

  return true;
};