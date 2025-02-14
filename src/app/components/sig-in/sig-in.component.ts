import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {ApiService} from '../../services/api.service';
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { ActivatedRoute } from '@angular/router';

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
  
  constructor(private api:ApiService, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    const auth = getAuth();
    this.recaptchaVerifier= new RecaptchaVerifier(auth, 'captcha-container', {
      'expired-callback': async () => {
        console.log('expired callback');

        await FirebaseAuthentication.removeAllListeners();
        this.isLoading=false;
        this.isValidatingCode = false;
        
      },
      'callback': (response: any) => {
        console.log('callback ==>',response);
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
          lead_country: country,
          lead_role:0
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

  startLoginGoogle(){
    this.isLoginGoogle=true;
  }
  async doLoginPhone(){
    this.isLoading = true;
      //return new Promise(async resolve => {
        // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
        await FirebaseAuthentication.addListener('phoneCodeSent', async event => {

          this.isValidatingCode = true;
          this.verificationId = event.verificationId;

        }).catch(err=>{
          console.log(err);
        });
        // Attach `phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically
        
        await FirebaseAuthentication.addListener(
          'phoneVerificationCompleted',
          async event => {


            //resolve(event['result']['user']);
          },
        ).catch(err=>{
          console.log(err);
        });;
        
        this.phoneToSend = this.selectedCountry['digit']+this.userPhone;
        await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber: this.phoneToSend,
          recaptchaVerifier: this.recaptchaVerifier
        }).then(res=>{
          console.log('response',res);
        }).catch(err=>{
          console.log('error',err)
        })
        // Start sign in with phone number and send the SMS

      //});

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
                lead_country: country,
                lead_role:0
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
}
