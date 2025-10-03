import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RestorePasswordComponent } from './restore-password/restore-password.component';
import { ValidateComponent } from './validate/validate.component';
import { isLoggedGuard } from '../guards/is-logged.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [isLoggedGuard] // Solo usuarios NO autenticados
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [isLoggedGuard] // Solo usuarios NO autenticados
      },
      {
        path: 'restore-password',
        component: RestorePasswordComponent,
        canActivate: [isLoggedGuard] // Solo usuarios NO autenticados
      },
      {
        path: 'validate',
        component: ValidateComponent,
        canActivate: [isLoggedGuard] // Solo usuarios NO autenticados
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
