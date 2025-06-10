import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DropFilesInputDirective } from './directives/drop-files-input.directive';
import {SlideComponent} from './slide/slide.component';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../components/components.module';
import { HeaderComponent } from './header/header.component';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [DropFilesInputDirective,SlideComponent,HeaderComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    ComponentsModule,
    TranslateModule
  ],
  exports:[ DropFilesInputDirective,SlideComponent,HeaderComponent]
})
export class SharedModule { }
