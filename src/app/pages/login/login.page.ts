import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {ApiService} from '../../services/api.service';
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage implements OnInit {

  @Input() isModalOpen: boolean;
  @Output() onClosed = new EventEmitter<string>();

  userPhone:string;
  selectedCountry:any;
  recaptchaVerifier;
  isLoading:boolean=false;
  isValidatingCode:boolean=false;
  verificationId:string;
  verificationCode:string;
  phoneToSend:string;
  isLoadingCode:boolean=false;

  availableCountries = [];

  alertButtons = ['Ok'];
  showAlertCodeError:boolean=false;
  isLoginGoogle:boolean=false;
  isLoginApple:boolean=false;

  showAppleAlertLogin:boolean=false;
  showAppleAlertAccount:boolean=false;

  
  constructor(private api:ApiService, public platform: Platform) { }

  ngOnInit() {
    const auth = getAuth();
    this.recaptchaVerifier= new RecaptchaVerifier(auth, 'captcha-container', {
      'expired-callback': async () => {
        await FirebaseAuthentication.removeAllListeners();
        this.isLoading=false;
        this.isValidatingCode = false;
        
      } 
    });
    this.getAvailableCountries();
  }
  getAvailableCountries(){
    this.api.read('availableCountries').subscribe(res=>{
      this.availableCountries= res['body'];
    })
  }

  closeModal(){
    this.isModalOpen = false;
    this.onClosed.emit();
  }

  async doLoginGoogle(){

      const result = await FirebaseAuthentication.signInWithGoogle();
      this.isLoading=true;
      if(result.user){
        let user = result.user;

        //create lead and load profile data
        let country = this.selectedCountry._id;

        let obj ={
          lead_type: 'google',
          lead_email: user.email,
          lead_token: user.uid,
          lead_name: user.displayName,
          lead_phone: user.phoneNumber,
          lead_country: country
        }
        this.api.create('leads/auth', obj).subscribe(res=>{
          console.log(res);

          if(res['body']['data'].length > 0){

            localStorage.setItem('userSession', JSON.stringify(res['body']['data'][0]));
            var leadId = res['body']['data'][0]['_id'];

            if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){

              var travels = JSON.parse(sessionStorage.getItem('travels'));

              travels.forEach((travel,index) => {
                
                travels[index]['process_lead'] = leadId;

              });
              this.api.update('processes/update/bulk',travels).subscribe(res=>{
                sessionStorage.removeItem('travels');
                this.isLoginGoogle=false;
                this.isLoading=false;
                window.location.href = '/';

              });

            }else{
              this.isLoginGoogle=false;
              this.isLoading=false;
              window.location.href = '/';

            }
          }
        })

      }
  }
  async doLoginApple(){
    this.isLoading=true;

    FirebaseAuthentication.signInWithApple().then(res=>{
      let user = res['user'];
      
      if(user){
        let full_name = user['displayName'];
        let email = user.email && user.email != 'null' ? user.email : '';
        let token = user.uid;

        let country = this.selectedCountry._id;

        let obj ={
          lead_type: 'apple',
          lead_email: email,
          lead_token: token,
          lead_name: full_name,
          lead_phone: user.phoneNumber,
          lead_country: country
        }
        this.api.create('leads/auth', obj).subscribe(res=>{
          console.log(res);
  
          if(res['body']['data'].length > 0){
  
            localStorage.setItem('userSession', JSON.stringify(res['body']['data'][0]));
            var leadId = res['body']['data'][0]['_id'];
  
            if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){
  
              var travels = JSON.parse(sessionStorage.getItem('travels'));
  
              travels.forEach((travel,index) => {
                
                travels[index]['process_lead'] = leadId;
  
              });
              this.api.update('processes/update/bulk',travels).subscribe(res=>{
                sessionStorage.removeItem('travels');
                this.isLoginApple=false;
                this.isLoading=false;
                window.location.href = '/';
  
              });
  
            }else{
              this.isLoginApple=false;
              this.isLoading=false;
              window.location.href = '/';
  
            }
          }
        })
  
      }else{
        window.localStorage.clear();
        console.log('response', res);
        //this.alert.presentAlert('Ha ocurrido un error','Apple no devolvió un usuario','','error');
        this.showAppleAlertLogin = true;

      }
    }).catch((error) => {
      console.log('catch', error['message']);
      if( !error['message'].includes('error 1000') && !error['errorMessage'].includes('error 1001.')){
        this.showAppleAlertLogin = true;
        //this.alert.presentAlert('Ha ocurrido un error',error['message'],'','error');

      }


    });

  }

  startLoginGoogle(){
    this.isLoginGoogle=true;
  }
  startLoginApple(){
    this.isLoginApple=true;
  }
  async doLoginPhone(){
    this.isLoading = true;
      return new Promise(async resolve => {
        // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
        await FirebaseAuthentication.addListener('phoneCodeSent', async event => {

          this.isValidatingCode = true;
          this.verificationId = event.verificationId;

        });
        // Attach `phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically
        
        await FirebaseAuthentication.addListener(
          'phoneVerificationCompleted',
          async event => {


            resolve(event['result']['user']);
          },
        );
        
        this.phoneToSend = this.selectedCountry['digit']+this.userPhone;
        await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber: this.phoneToSend,
          recaptchaVerifier: this.recaptchaVerifier
        });
        // Start sign in with phone number and send the SMS

      });

  }

  async validateCode(){
          this.isLoadingCode =true;
          FirebaseAuthentication.confirmVerificationCode({
            verificationId: this.verificationId,
            verificationCode: this.verificationCode,
          }).then(result=>{
            this.isLoadingCode =false;
            console.log(result);
            if(result['user']){
              let user = result['user'];
  
              this.isLoading = false;
              this.isLoadingCode = false;
              this.isValidatingCode = false;
              this.verificationCode = undefined;
              this.phoneToSend = undefined;
  
              let country = this.selectedCountry._id;
  
              let obj ={
                lead_type: 'phone',
                lead_email: user.email,
                lead_token: user.uid,
                lead_name: user.displayName,
                lead_phone: this.userPhone,
                lead_country: country
              }
              this.api.create('leads/auth', obj).subscribe(res=>{
  
                if(res['body']['data'].length > 0){
  
                  localStorage.setItem('userSession', JSON.stringify(res['body']['data'][0]));
                  var leadId = res['body']['data'][0]['_id'];

                  if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){
      
                    var travels = JSON.parse(sessionStorage.getItem('travels'));
      
                    travels.forEach((travel,index) => {
                      
                      travels[index]['process_lead'] = leadId;
      
                    });
                    this.api.update('processes/update/bulk',travels).subscribe(res=>{
                      sessionStorage.removeItem('travels');

                      window.location.href = '/';
      
                    });
      
                  }else{
                    window.location.href = '/';
      
                  }
                  
                }
              })
            }
          }).catch(async err=>{
            this.showAlertCodeError=true;

            
            await FirebaseAuthentication.removeAllListeners();
            this.isLoadingCode = false;

            this.isLoading=false;
            this.isValidatingCode = false;
            this.verificationCode = undefined;
            
          });

  }
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }

}
