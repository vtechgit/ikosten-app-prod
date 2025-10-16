import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { notLoggedGuard } from '../../guards/not-logged.guard';
import { onboardingGuard } from '../../guards/onboarding.guard';

import { ProcessPage } from './process.page';

const routes: Routes = [
  {
    path: ':id',
    component: ProcessPage,
    canActivate: [notLoggedGuard, onboardingGuard] // Usuario debe estar autenticado y haber completado onboarding
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProcessPageRoutingModule {}
