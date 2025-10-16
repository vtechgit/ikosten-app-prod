import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages-routing.module';
import { LanguagePage } from './language/language.page';
import { MainPage } from './main/main.page';
import { MembershipsPage } from './memberships/memberships.page';
import { ProfilePage } from './profile/profile.page';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  declarations: [
    LanguagePage,
    MainPage,
    MembershipsPage,
    ProfilePage,
    OnboardingComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    TranslateModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ComponentsModule
  ]
})
export class PagesModule { }
