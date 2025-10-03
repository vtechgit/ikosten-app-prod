import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const currentUser = authService.getCurrentUser();

  // Si el usuario no ha completado el onboarding, redirigir a onboarding
  if (!currentUser?.onboarding_completed) {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};