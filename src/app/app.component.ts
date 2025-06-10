import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import {TranslateService} from "@ngx-translate/core";
import {ApiService} from "./services/api.service";
import { Device } from '@capacitor/device';
import { ActivatedRoute } from '@angular/router'; 

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit  {

  availableLanguage:any;
  isLogged:boolean=false;

  constructor(
    public platform: Platform,
    private translate: TranslateService,
    private api:ApiService,
    private activatedRoute:ActivatedRoute  
  ) {
    this.activatedRoute.queryParams.subscribe(params=>{

      if(params['source']){
        localStorage.setItem('clientSource', params['source']);
        this.api.create('sources/register_visits',{source_name:params['source']}).subscribe(res=>{
          console.log('register visits ',res)
        })
      }
  
    })


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

    ngOnInit() {
      if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != ''){
        this.isLogged=true;
      }else{
        this.isLogged=false;

      }
    }


}
