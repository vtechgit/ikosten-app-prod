import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import {TranslateService} from "@ngx-translate/core";
import {ApiService} from "./services/api.service";
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  availableLanguage:any;

  constructor(public platform: Platform, private translate: TranslateService, private api:ApiService) {
    
    var languages = [];
    var languageToUse = 'en';
    this.translate.setDefaultLang('en');

    this.api.read('languages').subscribe(res=>{
      this.availableLanguage = res['body'];

      res['body'].forEach(element => {
        languages.push(element.code)
      });

      this.translate.addLangs(languages);
      if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
        languageToUse=localStorage.getItem('lang');
  
        this.translate.use(languageToUse);
        console.log('main : entra a localstorage')
        this.availableLanguage.forEach(lang => {
          if(lang.code == languageToUse){
            localStorage.setItem('langIntl', lang.intl);
          }
        });
  
      }else{
  
        Device.getLanguageCode().then(lang=>{
          languageToUse = lang.value;
          this.translate.use(languageToUse);  
          
            this.availableLanguage.forEach(lang => {
              console.log(lang)
            if(lang.code == languageToUse){
              console.log('main : lang found', lang.code)
              
              localStorage.setItem('langIntl', lang.intl);
            }
          });
        });
      }
    })






    this.platform.ready().then(async () => {

      initializeApp(environment.firebaseConfig);

      //await FacebookLogin.initialize({ appId: '1482658515672892' });
    })
  }


}
