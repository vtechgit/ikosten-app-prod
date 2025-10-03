import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ComponentsModule} from './components/components.module';
import { PdfViewerModule } from 'ng2-pdf-viewer'; // <- import PdfViewerModule

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// import ngx-translate and the http loader
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgxPayPalModule } from 'ngx-paypal';
import {SharedModule} from './shared/shared.module';
import { PagesModule } from './pages/pages.module';


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    ComponentsModule,
    NgxPayPalModule,
    PdfViewerModule,
    IonicModule.forRoot({ mode: 'ios' }), 
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    PagesModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
  })],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}