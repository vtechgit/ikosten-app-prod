import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { IonModal, ToastController } from '@ionic/angular';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-export',
  standalone: false,
  templateUrl: './export.page.html',
  styleUrls: ['./export.page.scss'],
})
export class ExportPage implements OnInit {

  @ViewChild('startModal') startModal!: IonModal;
  @ViewChild('endModal') endModal!: IonModal;
  @ViewChild('startDatetime', { read: IonModal }) startDatetimeElement: any;
  @ViewChild('endDatetime', { read: IonModal }) endDatetimeElement: any;

  // Steps control
  currentStep: number = 1;

  // Step 1: Date Range
  startDate: string = '';
  endDate: string = '';
  isLoadingReceipts: boolean = false;
  receiptsData: any[] = [];
  totalReceipts: number = 0;

  // Step 2: Bank Statement Reconciliation
  wantsReconciliation: boolean = false;
  extractFile: any = null;
  extractId: string = ''; // ID del extracto en la base de datos
  extractStatus: number = 0; // 0: not uploaded, 1: success, 500: error
  extractBankName: string = '';
  extractOriginalName: string = '';
  isUploadingExtract: boolean = false;
  
  // Historial de extractos
  extractsHistory: any[] = [];
  isLoadingExtracts: boolean = false;
  extractsPage: number = 0;
  extractsPageSize: number = 10;
  hasMoreExtracts: boolean = true;
  showExtractHistory: boolean = false;

  // Step 3: Export Settings
  userName: string = '';
  userEmail: string = '';
  sendPdf: boolean = true;
  sendExcel: boolean = false;
  isSending: boolean = false;

  // Localization
  dateLocale: string = 'en-US';
  selectedLanguage: string = 'es';
  languagesLoaded: boolean = false;
  availableLanguages: any = [];

  // User session
  userSession: any;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private translate: TranslateService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Inicializar idioma primero
    this.initializeLanguage();
    
    // Cargar datos del usuario
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userSession = currentUser;
      this.userName = currentUser.name || '';
      this.userEmail = currentUser.email || '';
    }

    // Configurar locale para datetime después de inicializar idioma
    this.setDateLocale();

    // Establecer fecha por defecto (1 mes antes hasta hoy)
    this.setDefaultDates();
  }

  ionViewWillEnter() {
    // Solo cargar idiomas una vez
    if (!this.languagesLoaded) {
      this.getLanguages();
    }

    // Actualizar dateLocale desde localStorage si existe
    if (localStorage.getItem('langIntl')) {
      this.dateLocale = localStorage.getItem('langIntl') || 'en-US';
    }
  }

  initializeLanguage() {
    this.selectedLanguage = localStorage.getItem('lang') || 
                           this.translate.currentLang || 
                           this.translate.defaultLang || 
                           'es';
    this.translate.use(this.selectedLanguage);
    console.log('🌍 Language initialized:', this.selectedLanguage);
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
            this.setDateLocale(); // Actualizar locale después de cambiar idioma
          } else {
            this.applyStoredOrDeviceLanguage();
          }
        } else {
          this.applyStoredOrDeviceLanguage();
        }
      },
      error: (error) => {
        console.error('Error loading languages:', error);
        this.selectedLanguage = 'en';
        this.translate.use(this.selectedLanguage);
        this.setDateLocale(); // Actualizar locale después de cambiar idioma
      }
    });
  }

  applyStoredOrDeviceLanguage() {
    if (localStorage.getItem('lang')) {
      this.selectedLanguage = localStorage.getItem('lang') || 'es';
      this.translate.use(this.selectedLanguage);
      this.setDateLocale(); // Actualizar locale después de cambiar idioma
    } else {
      Device.getLanguageCode().then(lang => {
        this.selectedLanguage = lang.value;
        this.translate.use(this.selectedLanguage);
        this.setDateLocale(); // Actualizar locale después de cambiar idioma
      });
    }
  }

  async setDateLocale() {
    const deviceLanguage = await Device.getLanguageCode();
    const currentLang = this.selectedLanguage || this.translate.currentLang || this.translate.defaultLang || 'en';
    
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
    console.log('🌍 Date locale set to:', this.dateLocale, 'from lang:', currentLang);
  }

  setDefaultDates() {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Formato YYYY-MM-DD para ion-datetime
    this.endDate = today.toISOString();
    this.startDate = oneMonthAgo.toISOString();
    console.log('📅 Default dates set:', this.startDate, 'to', this.endDate);
    
    // Ejecutar búsqueda inicial
    setTimeout(() => {
      this.searchReceipts();
    }, 500);
  }

  onDateChange() {
    console.log('📅 Date changed - Start:', this.startDate, 'End:', this.endDate);
    // Ejecutar búsqueda automáticamente cuando cambian las fechas
    setTimeout(() => {
      this.searchReceipts();
    }, 300);
  }

  async searchReceipts() {
    if (!this.startDate || !this.endDate) {
      await this.showErrorToast(this.translate.instant('errors.export.missing-dates'));
      return;
    }

    if (!this.userSession || !this.userSession.id) {
      await this.showErrorToast(this.translate.instant('errors.export.no-user'));
      return;
    }

    this.isLoadingReceipts = true;
    this.receiptsData = [];
    this.totalReceipts = 0;

    const startDateStr = new Date(this.startDate).toISOString().split('T')[0];
    const endDateStr = new Date(this.endDate).toISOString().split('T')[0];

    console.log('📅 Searching receipts from', startDateStr, 'to', endDateStr);

    this.api.read(`userReceipts/${this.userSession.id}/grouped/byDateRange?startDate=${startDateStr}&endDate=${endDateStr}`)
      .subscribe({
        next: (res) => {
          console.log('📥 Receipts response:', res);
          this.isLoadingReceipts = false;
          if (res && res['body']) {
            this.receiptsData = res['body'];
            this.totalReceipts = this.receiptsData.reduce((sum, country) => sum + country.count, 0);
            console.log('✅ Receipts loaded:', this.totalReceipts, 'receipts in', this.receiptsData.length, 'countries');
          }
        },
        error: async (error) => {
          this.isLoadingReceipts = false;
          console.error('❌ Error loading receipts:', error);
          await this.showErrorToast(this.translate.instant('errors.export.loading-failed'));
        }
      });
  }

  async goToStep2() {
    if (this.totalReceipts === 0) {
      await this.showErrorToast(this.translate.instant('errors.export.no-receipts'));
      return;
    }
    this.currentStep = 2;
    // Cargar historial de extractos cuando entra al step 2
    this.loadExtractsHistory();
  }

  async goToStep3() {
    // Si seleccionó reconciliación pero no subió extracto, no avanzar
    if (this.wantsReconciliation && !this.extractFile) {
      await this.showErrorToast('Por favor sube un extracto bancario');
      return;
    }
    this.currentStep = 3;
  }

  goBackToStep1() {
    this.currentStep = 1;
  }

  goBackToStep2() {
    this.currentStep = 2;
  }

  onReconciliationChange() {
    // Si desactiva la reconciliación, limpiar el extracto
    if (!this.wantsReconciliation) {
      this.extractFile = null;
      this.extractId = '';
      this.extractStatus = 0;
      this.extractBankName = '';
      this.extractOriginalName = '';
      this.showExtractHistory = false;
    }
  }

  toggleReconciliation() {
    this.wantsReconciliation = !this.wantsReconciliation;
    this.onReconciliationChange();
  }

  onExtractFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      this.showErrorToast('Solo se permiten archivos PDF para extractos bancarios');
      return;
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.showErrorToast('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    // Si ya hay un extracto subido, preguntar si quiere reemplazarlo
    if (this.extractFile && this.extractId) {
      const confirmReplace = confirm('Ya tienes un extracto seleccionado. ¿Deseas reemplazarlo con este nuevo archivo?');
      if (!confirmReplace) {
        // Limpiar el input file
        event.target.value = '';
        return;
      }
    }

    this.extractOriginalName = file.name;
    this.extractStatus = 0;
    this.isUploadingExtract = true;
    this.extractFile = file;

    console.log('📄 Uploading bank extract:', file.name);

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('user_id', this.userSession.id);
    formData.append('bank_name', this.extractBankName || '');

    // Enviar al backend
    this.api.sendForm('uploads/uploadBankExtract', formData).subscribe({
      next: (res) => {
        console.log('✅ Bank extract uploaded successfully:', res);
        this.isUploadingExtract = false;
        
        if (res && res['body'] && res['body'].extract_id) {
          this.extractId = res['body'].extract_id;
          this.extractStatus = 1;
          this.extractBankName = res['body'].bank_name || 'Extracto bancario';
          console.log('✅ Extract ID saved:', this.extractId);
          
          // Recargar historial para incluir el nuevo extracto
          this.resetExtractsHistory();
          this.loadExtractsHistory();
        } else {
          console.error('❌ No extract_id in response');
          this.extractStatus = 500;
          this.showErrorToast('Error: No se recibió el ID del extracto');
        }
        
        // Limpiar el input file
        event.target.value = '';
      },
      error: (error) => {
        console.error('❌ Error uploading bank extract:', error);
        this.isUploadingExtract = false;
        this.extractStatus = 500;
        
        const errorMessage = error.error?.message || 'Error al subir el extracto bancario';
        this.showErrorToast(errorMessage);
        
        // Limpiar el input file
        event.target.value = '';
      }
    });
  }

  loadExtractsHistory() {
    if (this.isLoadingExtracts || !this.hasMoreExtracts) {
      return;
    }

    this.isLoadingExtracts = true;

    this.api.read(`bankExtracts/user/${this.userSession.id}`)
      .subscribe({
        next: (res) => {
          console.log('📥 Extracts history response:', res);
          this.isLoadingExtracts = false;
          
          if (res && res['body']) {
            const newExtracts = res['body'];
            
            // Agregar nuevos extractos al historial
            this.extractsHistory = [...this.extractsHistory, ...newExtracts];
            
            // Si recibimos menos extractos que el tamaño de página, no hay más
            if (newExtracts.length < this.extractsPageSize) {
              this.hasMoreExtracts = false;
            }
            
            this.extractsPage++;
            console.log('✅ Loaded', newExtracts.length, 'extracts. Total:', this.extractsHistory.length);
          }
        },
        error: (error) => {
          this.isLoadingExtracts = false;
          console.error('❌ Error loading extracts history:', error);
        }
      });
  }

  loadMoreExtracts(event: any) {
    this.loadExtractsHistory();
    
    // Completar el infinite scroll después de un momento
    setTimeout(() => {
      event.target.complete();
      
      // Deshabilitar infinite scroll si no hay más datos
      if (!this.hasMoreExtracts) {
        event.target.disabled = true;
      }
    }, 500);
  }

  resetExtractsHistory() {
    this.extractsHistory = [];
    this.extractsPage = 0;
    this.hasMoreExtracts = true;
  }

  toggleExtractHistory() {
    this.showExtractHistory = !this.showExtractHistory;
  }

  selectExtractFromHistory(extract: any) {
    this.extractId = extract._id;
    this.extractFile = { name: extract.original_name };
    this.extractOriginalName = extract.original_name;
    this.extractBankName = extract.bank_name || 'Extracto bancario';
    this.extractStatus = extract.analysis_status;
    
    console.log('✅ Selected extract from history:', this.extractId);
    
    // Cerrar el historial después de seleccionar
    this.showExtractHistory = false;
  }

  isExtractSelected(extractId: string): boolean {
    return this.extractId === extractId;
  }

  formatExtractDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  deleteExtract() {
    this.extractFile = null;
    this.extractId = '';
    this.extractStatus = 0;
    this.extractBankName = '';
    this.extractOriginalName = '';
  }

  async sendReport() {
    // Validaciones
    if (!this.sendPdf && !this.sendExcel) {
      await this.showErrorToast(this.translate.instant('errors.export.no-format-selected'));
      return;
    }

    if (!this.userName || !this.userEmail) {
      await this.showErrorToast(this.translate.instant('errors.export.missing-user-info'));
      return;
    }

    if (!this.receiptsData || this.receiptsData.length === 0) {
      await this.showErrorToast(this.translate.instant('errors.export.no-receipts'));
      return;
    }

    this.isSending = true;

    const exportSettings = {
      userName: this.userName,
      userEmail: this.userEmail,
      sendPdf: this.sendPdf,
      sendExcel: this.sendExcel
    };

    const requestData = {
      exportSettings: exportSettings,
      userEmail: this.userEmail,
      userName: this.userName,
      lang: this.translate.currentLang || 'es',
      receiptsData: this.receiptsData,
      startDate: this.startDate,
      endDate: this.endDate,
      // Agregar información de reconciliación si está activada
      wantsReconciliation: this.wantsReconciliation,
      extractId: this.extractId || null
    };

    console.log('📤 Sending export request:', requestData);

    this.api.create('userReceipts/sendReport', requestData).subscribe({
      next: async (res) => {
        this.isSending = false;
        if (res['status'] === 200 || res['status'] === 201) {
          console.log('✅ Report sent successfully');
          await this.showSuccessToast(this.translate.instant('alerts.export.success'));
          
          // Limpiar todos los datos y volver al paso 1
          this.currentStep = 1;
          this.receiptsData = [];
          this.totalReceipts = 0;
          
          // Deseleccionar y limpiar el extracto bancario
          this.wantsReconciliation = false;
          this.extractFile = null;
          this.extractId = '';
          this.extractStatus = 0;
          this.extractBankName = '';
          this.extractOriginalName = '';
          this.showExtractHistory = false;
          
          // Restablecer configuraciones de exportación a valores por defecto
          this.sendPdf = true;
          this.sendExcel = false;
        }
      },
      error: async (err) => {
        this.isSending = false;
        console.error('❌ Error sending report:', err);
        const errorMessage = err.error?.userMessage || this.translate.instant('errors.export.send-failed');
        await this.showErrorToast(errorMessage);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  convertKey(input: string): string {
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.' + string;
  }

  getCurrencyCode(country: string): string {
    // Mapa de países a códigos de moneda
    const currencyMap: { [key: string]: string } = {
      'Colombia': 'COP',
      'Mexico': 'MXN',
      'United States': 'USD',
      'Canada': 'CAD',
      'Brazil': 'BRL',
      'Argentina': 'ARS',
      'Chile': 'CLP',
      'Peru': 'PEN',
      'Spain': 'EUR',
      'United Kingdom': 'GBP',
      'Germany': 'EUR',
      'France': 'EUR',
      'Italy': 'EUR',
      'Japan': 'JPY',
      'China': 'CNY',
      'South Korea': 'KRW',
      'Australia': 'AUD',
      'New Zealand': 'NZD',
      'India': 'INR'
    };
    
    return currencyMap[country] || 'USD';
  }

  // Toast helper methods
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  private async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'primary',
      icon: 'information-circle'
    });
    await toast.present();
  }

}
