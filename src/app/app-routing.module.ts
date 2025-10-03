import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { notLoggedGuard } from "./guards/not-logged.guard";
import { isLoggedGuard } from "./guards/is-logged.guard";

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
    canActivate: [notLoggedGuard] // Proteger rutas principales con autenticación requerida
  },
  {
    path: 'main',
    redirectTo: '/customer/trips',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthPageModule),
    canActivate: [isLoggedGuard] // Solo usuarios NO autenticados pueden acceder al login
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

/*
const routes: Routes = [
  {
    path: 'customer',
    component: TabsPage,
    children: [
      {
        path: 'trips',
        loadChildren: () => import('../pages/main/main.module').then(m => m.MainPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../pages/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'login',
        loadChildren: () => import('../pages/login/login.module').then(m => m.LoginPageModule)
      },
      {
        path: 'language',
        loadChildren: () => import('../pages/language/language.module').then(m => m.LanguagePageModule)
      },
      {
        path: 'memberships',
        loadChildren: () => import('../pages/memberships/memberships.module').then(m => m.MembershipsPageModule)
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
*/