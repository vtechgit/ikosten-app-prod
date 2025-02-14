import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from '../../services/api.service';
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
  transactionsHistory:any;
  showModalAllTransacions:boolean=false;
  isTransactionsLoading:boolean=false;



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

    if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != ''){

      this.userSession = JSON.parse(localStorage.getItem('userSession'));
      
      if(this.userSession.lead_role > 0){

        this.getActiveMembership();

      }
    }

    this.userName = this.userSession.lead_name;
    this.userEmail = this.userSession.lead_email;
    this.userPhone = this.userSession.lead_phone;
    this.getAvailableCountries();
    this.getLanguages();
    this.getTransactions();
  }
  openModalTransactions(){
    this.showModalAllTransacions = true;
    this.isTransactionsLoading=true;

    this.api.read('transactions/lead/'+this.userSession._id).subscribe(res=>{
      this.isTransactionsLoading=false;
      this.transactionsHistory = res['body'];
    })
  }
  getActiveMembership(){
    this.api.read('purchasedMemberships/lead/'+this.userSession._id).subscribe(res=>{
      console.log('membership',res);
      if(res['body'].length >0){
        this.activeMebership = res['body'][0];
      }
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
      this.selectedCountry = this.userSession.lead_country;

    })
  }
  getLanguages(){
    this.api.read('languages').subscribe(res=>{

      this.availableLanguages= res['body'];

      if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' && localStorage.getItem('userSession') != null){
        let userSession = JSON.parse(localStorage.getItem('userSession'));
  
        if(userSession.lead_preferred_language && userSession.lead_preferred_language != ''){
          this.selectedLanguage = userSession.lead_preferred_language;
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
      localStorage.setItem('userSession',JSON.stringify(this.userSession));


    })
  }
  closeSession(){
    localStorage.removeItem('userSession');
    sessionStorage.clear();
    window.location.href = '/';

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
        localStorage.clear();
        this.showAlertAccountDeleted = true;
       }else{
        this.showAlertError = true;
       }


    })
  }
  dissmisAccountDeletion(){
    this.showAlertAccountDeleted = false;
    window.location.href = '/';

  }
}
