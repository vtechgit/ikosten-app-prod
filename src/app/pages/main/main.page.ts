import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { trigger, transition, style, animate } from '@angular/animations';

const enterTransition = transition(':enter', [
  style({ opacity: 0 }),
  animate('0.2s 0.1s ease-in', style({ opacity: 1 }))
]);

const fadeIn = trigger('fadeIn', [enterTransition]);

@Component({
  selector: 'app-main',
  standalone: false,
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  animations: [fadeIn]
})
export class MainPage implements OnInit {
  
  // Alert buttons
  alertButtons = ['buttons.accept'];
  
  public deleteReceiptAlertButtons = [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteReceipt();
      }
    }
  ];

  public deleteAllReceiptsAlertButtons = [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {}
    },
    {
      text: 'buttons.delete-all',
      role: 'confirm',
      cssClass: 'alert-button-danger',
      handler: () => {
        this.confirmDeleteAllReceipts();
      }
    }
  ];

  // Variables de usuario
  userSession: any;
  selectedLanguage: string = 'es';
  dateLocale: string = 'es-MX';
  languagesLoaded: boolean = false;
  availableLanguages: any = [];

  // Variables de recibos
  userCountries: any[] = []; // Array de países del usuario con sus recibos
  selectedCountryIndex: number = 0;
  currentCountryData: any = null;
  currencies: any = [];
  currencyBlockSelected: any;
  isLoadingReceipts: boolean = true; // Indicador de carga inicial
  
  // Variables de paginación
  currentPage: number = 1;
  pageLimit: number = 20;
  hasMoreReceipts: boolean = false;
  totalReceipts: number = 0;
  isLoadingMore: boolean = false;

  // Variables de subida de archivos
  imagesToUpload: any[] = [];
  uploadingFiles: any[] = []; // Array para trackear archivos en upload
  isUploading: boolean = false;
  isUploadingOther: boolean = true;
  isAddingNewCountry: boolean = false;
  uploadMessage: string = 'Subir archivo';
  imageMimes: string[] = ['image/png', 'image/jpeg'];
  pdfMimes: string[] = ['application/pdf'];

  // Variables de modales y alertas
  showPicker: boolean = false;
  pickerTitle: string = '';
  pickerType: string = '';
  pickerOptions: any = [];
  isAlertDeleteReceipt: boolean = false;
  isAlertDeleteAllReceipts: boolean = false;
  receiptToDelete: string = '';
  showAlertTime: boolean = false;
  showMembershipModal: boolean = false;
  uploadLimitData: any = null;
  
  // Variables de polling para análisis
  pollingInterval: any = null;
  pollingAttempts: number = 0;
  maxPollingAttempts: number = 120; // 120 intentos = hasta ~8 minutos con backoff progresivo
  pollingIntervalTime: number = 2000; // 2 segundos inicial
  pollingBackoffMultiplier: number = 1; // Multiplicador para backoff progresivo
  processingReceiptIds: Set<string> = new Set(); // IDs de recibos en procesamiento

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router,
    private translate: TranslateService,
    public platform: Platform,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Obtener sesión de usuario primero
    if (this.api.isLoggedIn()) {
      this.userSession = this.api.getUserData();
      console.log('✅ User session loaded:', this.userSession);
    } else {
      // Redirigir a login si no está autenticado
      this.router.navigate(['/customer/login']);
      return;
    }

    // Inicializar idioma antes de cualquier llamada al API
    this.initializeLanguage();
    
    // Cargar datos solo después de tener el idioma
    this.setDateLocale();
    this.loadUserReceipts();
    
    // loadCurrencies() se llamará desde translateWords() después de cargar los idiomas
  }

  ionViewWillEnter() {
    if (localStorage.getItem('langIntl')) {
      this.dateLocale = localStorage.getItem('langIntl') || 'es-MX';
    }

    // Cargar idiomas y currencies en el primer ingreso
    if (!this.languagesLoaded) {
      this.getLanguages();
    } else {
      // Si ya se cargaron los idiomas, solo cargar currencies si no están cargados
      if (!this.currencies || this.currencies.length === 0) {
        this.loadCurrencies();
      }
    }

    // Recargar recibos cuando se vuelve a la página
    if (this.userSession) {
      this.loadUserReceipts();
    }

    // Asegurar que el primer país esté seleccionado si hay países disponibles
    if (this.userCountries && this.userCountries.length > 0 && !this.currentCountryData) {
      this.selectCountry(0);
    }
  }
  
  ionViewWillLeave() {
    // Detener polling cuando el usuario sale de la página
    console.log('👋 Usuario saliendo de la página, deteniendo polling...');
    this.stopPollingForAnalysis();
  }
  
  ngOnDestroy() {
    // Limpiar recursos cuando se destruye el componente
    this.stopPollingForAnalysis();
  }

  initializeLanguage() {
    this.selectedLanguage = localStorage.getItem('lang') || 
                           this.translate.currentLang || 
                           this.translate.defaultLang || 
                           'es';
    this.translate.use(this.selectedLanguage);
  }

  getLanguages() {
    if (this.languagesLoaded) return;
    
    this.api.read('languages').subscribe({
      next: (res) => {
        this.availableLanguages = res['body'];
        this.languagesLoaded = true;

        if (this.api.isLoggedIn() && this.userSession) {
          if (this.userSession.lead_preferred_language) {
            this.selectedLanguage = this.userSession.lead_preferred_language;
            this.translate.use(this.selectedLanguage);
            this.translateWords();
          } else {
            this.applyStoredOrDeviceLanguage();
          }
        } else {
          this.applyStoredOrDeviceLanguage();
        }
      },
      error: (error) => {
        console.error('Error loading languages:', JSON.stringify(error));
        this.selectedLanguage = 'en';
        this.translate.use(this.selectedLanguage);
      }
    });
  }

  applyStoredOrDeviceLanguage() {
    if (localStorage.getItem('lang')) {
      this.selectedLanguage = localStorage.getItem('lang') || 'es';
      this.translate.use(this.selectedLanguage);
      this.translateWords();
    } else {
      Device.getLanguageCode().then(lang => {
        this.selectedLanguage = lang.value;
        this.translate.use(this.selectedLanguage);
        this.translateWords();
      });
    }
  }

  translateWords() {
    // Cargar currencies
    this.loadCurrencies();
    
    // Ya no es necesario traducir los botones aquí
    // Los alerts ahora se traducen dinámicamente cuando se abren
    
    // Mantener la traducción del botón accept si se usa en otro lugar
    this.translate.get('buttons.accept').subscribe((text: string) => {
      this.alertButtons[0] = text;
    });
  }

  loadCurrencies() {
    // Asegurar que tengamos un idioma válido
    const lang = this.selectedLanguage || this.translate.currentLang || this.translate.defaultLang || 'es';
    
    console.log('🌍 Loading currencies for language:', lang);
    
    this.api.read('countries/' + lang).subscribe({
      next: (res) => {
        if (res['status'] == 200) {
          this.currencies = res['body'];
          console.log('✅ Currencies loaded:', this.currencies?.length, 'countries');
        }
      },
      error: (error) => {
        console.error('❌ Error loading currencies:', error);
        // No mostrar toast, solo log en consola
        // Si falla, intentar con idioma por defecto
        if (lang !== 'es') {
          console.log('🔄 Retrying with default language: es');
          this.api.read('countries/es').subscribe({
            next: (res) => {
              if (res['status'] == 200) {
                this.currencies = res['body'];
                console.log('✅ Currencies loaded with fallback:', this.currencies?.length, 'countries');
              }
            },
            error: (err) => {
              console.error('❌ Error loading currencies with fallback:', err);
            }
          });
        }
      }
    });
  }

  async setDateLocale() {
    const deviceLanguage = await Device.getLanguageCode();
    const currentLang = this.translate.currentLang || this.translate.defaultLang;
    
    const localeMap: { [key: string]: string } = {
      'es': 'es-ES',
      'en': 'en-US',
      'pt': 'pt-BR',
      'it': 'it-IT',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA'
    };

    this.dateLocale = localeMap[currentLang] || localeMap[deviceLanguage.value] || 'en-US';
  }

  // ============================================
  // FUNCIONES DE GESTIÓN DE RECIBOS
  // ============================================

  loadUserReceipts(resetPagination: boolean = true) {
    if (!this.userSession || !this.userSession.id) {
      console.error('❌ No user session available');
      this.isLoadingReceipts = false;
      return;
    }

    // Resetear paginación si es una carga inicial
    if (resetPagination) {
      this.currentPage = 1;
      this.userCountries = [];
    }

    console.log('🔄 Loading receipts for user:', this.userSession.id, 'Page:', this.currentPage);
    this.isLoadingReceipts = resetPagination;
    this.isLoadingMore = !resetPagination;
    
    this.api.read(`userReceipts/${this.userSession.id}/grouped?page=${this.currentPage}&limit=${this.pageLimit}`).subscribe({
      next: (res) => {
        if (res['status'] == 200) {
          const responseData = res['body'];
          const newCountries = responseData.data || responseData; // Compatibilidad con respuesta antigua y nueva
          const pagination = responseData.pagination;
          
          console.log('✅ User receipts loaded:', newCountries);
          
          if (pagination) {
            this.hasMoreReceipts = pagination.hasMore;
            this.totalReceipts = pagination.totalReceipts;
            console.log('📊 Pagination info:', {
              currentPage: pagination.currentPage,
              hasMore: pagination.hasMore,
              totalReceipts: pagination.totalReceipts
            });
          }
          
          // Combinar recibos por país
          if (this.currentPage === 1) {
            this.userCountries = newCountries;
          } else {
            // Agregar nuevos recibos a países existentes o crear nuevos
            newCountries.forEach((newCountry: any) => {
              const existingCountry = this.userCountries.find(c => c.country === newCountry.country);
              if (existingCountry) {
                existingCountry.receipts = [...existingCountry.receipts, ...newCountry.receipts];
              } else {
                this.userCountries.push(newCountry);
              }
            });
          }
          
          // Si hay países, seleccionar el primero
          if (this.userCountries && this.userCountries.length > 0 && resetPagination) {
            this.selectCountry(0);
            
            // ✅ NUEVO: Verificar si hay recibos en estado "analizando" al cargar la página
            setTimeout(() => {
              const hasProcessingReceipts = this.checkForProcessingReceipts();
              if (hasProcessingReceipts) {
                console.log('⚠️ Se detectaron recibos en estado analizando, iniciando polling automático...');
                this.startPollingForAnalysis();
              }
            }, 500);
            
          } else if (!resetPagination && this.currentCountryData) {
            // ✅ CORREGIDO: Actualizar el país actual PRESERVANDO la selección
            // Durante polling, mantener el país seleccionado incluso si temporalmente no viene en la respuesta
            const currentCountry = this.currentCountryData.country;
            const updatedCountry = this.userCountries.find(c => c.country === currentCountry);
            
            if (updatedCountry) {
              // Actualizar con los nuevos datos
              this.currentCountryData = updatedCountry;
              console.log('✅ País actualizado durante polling:', currentCountry);
            } else {
              // Si el país ya no existe en la respuesta, buscar por índice como fallback
              const fallbackCountry = this.userCountries[this.selectedCountryIndex];
              if (fallbackCountry) {
                this.currentCountryData = fallbackCountry;
                console.log('⚠️ País no encontrado por nombre, usando fallback por índice:', fallbackCountry.country);
              } else {
                // Último recurso: mantener currentCountryData como está (no establecer en null)
                console.log('⚠️ No se puede actualizar país, manteniendo datos actuales');
              }
            }
          } else if (!resetPagination && !this.currentCountryData && this.userCountries.length > 0) {
            // Si no había país seleccionado pero ahora hay países, seleccionar el primero
            this.selectCountry(0);
          }
        }
        this.isLoadingReceipts = false;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('❌ Error loading user receipts:', JSON.stringify(error));
        if (resetPagination) {
          this.userCountries = [];
          this.currentCountryData = null;
        }
        this.isLoadingReceipts = false;
        this.isLoadingMore = false;
      }
    });
  }
  
  /**
   * Inicia polling OPTIMIZADO para verificar el estado de análisis de recibos
   * Usa un endpoint ligero que solo consulta IDs y status, reduciendo carga del servidor
   * Implementa backoff progresivo: 2s -> 3s -> 5s -> 10s para archivos que tardan mucho
   */
  startPollingForAnalysis() {
    // Limpiar cualquier polling anterior
    this.stopPollingForAnalysis();
    
    this.pollingAttempts = 0;
    this.pollingBackoffMultiplier = 1; // Resetear backoff
    console.log('🔄 Iniciando polling OPTIMIZADO para verificar análisis de recibos...');
    
    // Ejecutar inmediatamente la primera vez
    this.checkAnalysisStatusLightweight();
    
    this.pollingInterval = setInterval(() => {
      this.pollingAttempts++;
      
      // Calcular intervalo con backoff progresivo (más paciente para Azure)
      let currentInterval = this.pollingIntervalTime * this.pollingBackoffMultiplier;
      
      // Aplicar backoff progresivo gradual
      if (this.pollingAttempts === 15) {
        this.pollingBackoffMultiplier = 1.5; // 3 segundos después de 15 intentos (30s)
        console.log('⏱️ Aumentando intervalo de polling a 3 segundos (backoff)');
      } else if (this.pollingAttempts === 30) {
        this.pollingBackoffMultiplier = 2.5; // 5 segundos después de 30 intentos (75s)
        console.log('⏱️ Aumentando intervalo de polling a 5 segundos (backoff)');
      } else if (this.pollingAttempts === 50) {
        this.pollingBackoffMultiplier = 5; // 10 segundos después de 50 intentos (175s)
        console.log('⏱️ Aumentando intervalo de polling a 10 segundos (backoff)');
      } else if (this.pollingAttempts === 80) {
        this.pollingBackoffMultiplier = 7.5; // 15 segundos después de 80 intentos (375s)
        console.log('⏱️ Aumentando intervalo de polling a 15 segundos (backoff)');
      }
      
      console.log(`🔍 Polling intento ${this.pollingAttempts}/${this.maxPollingAttempts} (intervalo: ${currentInterval}ms)`);
      
      // Si llegamos al máximo de intentos, detener
      if (this.pollingAttempts >= this.maxPollingAttempts) {
        console.log('⚠️ Máximo de intentos de polling alcanzado, deteniendo...');
        console.log('⚠️ El análisis de Azure está tomando más tiempo de lo esperado');
        console.log('💡 Recarga la página en unos minutos para verificar si completó');
        this.stopPollingForAnalysis();
        
        // Mostrar un mensaje al usuario
        this.translate.get('alerts.receipts.analysis-taking-long').subscribe((text: string) => {
          alert(text || 'El análisis está tomando más tiempo de lo esperado. Por favor recarga la página en unos minutos.');
        });
        return;
      }
      
      // Llamar al endpoint ligero
      this.checkAnalysisStatusLightweight();
      
    }, this.pollingIntervalTime); // El intervalo se ajusta dinámicamente con backoff
  }
  
  /**
   * Verifica el estado de análisis usando el endpoint ligero (solo IDs y status)
   * Si detecta cambios, ENTONCES recarga los recibos completos
   */
  checkAnalysisStatusLightweight() {
    console.log('📡 Consultando estado de análisis (endpoint ligero)...');
    
    this.api.read(`userReceipts/${this.userSession.id}/analysisStatus`).subscribe({
      next: (res) => {
        if (res['status'] === 200) {
          const data = res['body'];
          const receipts = data.receipts || [];
          const summary = data.summary;
          
          console.log('📊 Estado de análisis recibido:', summary);
          
          // Si no hay recibos procesando, detener polling
          if (!summary.hasProcessing || summary.processing === 0) {
            console.log('✅ Todos los recibos completaron el análisis');
            
            // Recargar una última vez para obtener los datos completos
            console.log('📥 Recargando recibos con datos completos...');
            this.loadUserReceipts(false);
            
            this.stopPollingForAnalysis();
            return;
          }
          
          // Detectar cambios en los IDs de recibos procesando
          const currentProcessingIds = new Set<string>(
            receipts.filter((r: any) => r.analysis_status === 0).map((r: any) => r._id as string)
          );
          
          // Si hay cambios (recibos que terminaron), recargar datos completos
          const hasChanges = this.detectProcessingChanges(currentProcessingIds);
          
          if (hasChanges) {
            console.log('🔄 Detectados cambios en el estado, recargando datos completos...');
            this.loadUserReceipts(false); // false = no resetear paginación
          } else {
            console.log('⏳ Sin cambios, continuando polling...');
          }
          
          // Actualizar el Set de IDs procesando
          this.processingReceiptIds = currentProcessingIds;
        }
      },
      error: (error) => {
        console.error('❌ Error verificando estado de análisis:', error);
        // En caso de error, intentar con el método tradicional
        console.log('🔄 Fallback: recargando recibos completos...');
        this.loadUserReceipts(false);
      }
    });
  }
  
  /**
   * Detecta si hubo cambios en los recibos que están procesando
   * Retorna true si algún recibo terminó de procesar
   */
  detectProcessingChanges(currentIds: Set<string>): boolean {
    // Si es la primera vez, guardar y no recargar
    if (this.processingReceiptIds.size === 0) {
      return false;
    }
    
    // Verificar si algún ID que estaba procesando ya no está
    for (const id of this.processingReceiptIds) {
      if (!currentIds.has(id)) {
        console.log(`✅ Recibo ${id} completó el análisis`);
        return true;
      }
    }
    
    // Verificar si hay nuevos IDs procesando (nuevo upload durante polling)
    for (const id of currentIds) {
      if (!this.processingReceiptIds.has(id)) {
        console.log(`🆕 Nuevo recibo ${id} detectado en análisis`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detiene el polling de análisis
   */
  stopPollingForAnalysis() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.pollingAttempts = 0;
      console.log('🛑 Polling detenido');
    }
  }
  
  /**
   * Verifica si hay recibos en estado "procesando" (analysis_status = 0)
   * Revisa TODOS los países cargados, no solo el actual
   */
  checkForProcessingReceipts(): boolean {
    if (!this.userCountries || this.userCountries.length === 0) {
      return false;
    }
    
    let totalProcessing = 0;
    
    // Revisar todos los países
    this.userCountries.forEach((country: any) => {
      if (country.receipts && country.receipts.length > 0) {
        const processingInCountry = country.receipts.filter((receipt: any) => {
          return receipt.analysis_status === 0 || receipt.analysis_status === '0';
        }).length;
        
        totalProcessing += processingInCountry;
      }
    });
    
    const hasProcessing = totalProcessing > 0;
    
    if (hasProcessing) {
      console.log(`⏳ Hay ${totalProcessing} recibos aún procesando en total`);
    }
    
    return hasProcessing;
  }
  
  loadMoreReceipts(event: any) {
    if (this.isLoadingMore || !this.hasMoreReceipts) {
      event.target.complete();
      return;
    }
    
    this.currentPage++;
    console.log('📄 Loading more receipts, page:', this.currentPage);
    
    this.api.read(`userReceipts/${this.userSession.id}/grouped?page=${this.currentPage}&limit=${this.pageLimit}`).subscribe({
      next: (res) => {
        if (res['status'] == 200) {
          const responseData = res['body'];
          const newCountries = responseData.data || responseData;
          const pagination = responseData.pagination;
          
          if (pagination) {
            this.hasMoreReceipts = pagination.hasMore;
            this.totalReceipts = pagination.totalReceipts;
          }
          
          // Agregar nuevos recibos a países existentes o crear nuevos
          newCountries.forEach((newCountry: any) => {
            const existingCountry = this.userCountries.find(c => c.country === newCountry.country);
            if (existingCountry) {
              existingCountry.receipts = [...existingCountry.receipts, ...newCountry.receipts];
            } else {
              this.userCountries.push(newCountry);
            }
          });
          
          // Actualizar el país actual con los nuevos datos
          const updatedCountry = this.userCountries[this.selectedCountryIndex];
          if (updatedCountry) {
            this.currentCountryData = updatedCountry;
          }
        }
        event.target.complete();
      },
      error: (error) => {
        console.error('❌ Error loading more receipts:', JSON.stringify(error));
        event.target.complete();
      }
    });
  }

  selectCountry(index: number) {
    this.selectedCountryIndex = index;
    if (this.userCountries && this.userCountries[index]) {
      this.currentCountryData = this.userCountries[index];
      
      // Establecer currencyBlockSelected según el país
      const country = this.currentCountryData.country;
      const countryInfo = this.currencies?.find((c: any) => c.country === country);
      
      if (countryInfo) {
        this.currencyBlockSelected = countryInfo;
      }

      // Verificar si hay recibos
      if (this.hasReceipts()) {
        this.isUploadingOther = false;
      } else {
        this.isUploadingOther = true;
      }
      
      console.log('✅ Country selected:', this.currentCountryData);
    }
  }

  hasReceipts(): boolean {
    return this.currentCountryData && 
           this.currentCountryData.receipts && 
           this.currentCountryData.receipts.length > 0;
  }

  getCurrentReceipts(): any[] {
    if (!this.hasReceipts()) return [];
    
    // Ordenar recibos por fecha del documento (más recientes primero)
    return [...this.currentCountryData.receipts].sort((a: any, b: any) => {
      // Obtener la fecha del document_result.date
      const dateA = a.document_result?.date || a.document_created || a.created_at || 0;
      const dateB = b.document_result?.date || b.document_created || b.created_at || 0;
      
      // Convertir a timestamp si es string
      const timestampA = typeof dateA === 'string' ? new Date(dateA).getTime() : dateA;
      const timestampB = typeof dateB === 'string' ? new Date(dateB).getTime() : dateB;
      
      return timestampB - timestampA; // Orden descendente (más reciente primero)
    });
  }

  getCurrentCurrency(): string {
    if (this.currencyBlockSelected && this.currencyBlockSelected.code) {
      return this.currencyBlockSelected.code;
    }
    return '';
  }

  checkReceiptsErrors(): boolean {
    if (!this.hasReceipts()) return true;
    
    const receipts = this.getCurrentReceipts();
    return receipts.some((receipt: any) => receipt.analysis_status === 500 || receipt.analysis_status === 0);
  }

  // ============================================
  // FUNCIONES DE SUBIDA DE ARCHIVOS
  // ============================================

  takePhoto() {
    Camera.getPhoto({
      quality: 75,  // Reducido de 90 a 75 para archivos más pequeños
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1600,  // Reducido de 1920 a 1600 - suficiente para OCR
      height: undefined,
      correctOrientation: true
    }).then((imageData) => {
      this.imagesToUpload.push(imageData);
      this.cdr.detectChanges();
      
      // Subir automáticamente después de tomar la foto
      console.log('📸 Foto capturada, subiendo...');
      this.uploadImagesBase64();
    }, (err) => {
      console.error('Error taking photo:', err);
    });
  }

  onFileDropped(files: any) {
    this.imagesToUpload = [];
    this.isUploadingOther = false;
    // Asegurar que files es un array
    const filesArray = Array.isArray(files) ? files : Array.from(files);
    this.uploadFile(filesArray);
  }

  fileBrowseHandler(event: any) {
    const fileList = event.target.files;
    // Convertir FileList a Array
    const files = Array.from(fileList) as File[];
    // NO limpiar imagesToUpload aquí para evitar bug
    // this.imagesToUpload = [];
    this.isUploadingOther = false;
    this.uploadFile(files);
  }

  deleteImageToUpload(index: number) {
    this.imagesToUpload.splice(index, 1);
  }

  deleteUploadingFile(index: number) {
    console.log('🗑️ Eliminando archivo con error en index:', index);
    this.uploadingFiles.splice(index, 1);
    
    // Si no quedan archivos en la lista de uploading, resetear estados
    if (this.uploadingFiles.length === 0) {
      this.isUploading = false;
      this.showAlertTime = false;
      console.log('✅ Lista de archivos subiendo vacía, reseteando estados');
    }
    
    this.cdr.detectChanges();
  }

  uploadImagesBase64() {
    console.log('📤 Iniciando subida de imágenes Base64...');
    console.log('📊 Imágenes a subir:', this.imagesToUpload.length);
    
    let files: any[] = [];

    this.imagesToUpload.forEach((image: any, index: number) => {
      console.log(`🖼️ Procesando imagen ${index + 1}/${this.imagesToUpload.length}`);
      const blob = this.dataURItoBlob(image.dataUrl || image);
      const file = new File([blob], 'receipt_' + Date.now() + '_' + index + '.jpg', { type: 'image/jpeg' });
      console.log(`✅ Archivo creado: ${file.name}, tamaño: ${(file.size / 1024).toFixed(2)}KB`);
      files.push(file);
    });

    console.log('📦 Total de archivos preparados:', files.length);
    
    // NO limpiar aquí, dejarlo para después de que se confirme la subida
    this.isUploadingOther = false;
    
    this.uploadFile(files);
  }

  dataURItoBlob(dataURI: string) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = unescape(dataURI.split(',')[1]);

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }

  /**
   * Comprime una imagen a un tamaño y calidad específicos
   * @param file Archivo de imagen a comprimir
   * @param maxWidth Ancho máximo (default: 1600px)
   * @param quality Calidad JPEG (default: 0.75)
   * @returns Promise con el archivo comprimido
   */
  private compressImage(file: File, maxWidth: number = 1600, quality: number = 0.75): Promise<File> {
    return new Promise((resolve, reject) => {
      // Si no es imagen, retornar el archivo original
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      // Si el archivo ya es pequeño (< 500KB), no comprimir
      if (file.size < 500 * 1024) {
        console.log(`📦 Archivo ${file.name} ya es pequeño (${(file.size / 1024).toFixed(2)}KB), no se comprime`);
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx!.drawImage(img, 0, 0, width, height);

          // Convertir a blob con compresión
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                const originalSizeKB = (file.size / 1024).toFixed(2);
                const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
                const reduction = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
                
                console.log(`✅ Imagen comprimida: ${file.name}`);
                console.log(`   Original: ${originalSizeKB}KB → Comprimido: ${compressedSizeKB}KB (${reduction}% reducción)`);
                
                resolve(compressedFile);
              } else {
                reject(new Error('Error al comprimir imagen'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('Error al cargar imagen para comprimir'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer archivo'));
      };
    });
  }

  sanitizeFileName(name: string): string {
    name = name.replace(/\s+/g, '-').toLowerCase();
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    return name;
  }

  uploadFile(files: any[]) {
    // Validar y convertir files a array si es necesario
    if (!files) {
      console.error('❌ No files provided to uploadFile');
      return;
    }
    
    // Si files no es un array, convertirlo
    if (!Array.isArray(files)) {
      console.log('⚠️ Converting FileList to Array');
      files = Array.from(files);
    }
    
    // Validar que el array no esté vacío
    if (files.length === 0) {
      console.error('❌ No files to upload');
      return;
    }
    
    if (!this.userSession || !this.userSession.id) {
      console.error('❌ No user session for upload');
      return;
    }

    // Si no hay país seleccionado, intentar seleccionar automáticamente
    if (!this.currencyBlockSelected) {
      console.log('⚠️ No country selected, attempting auto-selection...');
      
      // Si hay países con recibos, seleccionar el primero
      if (this.userCountries && this.userCountries.length > 0) {
        console.log('✅ Auto-selecting first country from user receipts');
        this.selectCountry(0);
      }
      // Si no hay recibos pero hay currencies disponibles, seleccionar el primero
      else if (this.currencies && this.currencies.length > 0) {
        console.log('✅ Auto-selecting first available currency');
        this.currencyBlockSelected = this.currencies[0];
      }
      
      // Si después de intentar auto-seleccionar sigue sin país, mostrar error
      if (!this.currencyBlockSelected) {
        this.translate.get('errors.select-country-first').subscribe((text: string) => {
          alert(text || 'Please select a country first');
        });
        return;
      }
    }

    // Validar límite de subida antes de proceder
    const filesToUpload = files.length;
    console.log('🔍 Validando límite antes de subir', filesToUpload, 'archivos');
    
    this.api.checkUploadLimit(this.userSession.id, filesToUpload).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de validación de límite:', response);
        
        const limitResult = response.body || response;
        
        if (limitResult.canUpload) {
          // El usuario puede subir, proceder con la subida
          console.log('✅ Usuario puede subir archivos');
          this.proceedWithUpload(files);
        } else {
          // El límite ha sido alcanzado, mostrar modal de memberships
          console.log('❌ Límite alcanzado, mostrando modal de memberships');
          this.uploadLimitData = limitResult;
          this.openMembershipModal(); // Llamar al método para cargar membresías
        }
      },
      error: (error) => {
        console.error('❌ Error validando límite de subida:', JSON.stringify(error));
        // En caso de error, permitir la subida (para no bloquear al usuario)
        this.proceedWithUpload(files);
      }
    });
  }

  private async proceedWithUpload(files: any[]) {
    // Validar que files sea un array
    if (!Array.isArray(files)) {
      console.error('❌ proceedWithUpload: files is not an array', typeof files);
      files = Array.from(files);
    }
    
    this.showAlertTime = true;
    this.isUploading = true;
    
    // Limpiar array de archivos en upload
    this.uploadingFiles = [];

    if (files.length > 0) {
      console.log(`🚀 Iniciando compresión y subida de ${files.length} archivos...`);
      
      // Primero comprimir todas las imágenes en paralelo
      const compressionPromises = files.map(async (fileElement) => {
        if ((fileElement.size / 1048576) <= 10) {
          try {
            // Comprimir imagen si es necesario
            const compressedFile = await this.compressImage(fileElement);
            return { file: compressedFile, error: false };
          } catch (error) {
            console.error('❌ Error comprimiendo archivo:', fileElement.name, error);
            // Si falla la compresión, usar archivo original
            return { file: fileElement, error: false };
          }
        } else {
          console.error('❌ File too large:', fileElement.name);
          return { file: fileElement, error: true, errorType: 'size' };
        }
      });

      // Esperar a que todas las compresiones terminen
      const compressedResults = await Promise.all(compressionPromises);
      
      // Crear tracking para cada archivo
      compressedResults.forEach((result, index) => {
        const fileTrack = {
          name: result.file.name,
          size: result.file.size,
          status: result.error ? 'error' : 'uploading'
        };
        this.uploadingFiles.push(fileTrack);
      });

      // Subir todos los archivos en paralelo
      const uploadPromises = compressedResults.map((result, index) => {
        if (!result.error) {
          return this.uploadReceiptFileParallel(result.file, index);
        } else {
          // Archivo con error (muy grande), no subir
          return Promise.resolve({ success: false, index });
        }
      });

      // Ejecutar todas las subidas en paralelo
      Promise.all(uploadPromises).then((results) => {
        console.log('✅ Todas las subidas completadas:', results);
        
        this.showAlertTime = false;
        this.isUploading = false;
        
        // Esperar a que el usuario vea el éxito antes de limpiar y recargar
        setTimeout(() => {
          this.uploadingFiles = [];
          this.loadUserReceipts();
          
          // ✅ NUEVO: Iniciar polling para verificar análisis de recibos
          console.log('🔄 Iniciando polling para verificar estado de análisis...');
          this.startPollingForAnalysis();
          
          if (this.hasReceipts()) {
            this.isUploadingOther = false;
          }
        }, 1500);
        
        this.cdr.detectChanges();
      }).catch((error) => {
        console.error('❌ Error en subidas paralelas:', error);
        this.showAlertTime = false;
        this.isUploading = false;
        this.cdr.detectChanges();
      });
      
      // Limpiar imagesToUpload SOLO después de comenzar la subida exitosamente
      if (this.imagesToUpload.length > 0) {
        console.log('✅ Limpiando imagesToUpload después de iniciar subida');
        this.imagesToUpload = [];
      }
    }
  }

  /**
   * Versión paralela de uploadReceiptFile que retorna una Promise
   */
  private uploadReceiptFileParallel(fileElement: any, fileIndex: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let form = new FormData();
      form.append('file', fileElement, fileElement.name);
      form.append('user_id', this.userSession.id);
      form.append('country', this.currencyBlockSelected.country);
      form.append('currency_code', this.currencyBlockSelected.code);
      form.append('country_translate_key', this.currencyBlockSelected.country_translate_key || this.convertKey(this.currencyBlockSelected.country));
      form.append('model_id', 'custom-ikosten-bills-v2');

      console.log(`📤 [${fileIndex + 1}] Subiendo:`, fileElement.name, `(${(fileElement.size / 1024).toFixed(2)}KB)`);

      this.api.sendForm('uploads/uploadUserReceipt', form).subscribe({
        next: (res) => {
          console.log(`✅ [${fileIndex + 1}] Completado:`, fileElement.name);
          
          if (this.uploadingFiles[fileIndex]) {
            this.uploadingFiles[fileIndex].status = 'success';
          }
          
          this.cdr.detectChanges();
          resolve({ success: true, index: fileIndex, response: res });
        },
        error: (error) => {
          console.error(`❌ [${fileIndex + 1}] Error:`, fileElement.name, error);
          
          if (this.uploadingFiles[fileIndex]) {
            this.uploadingFiles[fileIndex].status = 'error';
          }
          
          this.cdr.detectChanges();
          resolve({ success: false, index: fileIndex, error });
        }
      });
    });
  }

  openMembershipModal() {
    console.log('🔄 Abriendo modal de membresías...');
    this.showMembershipModal = true;
  }

  closeMembershipModal() {
    this.showMembershipModal = false;
    this.uploadLimitData = null;
  }

  onMembershipModalDismiss() {
    this.closeMembershipModal();
  }

  private uploadReceiptFile(fileElement: any, fileIndex: number) {
    let form = new FormData();
    form.append('file', fileElement, fileElement.name);
    form.append('user_id', this.userSession.id);
    form.append('country', this.currencyBlockSelected.country);
    form.append('currency_code', this.currencyBlockSelected.code);
    form.append('country_translate_key', this.currencyBlockSelected.country_translate_key || this.convertKey(this.currencyBlockSelected.country));
    form.append('model_id', 'custom-ikosten-bills-v2');

    console.log(`🔄 Uploading receipt ${fileIndex + 1}:`, fileElement.name);

    this.api.sendForm('uploads/uploadUserReceipt', form).subscribe({
      next: (res) => {
        console.log(`✅ Receipt ${fileIndex + 1} uploaded:`, res);
        
        // Actualizar status del archivo específico
        if (this.uploadingFiles[fileIndex]) {
          this.uploadingFiles[fileIndex].status = 'success';
        }
        
        // Verificar si todos los archivos terminaron
        const allFinished = this.uploadingFiles.every(
          file => file.status === 'success' || file.status === 'error'
        );
        
        if (allFinished) {
          this.showAlertTime = false;
          this.isUploading = false;
          
          // Esperar a que el usuario vea el éxito antes de limpiar y recargar
          setTimeout(() => {
            // Primero limpiar la lista de archivos subiendo
            this.uploadingFiles = [];
            
            // Luego recargar recibos para que aparezcan en la lista
            this.loadUserReceipts();
            
            // Cerrar la sección de upload si ya hay recibos
            if (this.hasReceipts()) {
              this.isUploadingOther = false;
            }
          }, 1500);
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`❌ Error uploading receipt ${fileIndex + 1}:`, JSON.stringify(error));
        
        // Actualizar status del archivo específico
        if (this.uploadingFiles[fileIndex]) {
          this.uploadingFiles[fileIndex].status = 'error';
        }
        
        // Verificar si todos los archivos terminaron
        const allFinished = this.uploadingFiles.every(
          file => file.status === 'success' || file.status === 'error'
        );
        
        if (allFinished) {
          this.showAlertTime = false;
          this.isUploading = false;
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  openUploading() {
    this.isUploadingOther = true;
  }

  // ============================================
  // FUNCIONES DE PICKER Y MODALES
  // ============================================

  showModalPicker(title: string, type: string) {
    this.pickerTitle = title;
    this.showPicker = true;
    this.pickerType = type;
    this.pickerOptions = this.currencies;
  }

  pickerDismissed() {
    this.showPicker = false;
  }

  pickerOptionSelected(event: any) {
    if (this.pickerType === 'country') {
      // Primera selección de país
      this.currencyBlockSelected = event;
      
      // Verificar si el país ya existe en userCountries
      const existingCountryIndex = this.userCountries.findIndex(
        (country: any) => country.country === event.country
      );

      if (existingCountryIndex >= 0) {
        // País ya existe, seleccionarlo
        this.selectCountry(existingCountryIndex);
      } else {
        // País nuevo, agregarlo
        const newCountry = {
          country: event.country,
          country_translate_key: event.country_translate_key,
          receipts: []
        };
        this.userCountries.push(newCountry);
        this.selectCountry(this.userCountries.length - 1);
      }
      this.isAddingNewCountry = false;
    } else if (this.pickerType === 'add_country') {
      // Agregar nuevo país
      const existingCountryIndex = this.userCountries.findIndex(
        (country: any) => country.country === event.country
      );

      if (existingCountryIndex >= 0) {
        // País ya existe, seleccionarlo
        this.selectCountry(existingCountryIndex);
        this.isAddingNewCountry = false;
      } else {
        // País nuevo, agregarlo y marcar que estamos agregando
        const newCountry = {
          country: event.country,
          country_translate_key: event.country_translate_key,
          receipts: []
        };
        this.userCountries.push(newCountry);
        this.selectCountry(this.userCountries.length - 1);
        this.currencyBlockSelected = event;
        this.isAddingNewCountry = true;
        this.isUploadingOther = true;
      }
    }
  }

  cancelAddNewCountry() {
    if (this.isAddingNewCountry) {
      // Remover el último país agregado (que no tiene recibos)
      const lastCountryIndex = this.userCountries.length - 1;
      if (lastCountryIndex >= 0 && this.userCountries[lastCountryIndex].receipts.length === 0) {
        this.userCountries.pop();
      }
      
      // Volver al país anterior o al primero
      if (this.userCountries.length > 0) {
        const previousIndex = Math.max(0, this.userCountries.length - 1);
        this.selectCountry(previousIndex);
      }
      
      this.isAddingNewCountry = false;
      this.isUploadingOther = false;
    }
  }

  convertKey(input: string): string {
    if (!input) return '';
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, '');
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.' + string;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ============================================
  // FUNCIONES DE ELIMINACIÓN
  // ============================================

  deleteReceipt(receiptId: string) {
    this.receiptToDelete = receiptId;
    
    // Traducir los botones dinámicamente antes de mostrar el alert
    this.deleteReceiptAlertButtons = [
      {
        text: this.translate.instant('buttons.cancel'),
        role: 'cancel',
        handler: () => {}
      },
      {
        text: this.translate.instant('buttons.delete'),
        role: 'confirm',
        handler: () => {
          this.confirmDeleteReceipt();
        }
      }
    ];
    
    this.isAlertDeleteReceipt = true;
  }

  confirmDeleteReceipt() {
    if (!this.receiptToDelete) return;

    console.log('🗑️ Deleting receipt:', this.receiptToDelete);

    this.api.delete(`userReceipts/${this.receiptToDelete}`).subscribe({
      next: (res) => {
        console.log('✅ Receipt deleted successfully');
        
        // Actualizar inmediatamente la interfaz eliminando el recibo del array local
        this.removeReceiptFromLocalData(this.receiptToDelete);
        
        this.isAlertDeleteReceipt = false;
        this.receiptToDelete = '';
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        console.log('🔄 Receipt removed from UI immediately');
      },
      error: (error) => {
        console.error('❌ Error deleting receipt:', JSON.stringify(error));
        this.isAlertDeleteReceipt = false;
        this.receiptToDelete = '';
        alert('Error al eliminar el recibo');
      }
    });
  }

  dismissDeleteReceipt() {
    this.isAlertDeleteReceipt = false;
    this.receiptToDelete = '';
  }

  deleteAllReceipts() {
    if (!this.currentCountryData || !this.currentCountryData.receipts || this.currentCountryData.receipts.length === 0) {
      alert(this.translate.instant('errors.no-receipts-to-delete'));
      return;
    }
    
    // Traducir los botones dinámicamente antes de mostrar el alert
    this.deleteAllReceiptsAlertButtons = [
      {
        text: this.translate.instant('buttons.cancel'),
        role: 'cancel',
        handler: () => {}
      },
      {
        text: this.translate.instant('buttons.delete-all'),
        role: 'confirm',
        cssClass: 'alert-button-danger',
        handler: () => {
          this.confirmDeleteAllReceipts();
        }
      }
    ];
    
    this.isAlertDeleteAllReceipts = true;
  }

  confirmDeleteAllReceipts() {
    if (!this.currentCountryData || !this.currentCountryData.receipts) return;

    const receiptIds = this.currentCountryData.receipts.map((receipt: any) => receipt._id);
    const country = this.currentCountryData.country;
    
    console.log(`🗑️ Deleting all ${receiptIds.length} receipts from ${country}`);

    // Llamar a la API para eliminar múltiples recibos
    const deletePromises = receiptIds.map((id: string) => 
      this.api.delete(`userReceipts/${id}`).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        console.log('✅ All receipts deleted successfully');
        this.isAlertDeleteAllReceipts = false;
        
        // Actualizar inmediatamente la interfaz eliminando todos los recibos del país actual
        this.removeAllReceiptsFromCurrentCountry();
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        console.log('🔄 All receipts removed from UI immediately');
      })
      .catch((error) => {
        console.error('❌ Error deleting receipts:', JSON.stringify(error));
        this.isAlertDeleteAllReceipts = false;
        alert(this.translate.instant('errors.delete-all-failed'));
      });
  }

  dismissDeleteAllReceipts() {
    this.isAlertDeleteAllReceipts = false;
  }

  // ============================================
  // FUNCIONES DE ACTUALIZACIÓN LOCAL DE DATOS
  // ============================================

  /**
   * Elimina un recibo específico de los datos locales sin recargar desde el servidor
   * @param receiptId ID del recibo a eliminar
   */
  private removeReceiptFromLocalData(receiptId: string) {
    if (!this.currentCountryData || !this.currentCountryData.receipts) {
      console.warn('⚠️ No current country data to update');
      return;
    }

    // Eliminar el recibo del array actual
    const initialLength = this.currentCountryData.receipts.length;
    this.currentCountryData.receipts = this.currentCountryData.receipts.filter(
      (receipt: any) => receipt._id !== receiptId
    );

    const finalLength = this.currentCountryData.receipts.length;
    console.log(`🗑️ Removed receipt ${receiptId}. Receipts: ${initialLength} → ${finalLength}`);

    // Actualizar también en userCountries
    const countryIndex = this.userCountries.findIndex(
      country => country.country === this.currentCountryData.country
    );

    if (countryIndex >= 0) {
      this.userCountries[countryIndex].receipts = this.currentCountryData.receipts;
    }

    // Si no quedan recibos en este país, cambiar el estado de la interfaz
    if (this.currentCountryData.receipts.length === 0) {
      this.isUploadingOther = true;
      console.log('📝 No receipts left, switching to upload mode');
    }
  }

  /**
   * Elimina todos los recibos del país actual de los datos locales
   */
  private removeAllReceiptsFromCurrentCountry() {
    if (!this.currentCountryData) {
      console.warn('⚠️ No current country data to update');
      return;
    }

    const country = this.currentCountryData.country;
    const receiptsCount = this.currentCountryData.receipts?.length || 0;
    
    console.log(`🗑️ Removing all ${receiptsCount} receipts from ${country}`);

    // Vaciar el array de recibos del país actual
    this.currentCountryData.receipts = [];

    // Actualizar también en userCountries
    const countryIndex = this.userCountries.findIndex(
      countryData => countryData.country === country
    );

    if (countryIndex >= 0) {
      this.userCountries[countryIndex].receipts = [];
    }

    // Cambiar a modo de subida ya que no hay recibos
    this.isUploadingOther = true;
    
    // Reiniciar el selector de país para permitir nueva selección
    this.currencyBlockSelected = undefined;
    
    console.log('📝 All receipts removed, switching to upload mode');
  }

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  isImage(mime: string): boolean {
    return this.imageMimes.indexOf(mime) >= 0;
  }

  isPdf(mime: string): boolean {
    if (mime) {
      return this.pdfMimes.indexOf(mime) >= 0;
    }
    return false;
  }

  sanitizeImage(blob: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + blob);
  }
}
