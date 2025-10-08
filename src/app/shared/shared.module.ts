import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { DropFilesInputDirective } from './directives/drop-files-input.directive';
import {SlideComponent} from './slide/slide.component';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './header/header.component';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  declarations: [DropFilesInputDirective,SlideComponent,HeaderComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    TranslateModule,
    ComponentsModule
  ],
  exports:[ DropFilesInputDirective,SlideComponent,HeaderComponent]
})
export class SharedModule { }
