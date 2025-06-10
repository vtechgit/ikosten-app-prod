import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MainPage } from './main/main.page';
import { ProfilePage } from './profile/profile.page';
import { LanguagePage } from './language/language.page';
import { MembershipsPage } from './memberships/memberships.page';

const routes: Routes = [
  {
    path: 'customer',
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
