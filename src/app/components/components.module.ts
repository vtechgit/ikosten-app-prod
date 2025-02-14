import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StarRatingComponent } from './star-rating/star-rating.component';
import {CountryPickerComponent} from './country-picker/country-picker.component';
import {SigInComponent} from './sig-in/sig-in.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NgArrayPipesModule } from 'ngx-pipes';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [StarRatingComponent,CountryPickerComponent, SigInComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgArrayPipesModule,
    TranslateModule,
    IonicModule
  ],
  exports:[StarRatingComponent,CountryPickerComponent, SigInComponent]
})
export class ComponentsModule { }
