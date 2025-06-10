import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/services/api.service';
import { Device } from '@capacitor/device';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restore-password',
  standalone:false,
  templateUrl: './restore-password.component.html',
  styleUrls: ['./restore-password.component.scss'],
})
export class RestorePasswordComponent  implements OnInit {
  isLoading:boolean=false;
  restoreForm:FormGroup;
  selectedLanguage:string;
  alertButtons = ['Ok'];
  showAlertSubmit:boolean=false;
  constructor(
       public platform: Platform,
       private api: ApiService,
       private translate: TranslateService,
       private router:Router
  ) { }

  ngOnInit() {
    this.getLanguages();
    this.restoreForm = new FormGroup({
      restoreEmail:new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
    });
  }
  
  getLanguages(){


    if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' && localStorage.getItem('userSession') != null){
      let userSession = JSON.parse(localStorage.getItem('userSession'));
      if(userSession.lead_preferred_language && userSession.lead_preferred_language != ''){
        this.selectedLanguage = userSession.lead_preferred_language;
        this.translate.use(this.selectedLanguage);  

      }else{
        if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
          this.selectedLanguage = localStorage.getItem('lang');
          this.translate.use(this.selectedLanguage);  
        }else{
          Device.getLanguageCode().then(lang=>{
            this.selectedLanguage = lang.value;
            this.translate.use(this.selectedLanguage);  

          });
        }

      }
    }else{

      if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
        this.selectedLanguage = localStorage.getItem('lang');
        this.translate.use(this.selectedLanguage);  
      }else{
        Device.getLanguageCode().then(lang=>{
          this.selectedLanguage = lang.value;
          this.translate.use(this.selectedLanguage);  

        });
      }
    }
  }

  restorePass(){
    this.isLoading=true;
    this.restoreForm.markAllAsTouched();
      if (this.restoreForm.valid){
           var obj ={
            lead_email: this.email.value.toLowerCase(),
            lang:this.selectedLanguage
          }
          this.api.create('leads/restore-password', obj).subscribe(res=>{
              this.isLoading=false;
              this.email.patchValue('');
              this.restoreForm.markAsUntouched();
              this.showAlertSubmit=true;
          })
      }
  }
  backToLogin(){
    this.showAlertSubmit=false;
    this.router.navigate(['/auth/login']);

  }
  get email() {
    return this.restoreForm.get('restoreEmail');
  }
}
