import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DropFilesInputDirective } from './directives/drop-files-input.directive';

@NgModule({
  declarations: [DropFilesInputDirective],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports:[ DropFilesInputDirective]
})
export class SharedModule { }
