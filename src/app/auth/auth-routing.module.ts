import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import {RestorePasswordComponent} from './restore-password/restore-password.component';
import {ValidateComponent} from './validate/validate.component';

const routes: Routes = [
  {
    path: 'auth',
    children:[
      {
        path:'login',
        component:LoginComponent,
      },
      {
         path:'register',
          component:RegisterComponent,
      },
      {
        path:'restore-password',
        component:RestorePasswordComponent,
      },
      {
        path:'validate',
        component:ValidateComponent,
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
