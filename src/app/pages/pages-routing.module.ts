import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPage } from './main/main.page';
import { ProfilePage } from './profile/profile.page';
import { LanguagePage } from './language/language.page';
import { MembershipsPage } from './memberships/memberships.page';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { notLoggedGuard } from '../guards/not-logged.guard';
import { onboardingGuard } from '../guards/onboarding.guard';
import { preventOnboardingGuard } from '../guards/prevent-onboarding.guard';

const routes: Routes = [
  {
    path: 'onboarding',
    component: OnboardingComponent,
    canActivate: [notLoggedGuard, preventOnboardingGuard] // Usuario debe estar autenticado pero no haber completado onboarding
  },
  {
    path: 'customer',
    canActivate: [notLoggedGuard, onboardingGuard], // Usuario autenticado + onboarding completado
    children: [
      {
        path: 'trips',
        component: MainPage
      },
      {
        path: 'profile',
        component: ProfilePage
      },
      {
        path: 'language',
        component: LanguagePage
      },
      {
        path: 'memberships',
        component: MembershipsPage
      },
      {
        path: 'export',
        loadChildren: () => import('./export/export.module').then( m => m.ExportPageModule)
      },
      {
        path: 'process',
        loadChildren: () => import('./process/process.module').then( m => m.ProcessPageModule)
      },
      {
        path: '',
        redirectTo: '/customer/trips',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/customer/trips',
    pathMatch: 'full'
  }


];
@NgModule({
 imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
