import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StarRatingComponent } from './star-rating/star-rating.component';
import {CountryPickerComponent} from './country-picker/country-picker.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NgArrayPipesModule } from 'ngx-pipes';

@NgModule({
  declarations: [StarRatingComponent,CountryPickerComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgArrayPipesModule,
    IonicModule
  ],
  exports:[StarRatingComponent,CountryPickerComponent]
})
export class ComponentsModule { }
