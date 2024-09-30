import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import {ComponentsModule} from './components/components.module';
import { PdfViewerModule } from 'ng2-pdf-viewer'; // <- import PdfViewerModule

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule,ComponentsModule,PdfViewerModule,    IonicModule.forRoot({ mode: 'ios' }), AppRoutingModule,BrowserAnimationsModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
