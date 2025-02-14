import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MembershipsPageRoutingModule } from './memberships-routing.module';

import { MembershipsPage } from './memberships.page';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPayPalModule } from 'ngx-paypal';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    NgxPayPalModule,
    TranslateModule,
    MembershipsPageRoutingModule
  ],
  declarations: [MembershipsPage]
})
export class MembershipsPageModule {}
