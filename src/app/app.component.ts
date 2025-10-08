import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import {TranslateService} from "@ngx-translate/core";
import {ApiService} from "./services/api.service";
import {AuthService} from "./services/auth.service";
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
    private authService:AuthService,
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

    // Initialize language synchronously to prevent undefined language errors
    this.initializeLanguage();
  }

  private async initializeLanguage() {
    var languages = [];
    var languageToUse = 'es'; // Default to Spanish instead of English
    
    // Set default language immediately to prevent loading undefined.json
    this.translate.setDefaultLang('es');

    // Check if language is already stored
    const storedLang = localStorage.getItem('lang');
    if (storedLang && storedLang !== '' && storedLang !== null && storedLang !== 'undefined') {
      languageToUse = storedLang;
      this.translate.use(languageToUse);
      console.log('🌍 Using stored language:', languageToUse);
    } else {
      // Get device language asynchronously
      try {
        const deviceLang = await Device.getLanguageCode();
        if (deviceLang && deviceLang.value && deviceLang.value !== 'undefined') {
          languageToUse = deviceLang.value;
          console.log('📱 Using device language:', languageToUse);
        }
      } catch (error) {
        console.warn('⚠️ Could not get device language, using default:', error);
      }
      
      // Set the language
      this.translate.use(languageToUse);
      localStorage.setItem('lang', languageToUse);
    }

    // Load available languages from API (non-blocking)
    this.api.read('languages').subscribe(res=>{
      this.availableLanguage = res['body'];

      res['body'].forEach(element => {
        languages.push(element.code)
      });

      this.translate.addLangs(languages);
      
      // Update language international code
      this.availableLanguage.forEach(lang => {
        if(lang.code == languageToUse){
          localStorage.setItem('langIntl', lang.intl);
          console.log('✅ Language initialized:', lang.code, lang.intl);
        }
      });
    }, error => {
      console.error('❌ Error loading languages from API:', error);
      // Continue with default language if API fails
    })






    this.platform.ready().then(async () => {

      initializeApp(environment.firebaseConfig);

      //await FacebookLogin.initialize({ appId: '1482658515672892' });
    })
  }

    ngOnInit() {
      // Suscribirse al estado de autenticación del nuevo sistema de sesiones
      this.authService.currentUser$.subscribe(user => {
        this.isLogged = !!user;
        console.log('🔄 Estado de autenticación actualizado:', this.isLogged);
      });

      // Verificar el estado inicial usando el nuevo sistema
      this.isLogged = this.authService.isLoggedIn();
      console.log('🔍 Estado inicial de autenticación:', this.isLogged);
    }


}
