import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StarRatingComponent } from './star-rating/star-rating.component';
import {CountryPickerComponent} from './country-picker/country-picker.component';
import {SigInComponent} from './sig-in/sig-in.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SignUpComponent } from './sign-up/sign-up.component';
import {NgPipesModule} from 'ngx-pipes';
import { MembershipModalComponent } from './membership-modal/membership-modal.component';
import { NgxPayPalModule } from 'ngx-paypal';

@NgModule({
  declarations: [StarRatingComponent,CountryPickerComponent, SigInComponent, SignUpComponent, MembershipModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NgPipesModule,
    RouterModule,
    IonicModule,
    NgxPayPalModule
  ],
  exports:[
    StarRatingComponent,
    CountryPickerComponent,
    SigInComponent,
    SignUpComponent,
    MembershipModalComponent,
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ComponentsModule { }
