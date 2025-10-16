import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AuthPageRoutingModule } from './auth-routing.module';

import { AuthPage } from './auth.page';
import { LoginComponent } from './login/login.component';
import { ComponentsModule } from '../components/components.module';
import {RegisterComponent} from './register/register.component';
import { RouterModule } from '@angular/router';
import {RestorePasswordComponent} from './restore-password/restore-password.component';
import { TranslateModule } from '@ngx-translate/core';
import {ValidateComponent} from './validate/validate.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    AuthPageRoutingModule,
    ComponentsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  declarations: [AuthPage,LoginComponent,RegisterComponent,RestorePasswordComponent,ValidateComponent]
})
export class AuthPageModule {}
