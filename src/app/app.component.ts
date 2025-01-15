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

  constructor(public platform: Platform, private translate: TranslateService, private api:ApiService) {
    
    
    this.api.read('languages').subscribe(res=>{
      var languages = [];
      res['body'].forEach(element => {
        languages.push(element.code)
      });
      this.translate.addLangs(languages);

    })
    var languageToUse = 'en';
    this.translate.setDefaultLang('en');

    if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
      let lang=localStorage.getItem('lang');
      this.translate.use(lang);

    }else{
      Device.getLanguageCode().then(lang=>{
        languageToUse = lang.value;
        this.translate.use(languageToUse);

      });
    }


    this.platform.ready().then(async () => {

      initializeApp(environment.firebaseConfig);

      //await FacebookLogin.initialize({ appId: '1482658515672892' });
    })
  }


}
