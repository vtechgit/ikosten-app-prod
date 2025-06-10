import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {ApiService} from '../../services/api.service';
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sig-in',
  templateUrl: './sig-in.component.html',
  styleUrls: ['./sig-in.component.scss'],
  standalone:false
})
export class SigInComponent  implements OnInit {

  @Input() isModalOpen: boolean;
  @Input() mainTitle: string;
  @Input() backParams: any;
  @Output() onClosed = new EventEmitter<string>();

  loginForm:FormGroup;

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
  utm_lead:string;

  showAlertNotFound:boolean=false;
  showAlertInvalidCreeds:boolean=false;

  constructor(private api:ApiService, private activatedRoute: ActivatedRoute, public platform: Platform) { }

  ngOnInit() {

    this.loginForm = new FormGroup({
      loginEmail:new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      loginPass:new FormControl('', [
        Validators.required,
      ]),

    });
    this.utm_lead = localStorage.getItem('utm_lead');
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
      console.log('result',result)
      if(result.user){
        console.log('user',result.user)

        let user = result.user;

        //create lead and load profile data
        let country = this.selectedCountry._id;

        var obj = {};
        if(this.utm_lead && this.utm_lead != ''){
          obj ={
            lead_type: 'google',
            lead_email: user.email,
            lead_token: user.uid,
            lead_name: user.displayName,
            lead_phone: user.phoneNumber,
            lead_country: country,
            lead_role:0,
            lead_id: this.utm_lead,
            lead_invitation_status: 'active',
            lead_source: localStorage.getItem('clientSource')
          }
        }else{
          obj ={
            lead_type: 'google',
            lead_email: user.email,
            lead_token: user.uid,
            lead_name: user.displayName,
            lead_phone: user.phoneNumber,
            lead_country: country,
            lead_role:0,
            lead_source: localStorage.getItem('clientSource')
          }
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
                this.isLoginGoogle=false;
                this.isLoading=false;

                if(this.backParams){
                  if(this.backParams.back && this.backParams.back != ''){

                    if(this.backParams.membership && this.backParams.membership != ''){

                      window.location.href = '/customer/'+this.backParams.back+'/?membership='+this.backParams.membership;

                    }else if(this.backParams.trip && this.backParams.trip != ''){

                      if(this.backParams.step && this.backParams.step){
                        window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip+'&step='+this.backParams.step;
                      }else{
                        window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip;
                      }

                      

                    }else{
                      window.location.href = '/customer/'+this.backParams.back;

                    }
                  }else{

                    window.location.href = '/';

                  }

                }else{

                  window.location.href = '/';

                }

              });

            }else{
              this.isLoginGoogle=false;
              this.isLoading=false;
              if(this.backParams){

                if(this.backParams.back && this.backParams.back != ''){

                  if(this.backParams.membership && this.backParams.membership != ''){

                    window.location.href = '/customer/'+this.backParams.back+'/?membership='+this.backParams.membership;

                  }else if(this.backParams.trip && this.backParams.trip != ''){

                    if(this.backParams.step && this.backParams.step){
                      window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip+'&step='+this.backParams.step;
                    }else{
                      window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip;
                    }

                    

                  }else{
                    window.location.href = '/customer/'+this.backParams.back;

                  }
                }else{
                  window.location.href = '/';

                }

              }else{
                window.location.href = '/';

              }
            }
          }
        })

      }
  }
  async doLoginApple(){
    this.isLoading=true;

    FirebaseAuthentication.signInWithApple().then(res=>{
      let user = res['user'];
      console.log('user',user);
      if(user){
        let full_name = user['displayName'];
        let email = user.email && user.email != 'null' ? user.email : '';
        let token = user.uid;

        let country = this.selectedCountry._id;
        var obj = {};
        if(this.utm_lead && this.utm_lead != ''){
          obj ={
            lead_type: 'apple',
            lead_email: email,
            lead_token: token,
            lead_name: full_name,
            lead_phone: user.phoneNumber,
            lead_role:0,
            lead_country: country,
            lead_id: this.utm_lead,
            lead_invitation_status: 'active',
            lead_source: localStorage.getItem('clientSource')
          }
        }else{
          obj ={
            lead_type: 'apple',
            lead_email: email,
            lead_token: token,
            lead_name: full_name,
            lead_phone: user.phoneNumber,
            lead_role:0,
            lead_country: country,
            lead_source: localStorage.getItem('clientSource')
          }
        }

        this.api.create('leads/auth', obj).subscribe(res=>{
          console.log('auth response',res);
  
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
                if(this.backParams){

                  if(this.backParams.back && this.backParams.back != ''){
  
                    if(this.backParams.membership && this.backParams.membership != ''){
  
                      window.location.href = '/customer/'+this.backParams.back+'/?membership='+this.backParams.membership;
  
                    }else if(this.backParams.trip && this.backParams.trip != ''){
  
                      if(this.backParams.step && this.backParams.step){
                        window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip+'&step='+this.backParams.step;
                      }else{
                        window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip;
                      }
  
                      
  
                    }else{
                      window.location.href = '/customer/'+this.backParams.back;
  
                    }
                  }else{
                    window.location.href = '/';
                  }
  
                }else{
                  window.location.href = '/';
  
                }
  
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
  async doLoginEmail(){
    this.isLoading=true;
    this.loginForm.markAllAsTouched();

      if (this.loginForm.valid){
          var obj ={
            lead_type: 'email',
            lead_email: this.email.value.toLowerCase(),
            lead_password: this.password.value,
          }
        this.api.create('leads/auth', obj).subscribe(res=>{
          console.log('auth response',res);
  
          if(res['body']['status']==true){

            let sessionObj = {
                _id:res['body']['data'][0]['_id'],
                lead_name:res['body']['data'][0]['lead_name'],
                lead_email:res['body']['data'][0]['lead_email'],
                lead_phone:res['body']['data'][0]['lead_phone'],
                lead_country:res['body']['data'][0]['lead_country'],
                lead_role:res['body']['data'][0]['lead_role'],
                lead_paypal_customer_id:res['body']['data'][0]['lead_paypal_customer_id'],
                lead_company_id:res['body']['data'][0]['lead_company_id'],
                lead_invitation_status:res['body']['data'][0]['lead_invitation_status'],
            }
  
            localStorage.setItem('userSession', JSON.stringify(sessionObj));
            this.isLoginApple=false;
            this.isLoading=false;
            window.location.href = '/customer/trips';

          }else if(res['body']['code'] == 'NOTFOUND'){

            this.showAlertNotFound=true;
            this.isLoading=false;

          }else if(res['body']['code'] == 'INVALID'){

            this.showAlertInvalidCreeds=true;
            this.isLoading=false;

          }else{
            this.showAppleAlertLogin=true;
            this.isLoading=false;
          }
        })
      }
          

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
              var obj = {};
              if(this.utm_lead && this.utm_lead != ''){
                obj ={
                  lead_type: 'phone',
                  lead_email: user.email,
                  lead_token: user.uid,
                  lead_name: user.displayName,
                  lead_phone: this.userPhone,
                  lead_country: country,
                  lead_role:0,
                  lead_id: this.utm_lead,
                  lead_invitation_status: 'active',
                  lead_source: localStorage.getItem('clientSource')
                }
              }else{
                obj ={
                  lead_type: 'phone',
                  lead_email: user.email,
                  lead_token: user.uid,
                  lead_name: user.displayName,
                  lead_phone: this.userPhone,
                  lead_country: country,
                  lead_role:0,
                  lead_source: localStorage.getItem('clientSource')
                }
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

                      if(this.backParams){

                        if(this.backParams.back && this.backParams.back != ''){
        
                          if(this.backParams.membership && this.backParams.membership != ''){
        
                            window.location.href = '/customer/'+this.backParams.back+'/?membership='+this.backParams.membership;
        
                          }else if(this.backParams.trip && this.backParams.trip != ''){
        
                            if(this.backParams.step && this.backParams.step){
                              window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip+'&step='+this.backParams.step;
                            }else{
                              window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip;
                            }
        
                            
        
                          }else{
                            window.location.href = '/customer/'+this.backParams.back;
        
                          }
                        }else{
                          window.location.href = '/';
                        }
        
                      }else{
                        window.location.href = '/';
        
                      }
      
                    });
      
                  }else{

    
                    if(this.backParams){

                      if(this.backParams.back && this.backParams.back != ''){
      
                        if(this.backParams.membership && this.backParams.membership != ''){
      
                          window.location.href = '/customer/'+this.backParams.back+'/?membership='+this.backParams.membership;
      
                        }else if(this.backParams.trip && this.backParams.trip != ''){
      
                          if(this.backParams.step && this.backParams.step){
                            window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip+'&step='+this.backParams.step;
                          }else{
                            window.location.href = '/customer/'+this.backParams.back+'/?trip='+this.backParams.trip;
                          }
      
                          
      
                        }else{
                          window.location.href = '/customer/'+this.backParams.back;
      
                        }
                      }else{
                        window.location.href = '/';
                      }
      
                    }else{
                      window.location.href = '/';
      
                    }
      
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
  get email() {
    return this.loginForm.get('loginEmail');
  }
  get password() {
    return this.loginForm.get('loginPass');
  }
}
