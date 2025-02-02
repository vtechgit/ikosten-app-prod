import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from '../../services/api.service';
import {TranslateService} from "@ngx-translate/core";
import { Device } from '@capacitor/device';

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


  constructor(private router:Router, private api:ApiService, private translate: TranslateService) { }

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
  }
  getActiveMembership(){
    this.api.read('membership/role/'+this.userSession.lead_role).subscribe(res=>{
      console.log('membership',res);
      if(res['body'].length >0){
        this.activeMebership = res['body'][0];
      }
    })
  }
  openMemberships(){
    this.router.navigate(['/customer/memberships']);
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
}
