import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from '../../services/api.service';
import {AuthService} from '../../services/auth.service';
import {TranslateService} from "@ngx-translate/core";
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {

  userName:string;
  userEmail:string;
  userPhone:string;
  selectedCountry:any;

  availableCountries:any=[];

  selectedLanguage:string;
  availableLanguages:any=[];
  userSession:any;
  activeMebership:any;

  loadingButtons:boolean=false;
  availableLanguage:any;
  transactions:any;
  transactionsHistory:any = [];
  showModalAllTransacions:boolean=false;
  isTransactionsLoading:boolean=false;
  
  // Paginación para transacciones
  currentTransactionsPage:number = 1;
  transactionsPageLimit:number = 20;
  hasMoreTransactions:boolean = false;
  totalTransactions:number = 0;
  isLoadingMoreTransactions:boolean = false;



  showAlertDeleteAccount:boolean=false;
  showAlertAccountDeleted:boolean=false;
  showAlertError:boolean=false;
  
  alertButtonsAccept = ['buttons.accept'];
  loadingDelete:boolean=false;

  public alertButtons = [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete-account',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteAccount()
      },
    },
  ];

  constructor(
    private router:Router, 
    private api:ApiService,
    private authService:AuthService,
    private translate: TranslateService, 
    public platform: Platform,
  ) { }

  ionViewWillEnter(){
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
        this.translateAlerts();
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
          this.translateAlerts();
          
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

  }
  ngOnInit() {

    // Obtener usuario del nuevo sistema de autenticación
    const currentUser = this.authService.getCurrentUser();
    
    if(currentUser){
      this.userSession = {
        _id: currentUser.id,
        lead_name: currentUser.name,
        lead_email: currentUser.email,
        lead_phone: '', // Estos datos podrían venir del backend
        lead_country: '',
        lead_role: currentUser.role,
        lead_preferred_language: ''
      };

      // Cargar datos completos del usuario desde el backend
      this.api.read('leads/' + currentUser.id).subscribe(res => {
        if(res && res['body']){
          const userData = res['body'];
          console.log('👤 User data loaded:', userData);
          this.userSession = {
            _id: userData._id,
            lead_name: userData.lead_name,
            lead_email: userData.lead_email,
            lead_phone: userData.lead_phone || '',
            lead_country: userData.lead_country || '',
            lead_role: userData.lead_role,
            lead_preferred_language: userData.lead_preferred_language || ''
          };
          
          this.userName = this.userSession.lead_name;
          this.userEmail = this.userSession.lead_email;
          this.userPhone = this.userSession.lead_phone;
          
          // Seleccionar el país después de cargar los datos del usuario
          this.selectUserCountry();
          
          if(this.userSession.lead_role > 0){
            this.getActiveMembership();
          }
        }
      });
      
      this.userName = this.userSession.lead_name;
      this.userEmail = this.userSession.lead_email;
      this.userPhone = this.userSession.lead_phone;
    }

    this.getAvailableCountries();
    this.getLanguages();
    this.getTransactions();
  }
  openModalTransactions(){
    this.showModalAllTransacions = true;
    this.currentTransactionsPage = 1;
    this.transactionsHistory = [];
    this.loadTransactionsHistory(true);
  }

  loadTransactionsHistory(resetPagination: boolean = false) {
    if (!this.userSession || !this.userSession._id) {
      console.error('❌ No user session available');
      return;
    }

    if (resetPagination) {
      this.currentTransactionsPage = 1;
      this.transactionsHistory = [];
      this.isTransactionsLoading = true;
    } else {
      this.isLoadingMoreTransactions = true;
    }

    console.log('🔄 Loading transactions, page:', this.currentTransactionsPage);

    this.api.read(`transactions/lead/${this.userSession._id}?page=${this.currentTransactionsPage}&limit=${this.transactionsPageLimit}`)
      .subscribe({
        next: (res) => {
          if (res['status'] == 201) {
            const responseData = res['body'];
            const newTransactions = responseData.data || responseData;
            const pagination = responseData.pagination;

            console.log('✅ Transactions loaded:', newTransactions);

            if (pagination) {
              this.hasMoreTransactions = pagination.hasMore;
              this.totalTransactions = pagination.totalTransactions;
              console.log('📊 Pagination info:', {
                currentPage: pagination.currentPage,
                hasMore: pagination.hasMore,
                totalTransactions: pagination.totalTransactions
              });
            }

            // Agregar nuevas transacciones al array existente
            if (resetPagination) {
              this.transactionsHistory = newTransactions;
            } else {
              this.transactionsHistory = [...this.transactionsHistory, ...newTransactions];
            }
          }
          this.isTransactionsLoading = false;
          this.isLoadingMoreTransactions = false;
        },
        error: (error) => {
          console.error('❌ Error loading transactions:', error);
          this.isTransactionsLoading = false;
          this.isLoadingMoreTransactions = false;
        }
      });
  }

  loadMoreTransactions(event: any) {
    if (this.isLoadingMoreTransactions || !this.hasMoreTransactions) {
      event.target.complete();
      return;
    }

    this.currentTransactionsPage++;
    console.log('📄 Loading more transactions, page:', this.currentTransactionsPage);

    this.api.read(`transactions/lead/${this.userSession._id}?page=${this.currentTransactionsPage}&limit=${this.transactionsPageLimit}`)
      .subscribe({
        next: (res) => {
          if (res['status'] == 201) {
            const responseData = res['body'];
            const newTransactions = responseData.data || responseData;
            const pagination = responseData.pagination;

            if (pagination) {
              this.hasMoreTransactions = pagination.hasMore;
              this.totalTransactions = pagination.totalTransactions;
            }

            // Agregar nuevas transacciones
            this.transactionsHistory = [...this.transactionsHistory, ...newTransactions];
          }
          event.target.complete();
        },
        error: (error) => {
          console.error('❌ Error loading more transactions:', error);
          event.target.complete();
        }
      });
  }
  getActiveMembership(){
    this.api.read('purchasedMemberships/lead/'+this.userSession._id).subscribe(res=>{
      console.log('✅ Memberships loaded:', res);
      if(res['body'] && res['body'].length > 0){
        // El backend ahora devuelve solo membresías activas ordenadas por fecha
        this.activeMebership = res['body'][0];
        console.log('✅ Active membership:', this.activeMebership);
      } else {
        console.log('⚠️ No active memberships found');
        this.activeMebership = null;
      }
    }, error => {
      console.error('❌ Error loading memberships:', error);
      this.activeMebership = null;
    })
  }

  getTransactions(){
    this.api.read('transactions/top3/lead/'+this.userSession._id).subscribe(res=>{
      console.log('transactions',res);
      this.transactions = res['body'];
    })
  }
  openMemberships(){
    this.router.navigate(['/customer/memberships']);
  }

  confirmCancelMembership() {
    this.translate.get([
      _('alerts.cancel-membership.title'),
      _('alerts.cancel-membership.message'),
      _('buttons.confirm'),
      _('buttons.cancel')
    ]).subscribe((translations) => {
      const alert = document.createElement('ion-alert');
      alert.header = translations['alerts.cancel-membership.title'];
      alert.message = translations['alerts.cancel-membership.message'];
      alert.buttons = [
        {
          text: translations['buttons.cancel'],
          role: 'cancel'
        },
        {
          text: translations['buttons.confirm'],
          role: 'confirm',
          handler: () => {
            this.cancelMembership();
          }
        }
      ];
      document.body.appendChild(alert);
      alert.present();
    });
  }

  cancelMembership() {
    if (!this.activeMebership || !this.activeMebership._id) {
      return;
    }

    this.api.update(`purchasedMemberships/cancel/${this.activeMebership._id}`, {}).subscribe(
      (res) => {
        if (!res['error']) {
          this.translate.get(_('messages.membership-cancelled')).subscribe((text) => {
            const alert = document.createElement('ion-alert');
            alert.header = text;
            alert.buttons = ['OK'];
            document.body.appendChild(alert);
            alert.present();
          });
          
          // NO cambiar lead_role aquí - el usuario mantiene acceso hasta el fin del período
          // El backend y el job periódico se encargan de actualizar el rol cuando expire
          
          // Forzar actualización de datos del usuario desde el backend
          // Esto asegura que cualquier cambio se refleje inmediatamente
          this.authService.forceRefreshUserData();
          
          // Recargar datos de membresía
          this.getActiveMembership();
        } else {
          this.showAlertError = true;
        }
      },
      (error) => {
        console.error('Error cancelling membership:', error);
        this.showAlertError = true;
      }
    );
  }

  translateAlerts(){
    this.translate.get(_('buttons.accept')).subscribe((text: string) => {
      this.alertButtonsAccept[0] =text;
      console.log('translate', this.alertButtonsAccept)

    });
    this.translate.get(_('buttons.delete-account')).subscribe((text: string) => {
      this.alertButtons[1].text =text;

    });
    this.translate.get(_('buttons.cancel')).subscribe((text: string) => {
      this.alertButtons[0].text =text;

    });

  }
  changeLanguage(){
    this.translate.use(this.selectedLanguage);

    this.api.update('leads/'+this.userSession._id, {
      lead_preferred_language: this.selectedLanguage
    }).subscribe(res=>{
      this.loadingButtons = false;

      console.log(res);
    })

  }

  getAvailableCountries(){
    this.api.read('availableCountries').subscribe(res=>{
      this.availableCountries= res['body'];
      console.log('🌍 Available countries loaded:', this.availableCountries);
      
      // Intentar seleccionar el país del usuario después de cargar los países
      this.selectUserCountry();
    })
  }

  selectUserCountry(){
    // Solo intentar seleccionar si tenemos países disponibles y datos del usuario
    if(this.availableCountries && this.availableCountries.length > 0 && 
       this.userSession && this.userSession.lead_country){
      
      console.log('🔍 Searching for user country:', this.userSession.lead_country);
      
      // Buscar el país por _id en la lista de países disponibles
      const userCountry = this.availableCountries.find((country: any) => 
        country._id === this.userSession.lead_country
      );
      
      if(userCountry){
        this.selectedCountry = userCountry._id;
        console.log('✅ User country found and selected:', userCountry);
      } else {
        console.log('⚠️ User country not found in available countries list');
      }
    } else {
      console.log('⏳ Waiting for countries or user data to load...');
    }
  }
  getLanguages(){
    this.api.read('languages').subscribe(res=>{

      this.availableLanguages= res['body'];

      const currentUser = this.authService.getCurrentUser();
      if(currentUser){
        // Intentar obtener el idioma preferido del usuario
        if(this.userSession && this.userSession.lead_preferred_language && this.userSession.lead_preferred_language != ''){
          this.selectedLanguage = this.userSession.lead_preferred_language;
        }else{
          Device.getLanguageCode().then(lang=>{
            this.selectedLanguage = lang.value;
          });
        }
      }else{
        Device.getLanguageCode().then(lang=>{
          this.selectedLanguage = lang.value;
        });
      }
    })
  }

  updateUserInfo(){
    this.loadingButtons = true;

    this.api.update('leads/'+this.userSession._id, {
      lead_name: this.userName,
      lead_email: this.userEmail,
      lead_country: this.selectedCountry,
      lead_phone: this.userPhone
    }).subscribe(res=>{
      this.loadingButtons = false;
      this.userSession.lead_name = this.userName;
      this.userSession.lead_email = this.userEmail;
      this.userSession.lead_country = this.selectedCountry;
      this.userSession.lead_phone = this.userPhone;
      
      // Actualizar los datos del usuario en el nuevo sistema de autenticación
      this.authService.updateCurrentUser({
        id: this.userSession._id,
        email: this.userEmail,
        name: this.userName,
        role: this.userSession.lead_role
      });
    })
  }
  closeSession(){
    this.authService.logout();
  }
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }
  deleteAccount(){
    this.showAlertDeleteAccount = true;
  }
  confirmDeleteAccount(){
    this.loadingDelete=true;
    this.api.create('leads/deleteAccount',{id:this.userSession._id}).subscribe(res=>{
       if(!res['error']){
        this.authService.logout();
        this.showAlertAccountDeleted = true;
       }else{
        this.showAlertError = true;
       }
    })
  }
  dissmisAccountDeletion(){
    this.showAlertAccountDeleted = false;
    this.router.navigate(['/auth/login']);
  }
}
