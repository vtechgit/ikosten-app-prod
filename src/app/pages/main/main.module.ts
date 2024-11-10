import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MainPageRoutingModule } from './main-routing.module';
import {SharedModule} from '../../shared/shared.module';
import { MainPage } from './main.page';
import {ComponentsModule} from '../../components/components.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    IonicModule,
    MainPageRoutingModule,
    ComponentsModule,
    PdfViewerModule
  ],
  declarations: [MainPage]
})
export class MainPageModule {}
