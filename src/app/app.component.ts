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
    console.log('🚀 app.component constructor iniciado');
    
    // Capturar params de la URL inicial INMEDIATAMENTE
    const initialUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 URL inicial completa:', initialUrl);
    
    // Convertir URLSearchParams a objeto simple para logging
    const paramsObj: any = {};
    urlParams.forEach((value, key) => {
      paramsObj[key] = value;
    });
    console.log('🔍 Query params en URL inicial:', paramsObj);
    
    // Procesar params de la URL inicial usando URLSearchParams
    this.processUrlSearchParams(urlParams);
    
    // Capturar query params después de cada navegación de Angular
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log('🔄 NavigationEnd detectado:', event.url);
      this.captureQueryParamsFromUrl(event.url);
    });
    
    // También capturar usando ActivatedRoute (para rutas de Angular)
    this.activatedRoute.queryParams.subscribe(params => {
      console.log('📋 ActivatedRoute.queryParams:', params);
      if (params && Object.keys(params).length > 0) {
        this.processQueryParams(params);
      }
    });

    // Initialize language synchronously to prevent undefined language errors
    this.initializeLanguage();
  }

  /**
   * Procesa params desde URLSearchParams (URL nativa del navegador)
   * @param urlParams - URLSearchParams object
   */
  private processUrlSearchParams(urlParams: URLSearchParams) {
    const params: any = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    
    if (Object.keys(params).length > 0) {
      console.log('📦 Procesando params desde URLSearchParams:', params);
      this.processQueryParams(params);
    }
  }

  /**
   * Captura query params desde una URL string
   * @param url - URL completa o path con query string
   */
  private captureQueryParamsFromUrl(url: string) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);
      
      if (params.toString()) {
        console.log('🔗 Capturando params de URL:', url);
        this.processUrlSearchParams(params);
      }
    } catch (error) {
      console.warn('⚠️ Error procesando URL:', url, error);
    }
  }

  /**
   * Captura query params de la ruta actual usando ActivatedRoute
   * Se ejecuta después de cada navegación
   */
  private captureQueryParams() {
    const params = this.activatedRoute.snapshot.queryParams;
    if (params && Object.keys(params).length > 0) {
      console.log('📋 Query params detectados después de navegación:', params);
      this.processQueryParams(params);
    }
  }

  /**
   * Procesa y guarda los query params relevantes
   * @param params - Query parameters de la URL
   */
  private processQueryParams(params: any) {
    console.log('🔍 processQueryParams llamado con:', params);
    console.log('🔍 Tipo de params:', typeof params);
    console.log('🔍 Keys de params:', Object.keys(params));
    
    // Sistema de tracking legacy (source)
    if(params['source'] && params['source'] != ''){
      localStorage.setItem('clientSource', params['source']);
      console.log('✅ clientSource guardado:', params['source']);
      this.api.create('sources/register_visits',{source_name:params['source']}).subscribe(res=>{
        console.log('✅ register visits:', res);
      });
    }
    
    // Sistema de tracking moderno (lead_source)
    if(params['lead_source'] && params['lead_source'] != ''){
      localStorage.setItem('lead_source', params['lead_source']);
      console.log('✅✅✅ lead_source guardado en localStorage desde app.component:', params['lead_source']);
      console.log('✅✅✅ Verificando inmediatamente:', localStorage.getItem('lead_source'));
    } else {
      console.log('⚠️ lead_source NO encontrado en params');
      console.log('⚠️ Valor de params["lead_source"]:', params['lead_source']);
    }

    // Sistema de invitación (utm_lead)
    if(params['utm_lead'] && params['utm_lead'] != ''){
      localStorage.setItem('utm_lead', params['utm_lead']);
      console.log('✅ utm_lead guardado en localStorage desde app.component:', params['utm_lead']);
    }
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
      // Solo inicializar en plataformas nativas (NO en mobileweb = navegador móvil)
      const isNativePlatform = (this.platform.is('ios') || this.platform.is('android')) && 
                                !this.platform.is('mobileweb') &&
                                (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid'));
      
      if (isNativePlatform) {
        console.log('💳 Inicializando PaymentService...');
        
        // IMPORTANT: RevenueCat genera un API Key público diferente para cada plataforma
        // Obtenerlas de: app.revenuecat.com > Project > API Keys
        const iosApiKey = 'appl_RpVMsKlHqPrYfXhCUXWhoXxWDUl'; //
        const androidApiKey = 'goog_kuETDompNqmtFzGWtsZhJuvyIIQ';//
        
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
      console.log('🎯 app.component ngOnInit iniciado');
      
      // Capturar params una vez más en ngOnInit por si el constructor fue muy temprano
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.toString()) {
        // Convertir URLSearchParams a objeto simple para logging
        const paramsObj: any = {};
        urlParams.forEach((value, key) => {
          paramsObj[key] = value;
        });
        console.log('🔄 Re-capturando params en ngOnInit:', paramsObj);
        this.processUrlSearchParams(urlParams);
      }
      
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