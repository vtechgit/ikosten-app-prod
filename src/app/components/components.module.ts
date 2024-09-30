import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StarRatingComponent } from './star-rating/star-rating.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [StarRatingComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports:[StarRatingComponent]
})
export class ComponentsModule { }
