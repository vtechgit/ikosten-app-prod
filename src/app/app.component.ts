import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import {TranslateService} from "@ngx-translate/core";
import {ApiService} from "./services/api.service";
import {AuthService} from "./services/auth.service";
import {PaymentService} from "./services/payment.service";
import { Device } from '@capacitor/device';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit  {

  availableLanguage:any;
  isLogged:boolean=false;
  isOnboarding:boolean=false;

  constructor(
    public platform: Platform,
    private translate: TranslateService,
    private api:ApiService,
    private authService:AuthService,
    private paymentService:PaymentService,
    private activatedRoute:ActivatedRoute,
    private router: Router
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
      
      // Initialize PaymentService for In-App Purchases (iOS/Android only)
      await this.initializePaymentService();
    })
  }

  private async initializePaymentService() {
    try {
      // Solo inicializar en plataformas nativas
      if (this.platform.is('ios') || this.platform.is('android')) {
        console.log('💳 Inicializando PaymentService...');
        
        // IMPORTANT: RevenueCat genera un API Key público diferente para cada plataforma
        // Obtenerlas de: app.revenuecat.com > Project > API Keys
        const iosApiKey = 'test_TzMElXoctpGwVuraqIGJcfVAAGf'; //appl_RpVMsKlHqPrYfXhCUXWhoXxWDUl
        const androidApiKey = 'test_TzMElXoctpGwVuraqIGJcfVAAGf';//goog_kuETDompNqmtFzGWtsZhJuvyIIQ
        
        const apiKey = this.platform.is('ios') ? iosApiKey : androidApiKey;
        
        await this.paymentService.initialize(apiKey);
        console.log('✅ PaymentService inicializado correctamente');
        
        // Si hay usuario logueado, identificarlo en RevenueCat
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          await this.paymentService.identifyUser(currentUser.id);
          console.log('👤 Usuario identificado en PaymentService');
        }
      } else {
        console.log('🌐 Plataforma web detectada, PaymentService no se inicializa');
      }
    } catch (error) {
      console.error('❌ Error inicializando PaymentService:', error);
      // No detener la app si falla la inicialización de pagos
    }
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

      // Detectar si el usuario está en la ruta de onboarding
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.isOnboarding = event.url.includes('/onboarding');
        console.log('🎯 Ruta actual:', event.url, '| Onboarding activo:', this.isOnboarding);
      });

      // Verificar estado inicial de la ruta
      this.isOnboarding = this.router.url.includes('/onboarding');
    }


}