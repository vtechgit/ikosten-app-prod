import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from '../../services/api.service';
import {TranslateService} from "@ngx-translate/core";
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-language',
  templateUrl: './language.page.html',
  styleUrls: ['./language.page.scss'],
  standalone:false
})
export class LanguagePage implements OnInit {

  selectedLanguage:string;
  availableLanguages:any=[];
  userSession:any;


  constructor(private router:Router, private api:ApiService, 
    private translate: TranslateService,
    public platform: Platform) { }

  ngOnInit() {
    this.userSession = JSON.parse(localStorage.getItem('userSession'));
    this.getLanguages();
  }

  changeLanguage(){
    this.translate.use(this.selectedLanguage);
    localStorage.setItem('lang',this.selectedLanguage);

    this.availableLanguages.forEach(lang => {
      if(lang.code == this.selectedLanguage){
        localStorage.setItem('langIntl', lang.intl);
      }
    });


  }
  getLanguages(){
    this.api.read('languages').subscribe(res=>{

      this.availableLanguages= res['body'];
      console.log(this.availableLanguages);
      
      if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
        let lang=localStorage.getItem('lang');
        this.selectedLanguage = lang;

      }else{
        Device.getLanguageCode().then(lang=>{
          this.selectedLanguage = lang.value;

        });
      }
    })
  }

}
