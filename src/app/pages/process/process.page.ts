import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { transition, style, animate, trigger } from '@angular/animations';
import {ApiService} from '../../services/api.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { ShepherdService } from 'angular-shepherd';

const enterTransition = transition(':enter', [
  style({
    opacity: 0
  }),
  animate('0.2s 0.1s ease-in', style({
    opacity: 1
  }))
]);
const fadeIn = trigger('fadeIn', [
  enterTransition
]);

@Component({
  selector: 'app-process',
  standalone: false,
  templateUrl: './process.page.html',
  styleUrls: ['./process.page.scss'],
  animations: [
    fadeIn,
  ]
})
export class ProcessPage implements OnInit {
  alertButtons = ['buttons.accept'];

  public deleteExtractAlertButtons = [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteExtract()
      },
    },
  ];
  public alertRestartButtons= [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.confirm',
      role: 'confirm',
      handler: () => {
        this.confirmRestartProcess()
      },
    },
  ];
  public deleteLineAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteLine()
      },
    },
  ];
  public deleteAllNotMatchedAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteAllNotMatchedLines()
      },
    },
  ];
  public deleteBillAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBill()
      },
    },
  ];
  public deleteAllAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBillAll()
      },
    },
  ];
  public goBackAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.confirm',
      role: 'confirm',
      handler: () => {
        this.confirmGoBack()
      },
    },
  ];
  public deleteTravelAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteTravel()
      },
    },
  ];

  // Variables de proceso
  travelId: string = '';
  currentStep: number = 1;
  travelSelected: any = {};
  extracts: any = {};
  results: any;
  loadingButtons: boolean = false;
  isUploading: boolean = false;
  isLoadingAnalysisFromCache: boolean = false;
  sendingForm: boolean = false;
  isUpdatingTravel: boolean = false;
  updateQueue: boolean = false;
  
  // Variables relacionadas con archivos
  imagesToUpload: any = [];
  notUploaded: any = [];
  uploadedBill: string = '';
  uploadMessage: string = "Subir archivo";
  uploadedExtractName: string = '';
  
  // Variables de UI
  isUploadingOther: boolean = true;
  billPos: number = 0;
  currencyBlockSelected: any;
  currencies: any = [];
  
  // Variables para modales y alertas
  isAlertDeleteExtract: boolean = false;
  isAlertDeleteBill: boolean = false;
  isAlertDeleteAll: boolean = false;
  isEdditingLine: boolean = false;
  isDeletingLine: boolean = false;
  isDeletingAllNotMatched: boolean = false;
  showAlertRestart: boolean = false;
  showAlertFounds: boolean = false;
  showAlertFoundsMatched: boolean = false;
  showAlertResend: boolean = false;
  showAlertTime: boolean = false;
  isAlertGoBack: boolean = false;
  modalHelp: boolean = false;
  
  // Variables para edición de líneas
  editLineDate: any;
  editLineTime: any;
  editLineDescription: string = '';
  editLineBill: number = 0;
  editLineCurrency: string = '';
  editLineDocId: string = '';
  editLineReason: string = '';
  editLineReceipt: any;
  editLineExtract: any;
  toggleDate: boolean = false;
  toggleTime: boolean = false;
  
  // Variables para configuración de usuario
  userEmail: string = '';
  userName: string = '';
  sendPdf: boolean = false;
  sendExcel: boolean = false;
  
  // Variables temporales para eliminaciones
  idToDelete: number = 0;
  idToDeleteBill: number = 0;
  idToDeleteBillContainer: number = 0;
  documentIdToDelete: string = '';
  selectedDeleteLine: any;
  docToDelete: string = '';
  foundsQty: number = 0;
  
  // Variables de fechas y localización
  dateLocale: string = 'es-MX';
  selectedLanguage: string = 'es';
  userSession: any;
  
  // Variables para modales adicionales
  openModalMemberships: boolean = false;
  openModalAddTravel: boolean = false;
  showAlertLogin: boolean = false;
  showAlertDeleteTravel: boolean = false;
  todayDate: string = new Date().toISOString();
  travels: any = [];
  travelToDelete: any;
  
  // Variables para picker modal
  showPicker: boolean = false;
  pickerTitle: string = '';
  pickerType: string = '';
  pickerOptions: any = [];
  
  // Variables adicionales para funcionalidades
  uploadLineResultId: number = 0;
  uploadLineExtractId: number = 0;
  toggleDatesExtracts: any = [];
  imageMimes: string[] = ["image/png", "image/jpeg"];
  pdfMimes: string[] = ["application/pdf"];
  languagesLoaded:boolean=false; // Flag para evitar cargar idiomas múltiples veces
  availableLanguages:any=[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private platform: Platform,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    public shepherdService: ShepherdService
  ) { }

  ngOnInit() {
    // Establecer valores por defecto primero para que siempre haya contenido
    this.currentStep = 1;
    this.isUploading = false;
    this.travelSelected = {};
    this.currencyBlockSelected = null; // Inicializar como null para evitar errores
    this.extracts = { bills: [], extract: { type: '', currency: '' } }; // Inicializar estructura básica
    
    // Inicializar idioma
    this.initializeLanguage();
    
    // Obtener sesión de usuario si está logueado
    if(this.api.isLoggedIn()) {
      // Obtener información del usuario desde el servicio API
      this.userSession = this.api.getUserData();
      if(this.userSession) {
        this.userName = this.userSession.name || '';
        this.userEmail = this.userSession.email || '';
        console.log('✅ User data loaded:', { userName: this.userName, userEmail: this.userEmail });
      }
    }
    
    // Obtener el ID del viaje de la URL
    this.travelId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.travelId) {
      this.router.navigate(['/customer/trips']);
      return;
    }

    // Cargar el viaje
    this.loadTravel();
    this.loadCurrencies();
    this.setDateLocale();
  }
  ionViewWillEnter(){
    // Solo cargar idiomas una vez para evitar rate limiting
    if(!this.languagesLoaded) {
      this.getLanguages();
    }
    if(localStorage.getItem('langIntl') && localStorage.getItem('langIntl') != '' && localStorage.getItem('langIntl') != null){
      
      this.dateLocale=localStorage.getItem('langIntl');
    }else{
  
    }
    
    // Cargar datos del travel si no están disponibles o si hemos vuelto de otra página
    if(!this.travelSelected || !this.travelSelected._id || Object.keys(this.travelSelected).length === 0) {
      console.log('🔄 Travel data not available, reloading...');
      // El loadTravel() se llamará desde ngOnInit si no hay travelId
    } else {
      // Intentar cargar resultados de análisis desde localStorage
      const analysisKey = `analysis_result_${this.travelSelected._id}`;
      
      if (!this.results && localStorage.getItem(analysisKey)) {
        console.log('🔄 Loading cached analysis results from localStorage on page enter');
        this.isLoadingAnalysisFromCache = true;
        
        try {
          this.results = JSON.parse(localStorage.getItem(analysisKey) || '{}');
          // Validar que notMatched sea un array
          if(this.results && this.results.notMatched && !Array.isArray(this.results.notMatched)) {
            console.warn('⚠️ Converting notMatched to array in ionViewWillEnter');
            this.results.notMatched = [];
          }
          
          // También guardar en travelSelected para consistencia
          if(this.travelSelected) {
            this.travelSelected['process_result'] = this.results;
          }
          
          this.isLoadingAnalysisFromCache = false;
          console.log('✅ Analysis results loaded from cache:', this.results);
        } catch(error) {
          console.error('❌ Error loading cached analysis:', error);
          localStorage.removeItem(analysisKey);
          this.isLoadingAnalysisFromCache = false;
        }
      } else if (this.travelSelected['process_result'] && !this.results) {
        console.log('🔄 Loading existing results from travelSelected');
        this.results = this.travelSelected['process_result'];
        // Validar que notMatched sea un array
        if(this.results && this.results.notMatched && !Array.isArray(this.results.notMatched)) {
          console.warn('⚠️ Converting notMatched to array in ionViewWillEnter');
          this.results.notMatched = [];
        }
      }
    }
  }

  initializeLanguage() {
    // Obtener el idioma del localStorage o usar español por defecto
    this.selectedLanguage = localStorage.getItem('lang') || this.translate.currentLang || this.translate.defaultLang || 'es';
    this.translate.use(this.selectedLanguage);
  }
  getCurrencies(){
    
    this.api.read('countries/'+this.selectedLanguage).subscribe(res=>{
      if(res['status'] == 200){
        this.currencies=res['body'];
      }
    })
      
  }
    getLanguages(){
    // Evitar múltiples llamadas simultáneas
    if(this.languagesLoaded) return;
    
    this.api.read('languages').subscribe({
      next: (res) => {
        this.availableLanguages = res['body'];

        if(this.api.isLoggedIn() && this.userSession){
          if(this.userSession.lead_preferred_language && this.userSession.lead_preferred_language != ''){
            this.selectedLanguage = this.userSession.lead_preferred_language;
            this.translate.use(this.selectedLanguage);  
            this.translateWords();

          }else{
            if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
              this.selectedLanguage = localStorage.getItem('lang');
              this.translate.use(this.selectedLanguage);  
              this.translateWords();
            }else{
              Device.getLanguageCode().then(lang=>{
                this.selectedLanguage = lang.value;
                this.translate.use(this.selectedLanguage);  
                this.translateWords();
      
              });
            }

          }
        }else{
          if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
            this.selectedLanguage = localStorage.getItem('lang');
            this.translate.use(this.selectedLanguage);  
            this.translateWords();
          }else{
            Device.getLanguageCode().then(lang=>{
              this.selectedLanguage = lang.value;
              this.translate.use(this.selectedLanguage);  
              this.translateWords();

            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading languages:', error);
        // Usar idioma por defecto si hay error
        this.selectedLanguage = 'en';
        this.translate.use(this.selectedLanguage);
      }
    });
  }
  translateWords(){
    this.getCurrencies();
    
    this.translate.get(_('buttons.accept')).subscribe((text: string) => {
      this.alertButtons[0]=text;
    });
    this.translate.get(_('buttons.delete')).subscribe((text: string) => {
      this.deleteExtractAlertButtons[1].text =text;
      this.deleteLineAlertButtons[1].text = text;
      this.deleteAllNotMatchedAlertButtons[1].text = text;
      this.deleteBillAlertButtons[1].text = text;
      this.deleteAllAlertButtons[1].text = text;

      
    });
    this.translate.get(_('buttons.cancel')).subscribe((text: string) => {
      this.deleteExtractAlertButtons[0].text =text;
      this.alertRestartButtons[0].text = text;
      this.deleteLineAlertButtons[0].text = text;
      this.deleteAllNotMatchedAlertButtons[0].text = text;
      this.deleteBillAlertButtons[0].text = text;
      this.deleteAllAlertButtons[0].text = text;
      this.goBackAlertButtons[0].text = text;

    });
    this.translate.get(_('buttons.confirm')).subscribe((text: string) => {
      this.alertRestartButtons[1].text = text;
      this.goBackAlertButtons[1].text = text;
      

    });


  }
  loadTravel() {
    if (!this.travelId) {
      this.router.navigate(['/customer/trips']);
      return;
    }

    console.log('🔍 Loading travel with ID:', this.travelId);
    this.api.read('processes/' + this.travelId).subscribe({
      next: (res: any) => {
        if (res && (res.status === 200 || res.status === '200')) {
          console.log('📥 Travel loaded from server:', JSON.stringify(res.body, null, 2));
          console.log('📊 Server bills data:', res.body.process_data?.bills);
          this.openTravel(res.body);
        } else {
          console.error('❌ Failed to load travel, invalid response:', res);
          this.router.navigate(['/customer/trips']);
        }
      },
      error: (error) => {
        console.error('❌ Error loading travel:', error);
        this.router.navigate(['/customer/trips']);
      }
    });
  }

  openTravel(travel: any) {
    this.travelSelected = travel;
    this.currentStep = this.travelSelected['process_step'] || 1;
    this.extracts = { bills: [], extract: { type: '', currency: '' } };
    
    // Inicializar currencyBlockSelected de forma segura
    this.currencyBlockSelected = travel.process_country || null;

    console.log('travel',travel);
    if (this.travelSelected['process_data']) {
      console.log('🔍 process_data received:', this.travelSelected['process_data']);
      console.log('🔍 process_data.bills type:', typeof this.travelSelected['process_data'].bills);
      console.log('🔍 process_data.bills is Array:', Array.isArray(this.travelSelected['process_data'].bills));
      console.log('🔍 process_data.bills content:', this.travelSelected['process_data'].bills);
      
      this.extracts = this.travelSelected['process_data'];
      
      // Validar y corregir la estructura si es necesario
      if (this.extracts.bills && !Array.isArray(this.extracts.bills)) {
        console.warn('⚠️ bills is not an array, converting...');
        // Si bills es un objeto, intentar convertirlo a array
        if (typeof this.extracts.bills === 'object') {
          // Si el objeto tiene propiedades numéricas, convertir a array
          const billsArray = Object.keys(this.extracts.bills).map(key => this.extracts.bills[key]);
          this.extracts.bills = billsArray;
          console.log('✅ Converted bills to array:', this.extracts.bills);
        } else {
          // Si no es ni array ni objeto válido, inicializar como array vacío
          this.extracts.bills = [];
          console.log('✅ Initialized bills as empty array');
        }
      }

      // Validar y corregir la estructura interna de cada bill
      if (this.extracts.bills && Array.isArray(this.extracts.bills)) {
        this.extracts.bills.forEach((billGroup, index) => {
          if (billGroup && billGroup.bill && !Array.isArray(billGroup.bill)) {
            console.warn(`⚠️ billGroup[${index}].bill is not an array, converting...`);
            // Si bill es un objeto, intentar convertirlo a array
            if (typeof billGroup.bill === 'object') {
              const billArray = Object.keys(billGroup.bill).map(key => billGroup.bill[key]);
              billGroup.bill = billArray;
              console.log(`✅ Converted billGroup[${index}].bill to array:`, billGroup.bill);
            } else {
              // Si no es ni array ni objeto válido, inicializar como array vacío
              billGroup.bill = [];
              console.log(`✅ Initialized billGroup[${index}].bill as empty array`);
            }
          }
        });
      }
    } else {
      this.extracts = { bills: [], extract: { type: '', currency: '' } };
    }
    
    // Asegurar que bills siempre tenga al menos un elemento inicial si está vacío
    if (!this.extracts.bills || !Array.isArray(this.extracts.bills) || this.extracts.bills.length === 0) {
      this.extracts.bills = [{
        bill: [],
        currency: '',
        country: ''
      }];
      console.log('✅ Initialized bills with default structure');
    }
    
    // Asegurar que billPos sea válido
    if (this.billPos >= this.extracts.bills.length) {
      this.billPos = 0;
    }
    
    console.log('travelselected',this.travelSelected);

    console.log('this.extracts',this.extracts);

    if (this.travelSelected['process_result']) {
      this.results = this.travelSelected['process_result'];
    }

    if (this.travelSelected['process_settings']) {
      if (this.travelSelected['process_settings']['sendPdf']) {
        this.sendPdf = this.travelSelected['process_settings']['sendPdf'];
      }
      if (this.travelSelected['process_settings']['sendExcel']) {
        this.sendExcel = this.travelSelected['process_settings']['sendExcel'];
      }
      // Cargar userName y userEmail desde process_settings si existen, sino desde userSession
      if (this.travelSelected['process_settings']['userName']) {
        this.userName = this.travelSelected['process_settings']['userName'];
      }
      if (this.travelSelected['process_settings']['userEmail']) {
        this.userEmail = this.travelSelected['process_settings']['userEmail'];
      }
    }
    
    // Si no hay userName o userEmail, cargar desde userSession
    if ((!this.userName || !this.userEmail) && this.api.isLoggedIn()) {
      this.userSession = this.api.getUserData();
      if (this.userSession) {
        if (!this.userName) {
          this.userName = this.userSession.name || '';
        }
        if (!this.userEmail) {
          this.userEmail = this.userSession.email || '';
        }
        console.log('✅ User data loaded from session in openTravel:', { userName: this.userName, userEmail: this.userEmail });
      }
    }

    // Check if bills array exists and has elements at the current position
    if (this.extracts.bills &&
      Array.isArray(this.extracts.bills) &&
      this.extracts.bills.length > this.billPos &&
      this.extracts.bills[this.billPos] &&
      this.extracts.bills[this.billPos].bill &&
      Array.isArray(this.extracts.bills[this.billPos].bill) &&
      this.extracts.bills[this.billPos].bill.length > 0) {
      
      // Verificar que al menos un bill tenga status 1 (exitoso)
      const hasSuccessfulBills = this.extracts.bills[this.billPos].bill.some((bill: any) => bill.status === 1);
      
      if (hasSuccessfulBills) {
        this.isUploadingOther = false;
        console.log('✅ Bills found with successful uploads, not uploading other');
      } else {
        this.isUploadingOther = true;
        console.log('⚠️ Bills found but none successful, uploading other');
      }
    } else {
      this.isUploadingOther = true;
      console.log('✅ No bills found, uploading other');
    }
    
    // Forzar detección de cambios para actualizar la UI después de cargar los datos
    this.cdr.detectChanges();
  }

  loadCurrencies() {
    this.api.read('countries/' + this.selectedLanguage).subscribe(res => {
      if (res['status'] == 200) {
        this.currencies = res['body'];
        console.log(this.currencies)
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

  // Aquí irían todos los demás métodos del proceso que se copiarán de main.page.ts
  // Por ahora dejamos el componente básico funcional

  // Método para regresar al dashboard
  goBackToTrips() {
    this.router.navigate(['/customer/trips']);
  }

  // Método para cerrar el proceso
  closeProcess() {
    this.router.navigate(['/customer/trips']);
  }

  // Métodos stub para evitar errores de compilación
  // Estos serán implementados cuando se migre toda la lógica
  confirmDeleteExtract() {
    delete this.extracts['extract']['file'];
    delete this.extracts['extract']['status'];
    delete this.extracts['extract']['lines'];
    delete this.extracts['extract']['bankName'];
    delete this.extracts['extract']['blobName'];
    delete this.extracts['extract']['document_id'];
    delete this.extracts['extract']['endDate'];
    delete this.extracts['extract']['file_url'];
    delete this.extracts['extract']['mimeType'];
    delete this.extracts['extract']['startDate'];

    this.updateTravel();
    this.api.update('documents/'+ this.documentIdToDelete,{deleted:true}).subscribe(res=>{
    })
    this.isAlertDeleteExtract=false;
  }

  confirmRestartProcess() {
    sessionStorage.clear();
    this.isUploadingOther=true;
  }

  confirmDeleteLine() {
    this.results['notMatched'][this.selectedDeleteLine[0]]['bill'].splice(this.selectedDeleteLine[1],1);

    if(this.results['notMatched'][this.selectedDeleteLine[0]]['bill'].length <=0){
      this.results['notMatched'].splice(this.selectedDeleteLine[0],1);
    }
    
    // Actualizar el cache con los nuevos datos
    if (this.travelSelected && this.travelSelected._id) {
      const analysisKey = `analysis_result_${this.travelSelected._id}`;
      localStorage.setItem(analysisKey, JSON.stringify(this.results));
      console.log('🔄 Analysis cache updated after deleting line');
    }
    
    this.extracts.bills.forEach((billGroup,groupIndex) => {
      billGroup.bill.forEach((bill, billIndex) => {
        if(bill.document_id == this.docToDelete){
          this.extracts.bills[groupIndex].bill.splice(billIndex, 1);
        }
      });
    });
    this.confirmDeleteBill();

    this.updateTravel();
  }

  confirmDeleteAllNotMatchedLines() {
    this.results['notMatched']=[];
    // Actualizar el cache con los nuevos datos
    if (this.travelSelected && this.travelSelected._id) {
      const analysisKey = `analysis_result_${this.travelSelected._id}`;
      localStorage.setItem(analysisKey, JSON.stringify(this.results));
      console.log('🔄 Analysis cache updated after deleting all not matched');
    }
    this.updateTravel();
  }

  confirmDeleteBill() {
    this.extracts['bills'][this.idToDeleteBillContainer]['bill'].splice(this.idToDeleteBill, 1);

    if(this.extracts['bills'][this.idToDeleteBillContainer]['bill'].length <=0){
      this.isUploadingOther = true;
    }
    this.updateTravel();

    this.api.update('documents/'+ this.documentIdToDelete,{deleted:true}).subscribe(res=>{
    })
    
    this.isAlertDeleteBill=false;
  }

  confirmDeleteBillAll() {
    let extractsToDelete = this.extracts;

    extractsToDelete['bills'][this.billPos]['bill'].forEach( (bill,groupIndex) => {
      this.api.update('documents/'+ bill.document_id,{deleted:true}).subscribe(res=>{
      })
    });
    this.extracts['bills'].splice(this.billPos,1);

    this.billPos=0;
    this.selectCountry(this.billPos);
    this.updateTravel();
  }

  confirmGoBack() {
    this.backStep();
  }

  // Métodos principales del proceso
  takePhoto() {
    Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    }).then((imageData) => {
      this.imagesToUpload.push(imageData);
    }, (err) => {
      console.error('Error taking photo:', err);
    });
  }

  onFileDropped(files: any, type: string) {
    // Limpiar la interfaz para volver a la vista normal
    this.imagesToUpload = [];
    this.isUploadingOther = false;
    this.uploadFile(files, type);
  }

  deleteImageToUpload(index: number) {
    this.imagesToUpload.splice(index, 1);
  }

  uploadImagesBase64() {
    let files: any[] = [];

    this.imagesToUpload.forEach((image: any) => {
      const blob = this.dataURItoBlob(image.dataUrl || image);
      const file = new File([blob], 'receipt_' + Date.now() + '.jpg', { type: 'image/jpeg' });
      files.push(file);
    });

    // Limpiar imagesToUpload inmediatamente para volver a la vista normal
    this.imagesToUpload = [];
    this.isUploadingOther = false;
    
    this.uploadFile(files, 'bills');
  }

  dataURItoBlob(dataURI: string) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
  }

  sanitizeFileName(name: string): string {
    name = name.replace(/\s+/g, '-').toLowerCase();
    name = name.replace(/[^a-zA-Z0-9]/g,'');
    return name;
  }

  uploadFile(file: any[], type: string) {
    this.showAlertTime = true;
    // No establecer isUploading para no mostrar barra de progreso global
    this.travelSelected['last_uploaded_bill_date'] = Date.now();
    // NO actualizar aquí - esperar a que se complete la subida
    
    if (file.length > 0) {
      var arrFiles: any[] = [];
    
      for(const fileElement of file) {
        arrFiles.push(fileElement);

        if((fileElement.size/1048576)<=10) {
          if(type == 'extracts') {
            this.extracts['extract']['file'] = this.sanitizeFileName(fileElement.name);
            this.extracts['extract']['original_name'] = fileElement.name;
            this.extracts['extract']['status'] = 0;
            this.extracts['extract']['lines'] = [];
            // NO actualizar aquí - esperar a que se complete la subida
          }
          
          if(type == 'bills') {
            // Asegurar que extracts existe
            if(!this.extracts) {
              this.extracts = { bills: [], extract: { type: '', currency: '' } };
            }
            
            // Asegurar que bills es un array
            if(!this.extracts.bills || !Array.isArray(this.extracts.bills)) {
              this.extracts.bills = [];
            }
            
            // Asegurar que existe el elemento en la posición actual
            if(!this.extracts.bills[this.billPos]) {
              this.extracts.bills[this.billPos] = { bill: [], currency: '', country: '' };
            }
            
            // Asegurar que bill es un array
            if(!this.extracts.bills[this.billPos]['bill'] || !Array.isArray(this.extracts.bills[this.billPos]['bill'])) {
              this.extracts.bills[this.billPos]['bill'] = [];
            }
            
            console.log('billpos',this.extracts.bills[this.billPos]);

            this.extracts.bills[this.billPos]['bill'].push({ 
              original_name: fileElement.name, 
              file: this.sanitizeFileName(fileElement.name), 
              status: 0 
            });
          }
        }
      }

      // Procesar la subida de archivos
      for (let [indexFile, fileElement] of arrFiles.entries()) {
        if((fileElement.size/1048576)<=10) {
          if(type == 'extracts') {
            this.uploadExtractFile(fileElement);
          }
          
          if(type == 'bills') {
            this.uploadBillFile(fileElement, indexFile, arrFiles);
          }
        }
      }
    }
  }

  private uploadExtractFile(fileElement: any) {
    let form = new FormData();
    form.append('file', fileElement, fileElement.name); 
    form.append('process_id', this.travelSelected._id); 
    form.append('model_id', 'custom-ikosten-extracts-v2'); 

    this.api.sendForm('uploads/uploadExtract', form).subscribe(res => {
      let status = 500;
      if(!res['error'] && !res['body']['error']) {
        status = 1;
      } else {
        alert('Error subiendo el archivo');
      }

      this.extracts['extract']['status'] = status; 
      this.extracts['extract']['lines'] = res['body']['document_result']['lines']; 
      this.extracts['extract']['bankName'] = res['body']['document_result']['bankName']; 
      this.extracts['extract']['startDate'] = res['body']['document_result']['startDate']; 
      this.extracts['extract']['endDate'] = res['body']['document_result']['endDate']; 
      this.extracts['extract']['document_id'] = res['body']['document_id']; 
      this.extracts['extract']['file_url'] = res['body']['fileUrl']; 
      this.extracts['extract']['blobName'] = res['body']['document_result']['blobName']; 
      this.extracts['extract']['mimeType'] = res['body']['document_result']['mimeType']; 

      this.updateTravel();
      this.showAlertTime = false;
    });
  }

  private uploadBillFile(fileElement: any, indexFile: number, arrFiles: any[]) {
    let form = new FormData();
    form.append('file', fileElement, fileElement.name);
    form.append('process_id', this.travelSelected._id);
    form.append('model_id', 'custom-ikosten-bills-v2');

    console.log(`🔄 Uploading file ${indexFile + 1}/${arrFiles.length}: ${fileElement.name}`);

    this.api.sendForm('uploads/uploadBill', form).subscribe({
      next: (res) => {
        let status = 500;
        if(!res['error'] && !res['body']['error']) {
          status = 1;
        }

        console.log(`✅ File ${indexFile + 1}/${arrFiles.length} uploaded with status: ${status}`);

        // Actualizar el estado del bill
        if(this.extracts.bills[this.billPos] && this.extracts.bills[this.billPos].bill) {
          const billIndex = this.extracts.bills[this.billPos].bill.length - arrFiles.length + indexFile;
          if(this.extracts.bills[this.billPos].bill[billIndex]) {
            this.extracts.bills[this.billPos].bill[billIndex].status = status;
            if(status === 1 && res['body']['document_result']) {
              this.extracts.bills[this.billPos].bill[billIndex].vendor = res['body']['document_result']['vendor'];
              this.extracts.bills[this.billPos].bill[billIndex].date = res['body']['document_result']['date'];
              this.extracts.bills[this.billPos].bill[billIndex].hour = res['body']['document_result']['hour'];
              this.extracts.bills[this.billPos].bill[billIndex].total = res['body']['document_result']['total'];
              this.extracts.bills[this.billPos].bill[billIndex].document_id = res['body']['document_id'];
              this.extracts.bills[this.billPos].bill[billIndex].blobName = res['body']['document_result']['blobName'];
              this.extracts.bills[this.billPos].bill[billIndex].mimeType = res['body']['document_result']['mimeType'];
              
              console.log(`📋 Updated bill data for file ${indexFile + 1}:`, {
                vendor: res['body']['document_result']['vendor'],
                document_id: res['body']['document_id'],
                status: status
              });
            }
          }
        }
        
        // Solo actualizar el travel cuando sea el último archivo para evitar llamadas concurrentes
        if(indexFile === arrFiles.length - 1) {
          console.log(`🎯 All files uploaded successfully. Updating travel...`);
          console.log(`📊 Final extracts data:`, JSON.stringify(this.extracts, null, 2));
          
          this.updateTravel();
          this.showAlertTime = false;
        }
        
        // Forzar detección de cambios para actualizar la UI
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`❌ Error uploading file ${indexFile + 1}/${arrFiles.length}:`, error);
        
        // Actualizar estado del archivo a error
        if(this.extracts.bills[this.billPos] && this.extracts.bills[this.billPos].bill) {
          const billIndex = this.extracts.bills[this.billPos].bill.length - arrFiles.length + indexFile;
          if(this.extracts.bills[this.billPos].bill[billIndex]) {
            this.extracts.bills[this.billPos].bill[billIndex].status = 500;
          }
        }
        
        // Si es el último archivo, actualizar aunque haya error
        if(indexFile === arrFiles.length - 1) {
          console.log(`⚠️ Upload completed with errors. Updating travel...`);
          this.updateTravel();
          this.showAlertTime = false;
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  nextStep() {
    if(this.currentStep == 1) {
      this.currentStep++;
      this.travelSelected['process_step'] = this.currentStep;
      this.travelSelected['process_status'] = 1;
      this.updateTravel();
    } else if(this.currentStep == 2) {
      this.currentStep++;
      this.travelSelected['process_step'] = this.currentStep;
      
      this.getAnalysisResult().then(res => {
        console.log('📊 Analysis completed successfully:', res);
        /*
        if(this.countNotMatched() <= 0) {
          this.currentStep++;
          this.travelSelected['process_step'] = this.currentStep;
        }
          */
        // Solo una llamada después de que todo esté listo
        this.updateTravel();
      }).catch(error => {
        console.error('❌ Analysis failed in nextStep:', error);
        // Aquí puedes agregar una notificación al usuario o manejar el error
        alert('Error en el análisis: ' + error);
        // Revertir el paso si es necesario
        this.currentStep = 2;
        this.travelSelected['process_step'] = this.currentStep;
      });
      
      // NO llamar updateTravel aquí - esperar a que termine getAnalysisResult
    } else if(this.currentStep < 5) {
      this.currentStep++;
      this.travelSelected['process_step'] = this.currentStep;
      this.updateTravel();
    }
  }

  backStep() {
    if(this.currentStep == 3) {
      this.isAlertGoBack = false;
    }

    if(this.currentStep == 1) {
      this.goBackToTrips();
      return; // No necesita actualizar si se va a trips
    }
    
    if(this.currentStep > 1) {
      this.currentStep--;
    }
    
    if(this.currentStep == 3) {
      this.results = undefined;
      // Limpiar también el cache de localStorage
      this.clearAnalysisCache();
    }
    
    // Solo una llamada a updateTravel al final
    if(this.currentStep > 0) {
      this.travelSelected['process_step'] = this.currentStep;
      this.updateTravel();
    }
  }

  getAnalysisResult(): Promise<any> {
    return new Promise((resolve, reject) => {
      const analysisKey = `analysis_result_${this.travelSelected._id}`;
      
      // Primero verificar si existe en travelSelected
      if(this.travelSelected && this.travelSelected['process_result']) {
        console.log('🔄 Loading existing analysis results from travelSelected');
        this.results = this.travelSelected['process_result'];
        this.isLoadingAnalysisFromCache = false;
        // Validar que notMatched sea un array
        if(this.results && this.results.notMatched && !Array.isArray(this.results.notMatched)) {
          console.warn('⚠️ Converting notMatched to array');
          this.results.notMatched = [];
        }
        resolve(this.results);
      } else if(localStorage.getItem(analysisKey)) {
        console.log('🔄 Loading analysis results from localStorage');
        this.isLoadingAnalysisFromCache = true;
        
        try {
          this.results = JSON.parse(localStorage.getItem(analysisKey) || '{}');
          // Validar que notMatched sea un array
          if(this.results && this.results.notMatched && !Array.isArray(this.results.notMatched)) {
            console.warn('⚠️ Converting notMatched to array from localStorage');
            this.results.notMatched = [];
          }
          
          // También guardar en travelSelected para consistencia
          if(this.travelSelected) {
            this.travelSelected['process_result'] = this.results;
          }
          
          this.isLoadingAnalysisFromCache = false;
          resolve(this.results);
        } catch(error) {
          console.error('❌ Error parsing localStorage analysis data:', error);
          localStorage.removeItem(analysisKey);
          this.isLoadingAnalysisFromCache = false;
          // Continuar con API call
          this.makeAnalysisAPICall(resolve, reject, analysisKey);
        }
      } else {
        console.log('🔄 Making new API call for analysis');
        this.makeAnalysisAPICall(resolve, reject, analysisKey);
      }
    });
  }
  
  private makeAnalysisAPICall(resolve: any, reject: any, analysisKey: string) {
    this.api.create('processes/getResult', {
      process_id: this.travelSelected._id,
      bills: this.extracts.bills,
      extract: this.extracts.extract
    }).subscribe({
      next: (res) => {
        console.log('✅ Analysis response received:', res);
        if(res['status'] == 200 || res['status'] == 201) {
          let responseData = res['body'];
          
          // Normalizar la respuesta del backend para asegurar la estructura correcta
          this.results = {
            matchedBills: responseData.matchedExtracts || responseData.matchedBills || [],
            notMatched: responseData.notMatched || [],
            notMatchedExtractLines: responseData.notMatchedExtractLines || {},
            startDate: responseData.startDate || '',
            endDate: responseData.endDate || ''
          };
          
          console.log('📊 Normalized results:', this.results);
          
          // Validar que notMatched sea un array
          if(!Array.isArray(this.results.notMatched)) {
            console.warn('⚠️ notMatched is not an array, initializing as empty array');
            this.results.notMatched = [];
          }
          
          // Validar que matchedBills sea un array
          if(!Array.isArray(this.results.matchedBills)) {
            console.warn('⚠️ matchedBills is not an array, initializing as empty array');
            this.results.matchedBills = [];
          }
          
          // Guardar en localStorage con key específico del viaje
          localStorage.setItem(analysisKey, JSON.stringify(this.results));
          console.log('💾 Results saved to localStorage');
          
          // También guardar en travelSelected
          if(this.travelSelected) {
            this.travelSelected['process_result'] = this.results;
            console.log('💾 Results saved to travelSelected');
          }
          
          resolve(this.results);
        } else {
          console.error('❌ Analysis failed - bad status:', res['status']);
          reject('Error en análisis: Status ' + res['status']);
        }
      },
      error: (error) => {
        console.error('❌ Analysis HTTP error:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        reject('Error en análisis: ' + (error.error?.body || error.message || 'Unknown error'));
      }
    });
  }



  openUploading() {
    this.isUploadingOther = true;
  }

  checkBillsErrors(): boolean {
    // Verificar si existe la estructura básica
    if (!this.extracts || !this.extracts.bills) {
      console.log('❌ checkBillsErrors: extracts or bills missing');
      return true; // Hay error si no existe la estructura
    }

    // Verificar si bills es un array
    if (!Array.isArray(this.extracts.bills)) {
      console.warn('⚠️ checkBillsErrors: bills is not an array:', typeof this.extracts.bills);
      return true; // Hay error si bills no es un array
    }
    
    // Verificar si existe el bill actual
    if (!this.extracts.bills[this.billPos] || !this.extracts.bills[this.billPos].bill) {
      console.log('❌ checkBillsErrors: bill at position', this.billPos, 'missing');
      return true; // Hay error si no existe el bill
    }
    
    // Verificar errores en las facturas
    const currentBills = this.extracts.bills[this.billPos].bill;
    
    // Asegurar que currentBills es un array
    if (!Array.isArray(currentBills)) {
      console.warn('⚠️ checkBillsErrors: currentBills is not an array:', typeof currentBills, currentBills);
      return true; // Hay error si currentBills no es un array
    }
    
    const hasErrors = currentBills.some((bill: any) => bill.status === 500 || bill.status === 0);
    console.log('🔍 checkBillsErrors result:', hasErrors, 'for bills:', currentBills);
    return hasErrors;
  }

  hasSuccessfulBills(): boolean {
    // Verificar si existe la estructura básica
    if (!this.extracts || !this.extracts.bills) {
      return false;
    }

    // Verificar si bills es un array
    if (!Array.isArray(this.extracts.bills)) {
      return false;
    }
    
    // Verificar si existe el bill actual
    if (!this.extracts.bills[this.billPos] || !this.extracts.bills[this.billPos].bill) {
      return false;
    }
    
    // Verificar si hay al menos un bill exitoso (status === 1)
    const currentBills = this.extracts.bills[this.billPos].bill;
    
    // Asegurar que currentBills es un array
    if (!Array.isArray(currentBills)) {
      console.warn('⚠️ hasSuccessfulBills: currentBills is not an array:', typeof currentBills, currentBills);
      return false;
    }
    
    const hasSuccessfulBills = currentBills.some((bill: any) => bill.status === 1);
    console.log('🔍 hasSuccessfulBills result:', hasSuccessfulBills, 'for bills:', currentBills);
    return hasSuccessfulBills;
  }

  deleteBill(groupIndex: number, billIndex: number, documentId: string) {
    this.isAlertDeleteBill = true;
    this.idToDeleteBill = billIndex;
    this.documentIdToDelete = documentId;
    this.idToDeleteBillContainer = groupIndex;
  }

  deleteAllReceiptsAlert() {
    this.isAlertDeleteAll = true;
  }

  showModalPicker(title: string, type: string) {
    this.shepherdService.hide();
    this.pickerTitle = title;
    this.showPicker = true;
    this.pickerType = type;
    this.pickerOptions = this.currencies;
  }

  convertKey(input: string): string {
    if (!input) return '';
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    return string;
  }

  changeExtractType() {
    this.updateTravel();
  }

  deleteExtract(index: number, documentId: string) {
    this.isAlertDeleteExtract = true;
    this.idToDelete = index;
    this.documentIdToDelete = documentId;
  }

  countNotMatched(): number {
    if (!this.results || !this.results.notMatched || !Array.isArray(this.results.notMatched)) {
      console.log('⚠️ countNotMatched: results.notMatched is not valid array', this.results?.notMatched);
      return 0;
    }
    return this.results.notMatched.reduce((count: number, group: any) => {
      return count + (group.bill ? group.bill.length : 0);
    }, 0);
  }

  clearAnalysisCache() {
    if (this.travelSelected && this.travelSelected._id) {
      const analysisKey = `analysis_result_${this.travelSelected._id}`;
      localStorage.removeItem(analysisKey);
      console.log('🗑️ Analysis cache cleared for travel:', this.travelSelected._id);
    }
  }

  deleteAllNotMatched() {
    this.isDeletingAllNotMatched = true;
  }

  deleteNotMatched(groupIndex: number, billIndex: number, line: any) {
    this.selectedDeleteLine = [groupIndex, billIndex];
    this.docToDelete = line.document_id;
    this.isDeletingLine = true;
  }

  updateTravel() {
    // Si ya hay una actualización en progreso, marcar que hay una pendiente
    if (this.isUpdatingTravel) {
      console.log('⚠️ updateTravel already in progress, queuing...');
      this.updateQueue = true;
      return;
    }
    
    this.isUpdatingTravel = true;
    this.updateQueue = false;
    
    // Crear una copia profunda de los datos para evitar modificaciones durante la transmisión
    const dataToSend = {
      ...this.travelSelected,
      process_data: JSON.parse(JSON.stringify(this.extracts)),
      process_result: this.results ? JSON.parse(JSON.stringify(this.results)) : undefined
    };

    if(this.api.isLoggedIn()) {
      console.log('🔄 Updating travel for logged in user:');
      console.log('📤 Travel ID:', this.travelSelected._id);
      console.log('📤 Process data being sent:', JSON.stringify(dataToSend.process_data, null, 2));
      
      this.api.update('processes/'+this.travelSelected._id, dataToSend).subscribe({
        next: (res) => {
          console.log('✅ Travel updated successfully:', res);
          console.log('📥 Server response details:', JSON.stringify(res, null, 2));
          
          // Verificar si el servidor devolvió algún error específico
          if (res && res.body && res.body.error) {
            console.error('🚨 Server returned error in body:', res.body.error);
          }
          
          // Hacer una verificación inmediata para confirmar que se guardó
          setTimeout(() => {
            console.log('🔍 Verifying data was saved...');
            this.api.read('processes/' + this.travelSelected._id).subscribe({
              next: (verifyRes: any) => {
                if (verifyRes && verifyRes.body && verifyRes.body.process_data) {
                  console.log('✅ Verification: Data found in server:', JSON.stringify(verifyRes.body.process_data.bills, null, 2));
                } else {
                  console.error('❌ Verification: No data found in server response');
                }
              },
              error: (verifyError) => {
                console.error('❌ Verification failed:', verifyError);
              }
            });
          }, 500);
          
          this.isUpdatingTravel = false;
          
          // Si hay una actualización pendiente en cola, ejecutarla
          if (this.updateQueue) {
            console.log('🔄 Processing queued update...');
            setTimeout(() => this.updateTravel(), 100);
          }
        },
        error: (error) => {
          console.error('❌ Error updating travel:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          this.isUpdatingTravel = false;
          
          // En caso de error, intentar la actualización pendiente después de un delay
          if (this.updateQueue) {
            console.log('🔄 Retrying queued update after error...');
            setTimeout(() => this.updateTravel(), 1000);
          }
        }
      });
    } else {
      // Para usuarios no logueados, guardar en sessionStorage
      let travels = JSON.parse(sessionStorage.getItem('travels') || '[]');
      travels.forEach((element: any, index: number) => {
        if(element._id == this.travelSelected._id) {
          travels[index] = dataToSend;
        }
      });
      sessionStorage.setItem('travels', JSON.stringify(travels));
      this.isUpdatingTravel = false;
      
      // Procesar cola si hay pendientes
      if (this.updateQueue) {
        setTimeout(() => this.updateTravel(), 100);
      }
    }
  }

  changeExportSettings() {
    if(!this.travelSelected['process_settings']) {
      this.travelSelected['process_settings'] = {};
    }
    this.travelSelected['process_settings']['sendPdf'] = this.sendPdf ? true : false;
    this.travelSelected['process_settings']['sendExcel'] = this.sendExcel ? true : false;
    this.travelSelected['process_settings']['userName'] = this.userName;
    this.travelSelected['process_settings']['userEmail'] = this.userEmail;
    this.updateTravel();
  }

  sendResult() {
    // Validar que al menos una opción esté seleccionada
    if (!this.sendPdf && !this.sendExcel) {
      alert(this.translate.instant('errors.export.no-format-selected'));
      return;
    }

    // Validar que haya nombre y email
    if (!this.userName || !this.userEmail) {
      alert(this.translate.instant('errors.export.missing-user-info'));
      return;
    }

    this.sendingForm = true;

    let exportSettings = {
      userName: this.userName,
      userEmail: this.userEmail,
      sendPdf: this.sendPdf,
      sendExcel: this.sendExcel
    };

    let obj = {
      lead_name: this.userName,
      lead_email: this.userEmail.toLowerCase(),
      process_id: this.travelSelected._id
    };

    this.updateOrCreateLead(obj).then(() => {
      // Validar que existan resultados del análisis
      if (!this.results) {
        console.error('❌ No analysis results available');
        this.sendingForm = false;
        alert('Error: No hay resultados de análisis disponibles. Por favor, completa el paso 3 primero.');
        return;
      }

      // Preparar datos para el backend según el formato esperado
      const requestData = {
        process_id: this.travelSelected._id,
        exportSettings: exportSettings,
        userEmail: this.userEmail,
        userName: this.userName,
        lang: this.selectedLanguage || 'es',
        results: this.results  // Agregar los resultados del análisis
      };
      
      console.log('📤 Sending data to backend:', requestData);
      
      this.api.create('processes/sendResult', requestData).subscribe({
        next: (res) => {
          if(res['status'] == 200 || res['status'] == 201) {
            console.log('✅ Resultados enviados exitosamente');
            this.travelSelected['process_status'] = 2;
            this.sendingForm = false;
            this.nextStep();
            this.updateTravel();
          }
        },
        error: (err) => {
          console.error('❌ Error sending results:', err);
          this.sendingForm = false;
          // Mostrar mensaje de error al usuario
          const errorMessage = err.error?.userMessage || 'Error al enviar los resultados. Por favor, intenta de nuevo.';
          alert(errorMessage);
        }
      });
    });
  }

  finishProcess(event: any) {
    this.api.create('ratings', {
      ratings_lead_email: this.userEmail,
      ratings_process: this.travelSelected._id,
      ratings_score: event['score'],
      ratings_comment: event['comment']
    }).subscribe(res => {
      this.closeProcess();
    });
  }

  reSendResult() {
    this.sendingForm = true;
    
    let exportSettings = {
      userName: this.userName,
      userEmail: this.userEmail,
      sendPdf: this.sendPdf,
      sendExcel: this.sendExcel
    };

    // Validar que existan resultados del análisis
    if (!this.results) {
      console.error('❌ No analysis results available');
      this.sendingForm = false;
      alert('Error: No hay resultados de análisis disponibles.');
      return;
    }

    // Preparar datos para el backend según el formato esperado
    const requestData = {
      process_id: this.travelSelected._id,
      exportSettings: exportSettings,
      userEmail: this.userEmail,
      userName: this.userName,
      lang: this.selectedLanguage || 'es',
      results: this.results  // Agregar los resultados del análisis
    };

    console.log('📤 Re-sending data to backend:', requestData);

    this.api.create('processes/sendResult', requestData).subscribe({
      next: (res) => {
        this.sendingForm = false;
        if(res['status'] == 200 || res['status'] == 201) {
          console.log('✅ Resultados reenviados exitosamente');
          this.showAlertResend = true;
        }
      },
      error: (err) => {
        console.error('❌ Error reenviando resultados:', err);
        this.sendingForm = false;
        alert('Error al reenviar los resultados. Por favor, intenta de nuevo.');
      }
    });
  }

  updateOrCreateLead(obj: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if(this.api.isLoggedIn() && this.userSession) {
        this.api.update('leads/' + this.userSession.id, obj).subscribe(res => {
          resolve(res);
        });
      } else {
        this.api.create('leads', obj).subscribe(res => {
          resolve(res);
        });
      }
    });
  }

  // Métodos helper para validaciones
  isBillsArray(): boolean {
    return this.extracts && this.extracts.bills && Array.isArray(this.extracts.bills);
  }

  getBillsArray(): any[] {
    return this.isBillsArray() ? this.extracts.bills : [];
  }

  getCurrentBillArray(): any[] {
    if (this.isBillsArray() && 
        this.extracts.bills.length > this.billPos && 
        this.extracts.bills[this.billPos] && 
        this.extracts.bills[this.billPos].bill && 
        Array.isArray(this.extracts.bills[this.billPos].bill)) {
      return this.extracts.bills[this.billPos].bill;
    }
    
    // Si llegamos aquí, asegurar que tenemos una estructura válida
    if (this.extracts && this.extracts.bills && Array.isArray(this.extracts.bills) && this.extracts.bills[this.billPos]) {
      // Si bill no es un array, inicializarlo como array vacío
      if (!Array.isArray(this.extracts.bills[this.billPos].bill)) {
        console.warn('⚠️ getCurrentBillArray: bill is not an array, initializing as empty array');
        this.extracts.bills[this.billPos].bill = [];
      }
      return this.extracts.bills[this.billPos].bill;
    }
    
    return [];
  }

  hasBillsAtCurrentPosition(): boolean {
    return this.getCurrentBillArray().length > 0;
  }

  getCurrentBillCurrency(): string {
    if (this.isBillsArray() && 
        this.extracts.bills.length > this.billPos && 
        this.extracts.bills[this.billPos] && 
        this.extracts.bills[this.billPos].currency) {
      return this.extracts.bills[this.billPos].currency;
    }
    return '';
  }

  // Funciones adicionales necesarias
  addZero(value: number): string {
    return ("0" + value).slice(-2);
  }

  pickerDismissed() {
    this.showPicker = false;
  }

  pickerOptionSelected(event){
    if(this.pickerType == 'country'){

      this.currencyBlockSelected = event;
      this.scrollToTarget('card-step-2');
      /*
      uncomment
      this.validateCountriesLimitations().then(res=>{
        if(res){
          this.currencyBlockSelected = event;
          this.scrollToTarget('card-step-2');
        }else{
          this.router.navigate(['/customer/memberships']);
          this.currencyBlockSelected=undefined;
        }
      })
        */

      /*
      if(this.travelSelected.process_data.bills.length >= this.limitations.limitations_country_x_travel){


        var founds = 0;
        this.travelSelected.process_data.bills.forEach(bill => {


          if(bill.country == event.country){
            founds ++;
          }
        });


        if(founds == 0){
          this.showModalUpgrade=true;
          this.currencyBlockSelected=undefined;
        }else{
          this.currencyBlockSelected = event;
          this.scrollToTarget('card-step-2');
        }
        

      }else{

        this.currencyBlockSelected = event;
        this.scrollToTarget('card-step-2');
      }
        */
      


      
    }
    if(this.pickerType == 'add_country'){
      
      var found = 0;
      var code = event.code;
      var country = event.country;

      this.extracts.bills.forEach(bill => {
        if(bill.currency == event.code && bill.country == event.country){
          found = 1;
        }
      });

      if(found == 0){

        let newcountry = {
          currency:code,
          country: country,
          bill:[]
        }
        this.extracts.bills.push(newcountry);
        this.billPos = this.extracts.bills.length -1;
        this.selectCountry(this.billPos);
        this.updateTravel();
      }
    }
    if(this.pickerType == 'currency'){
      this.extracts['extract']['currency'] = event;
      this.scrollToTarget('card-step-4');

    }

  }

  fileBrowseHandler(event: any, type: string) {
    const files = event.target.files;
    // Limpiar la interfaz para volver a la vista normal
    this.imagesToUpload = [];
    this.isUploadingOther = false;
    this.uploadFile(files, type);
  }

  // Métodos para alertas y modales
  dismissDeleteExtract() {
    this.isAlertDeleteExtract = false;
  }

  dismissDeleteBill() {
    this.isAlertDeleteBill = false;
    this.idToDeleteBill = 0;
    this.idToDeleteBillContainer = 0;
  }

  dismissDeleteAll() {
    this.isAlertDeleteAll = false;
  }

  dismissDeleteLine() {
    this.isDeletingLine = false;
    this.selectedDeleteLine = undefined;
  }

  dismissDeleteAllNotMatched() {
    this.isDeletingAllNotMatched = false;
  }

  // Función para validar si el archivo es imagen
  isImage(mime: string): boolean {
    return this.imageMimes.indexOf(mime) >= 0;
  }

  // Función para validar si el archivo es PDF
  isPdf(mime: string): boolean {
    if(mime) {
      return this.pdfMimes.indexOf(mime) >= 0;
    }
    return false;
  }

  // Función para sanitizar imágenes
  sanitizeImage(blob: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + blob);
  }

  // Funciones adicionales del proceso
  deleteLine(i: number, line: any) {
    this.selectedDeleteLine = [i, line];
    this.isDeletingLine = true;
  }

  editLine(line: any) {
    // TODO: Implementar edición de línea si es necesario
    this.isEdditingLine = true;
  }

  selectCountry(index: number) {
    this.billPos = index;
    if(this.extracts.bills && this.extracts.bills[index]) {
      var code = this.extracts.bills[index].currency;
      var country = this.extracts.bills[index].country;
      this.currencyBlockSelected = {country: country, currency: code};

      if(this.extracts.bills[this.billPos].bill && this.extracts.bills[this.billPos].bill.length > 0) {
        this.isUploadingOther = false;
      } else {
        this.isUploadingOther = true;
      }
    }
  }

  // Método para verificar el estado de subida
  checkUploadStatus() {
    if(!this.extracts || 
       (this.extracts && this.extracts['bills'].length <= 0)) {
      return false;
    } else {
      let founds = 0;
      this.extracts.bills.forEach((element: any, index: number) => {
        element.bill.forEach((bill: any) => {
          if(bill.status == 0) {
            founds++;
          }
        });
      });
      
      return founds > 0;
    }
  }

  // Funciones para contar resultados
  countBills(): number {
    if(this.extracts && this.extracts['bills']) {
      return this.extracts['bills'].length;
    } else {
      return 0;
    }
  }

  countMatched(): number {
    let founds = 0;
    if(this.results && this.results['matchedBills']) {
      this.results['matchedBills'].forEach((element: any) => {
        founds += element.bill.length;
      });
    }
    return founds;
  }

  // Métodos para modales
  onWillDismiss() {
    this.openModalMemberships = false;
  }

  onWillDismissEditLine() {
    this.isEdditingLine = false;
    // TODO: Limpiar selectedLine si existe
  }

  onWillDismissModalHelp() {
    this.modalHelp = false;
  }

  onWillDismissAddTravel() {
    this.openModalAddTravel = false;
    this.currencyBlockSelected = undefined;
  }

  // Métodos para dismiss de alertas
  dismissAlertFounds() {
    this.showAlertFounds = false;
  }

  dismissAlertFoundsNotMatched() {
    this.showAlertFoundsMatched = false;
  }

  dismissAlertRestart() {
    this.showAlertRestart = false;
  }

  // Métodos adicionales para funcionalidad
  skipRevision() {
    this.nextStep();
    this.modalHelp = false;
  }

  confirmDeleteTravel() {
    // TODO: Implementar lógica de confirmación de eliminación de viaje
    this.showAlertDeleteTravel = false;
  }

  confirmDeleteTravelDialog(travel: any, event: any) {
    // TODO: Implementar lógica para mostrar diálogo de confirmación
    event.stopPropagation();
    this.travelToDelete = travel;
    this.showAlertDeleteTravel = true;
  }

  openLogin() {
    // TODO: Implementar navegación a login
    this.showAlertLogin = false;
  }

  scrollToTarget(elementId: string) {
    // TODO: Implementar scroll hacia elemento específico
    console.log('Scrolling to:', elementId);
  }

  finishEditLine() {
    // TODO: Implementar lógica para finalizar edición de línea
    this.isEdditingLine = false;
  }
}
