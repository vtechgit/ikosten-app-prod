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
          } else if (!resetPagination && this.currentCountryData) {
            // Actualizar el país actual con los nuevos datos
            const updatedCountry = this.userCountries[this.selectedCountryIndex];
            if (updatedCountry) {
              this.currentCountryData = updatedCountry;
            }
          } else {
            this.currentCountryData = null;
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
      quality: 90,
      allowEditing: false,  // Cambiado a false para permitir fotos completas (no cuadradas)
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1920,  // Ancho máximo
      height: undefined,  // Altura automática para mantener aspect ratio
      correctOrientation: true  // Corregir orientación automáticamente
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
    this.uploadFile(files);
  }

  fileBrowseHandler(event: any) {
    const files = event.target.files;
    this.imagesToUpload = [];
    this.isUploadingOther = false;
    this.uploadFile(files);
  }

  deleteImageToUpload(index: number) {
    this.imagesToUpload.splice(index, 1);
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
    
    this.imagesToUpload = [];
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

  sanitizeFileName(name: string): string {
    name = name.replace(/\s+/g, '-').toLowerCase();
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    return name;
  }

  uploadFile(files: any[]) {
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

  private proceedWithUpload(files: any[]) {
    this.showAlertTime = true;
    this.isUploading = true;
    
    // Limpiar array de archivos en upload
    this.uploadingFiles = [];

    if (files.length > 0) {
      for (const fileElement of files) {
        if ((fileElement.size / 1048576) <= 10) {
          // Agregar archivo al array de tracking
          const fileTrack = {
            name: fileElement.name,
            size: fileElement.size,
            status: 'uploading' // 'uploading', 'success', 'error'
          };
          this.uploadingFiles.push(fileTrack);
          
          // Subir archivo con índice para actualizar su status
          this.uploadReceiptFile(fileElement, this.uploadingFiles.length - 1);
        } else {
          console.error('❌ File too large:', fileElement.name);
          // Agregar como error
          this.uploadingFiles.push({
            name: fileElement.name,
            size: fileElement.size,
            status: 'error'
          });
        }
      }
    }
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
        this.isAlertDeleteReceipt = false;
        this.receiptToDelete = '';
        
        // Recargar recibos
        this.loadUserReceipts();
      },
      error: (error) => {
        console.error('❌ Error deleting receipt:', JSON.stringify(error));
        this.isAlertDeleteReceipt = false;
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
        
        // Reiniciar el selector de país
        this.currencyBlockSelected = undefined;
        
        // Recargar recibos
        this.loadUserReceipts();
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
