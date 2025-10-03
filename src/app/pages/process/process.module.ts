import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

import { ProcessPageRoutingModule } from './process-routing.module';

import { ProcessPage } from './process.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    ProcessPageRoutingModule
  ],
  declarations: [ProcessPage]
})
export class ProcessPageModule {}
