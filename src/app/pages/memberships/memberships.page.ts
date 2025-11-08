import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {ApiService} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  IPayPalConfig,
  ICreateOrderRequest, 
  ICreateSubscriptionRequest
} from 'ngx-paypal';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-memberships',
  templateUrl: './memberships.page.html',
  styleUrls: ['./memberships.page.scss'],
  standalone: false
})
export class MembershipsPage implements OnInit {

  showAlertPayment:boolean=false;
  memberships:any;
  membershipSelected:any;
  showPaymentcheckout:boolean = false;
  showAlertError:boolean = false;
  showAlertSuccess:boolean=false;
  paymentMethodSelected:string = 'new-card';

  public errorButtons = [
    {
      text: 'buttons.accept',
      role: 'cancel',
      handler: () => {
        
      },
    },
  ];

  public successButtons = [
    {
      text: 'buttons.accept',
      role: 'cancel',
      handler: () => {
        this.router.navigate(['/customer/trips']);
        
      },
    },
  ];

  public payPalConfig ? : IPayPalConfig;
  userSession:any;
  languageCode:string;


  cardForm: FormGroup;
  submitted = false;
  selectedLanguage:string;
  availableLanguages:any=[];
  constructor(
    public api:ApiService,
    private authService: AuthService,
    private router:Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private translate: TranslateService
    
  ) { }

  ngOnInit() {
    if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != ''){

      this.userSession = JSON.parse(localStorage.getItem('userSession'));
    }

    this.cardForm = this.fb.group({
      number: ["", [Validators.required, Validators.pattern("^[0-9]{16}$")]],
      name: ["", [Validators.required, Validators.pattern("^[a-zA-Z]+$")]],
      month: [
        "",
        [Validators.required, Validators.pattern("^(0[1-9]|1[0-2])$")]
      ],
      year: ["", [Validators.required, this.validYear()]],
      cvv: ["", [Validators.required, Validators.pattern("^[0-9]{3}$")]]
    });
    this.getMemberships();
  }

  ionViewWillEnter(){
    this.getLanguages();
    if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != ''){

      this.userSession = JSON.parse(localStorage.getItem('userSession'));
    }
  }
  translateWords(){
    this.translate.get(_('buttons.accept')).subscribe((text: string) => {
      this.errorButtons[0].text=text;
      this.successButtons[0].text=text;
      
    });
  }
  getLanguages(){
    this.api.read('languages').subscribe(res=>{

      this.availableLanguages= res['body'];

      if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' && localStorage.getItem('userSession') != null){
        let userSession = JSON.parse(localStorage.getItem('userSession'));
  
        if(userSession.lead_preferred_language && userSession.lead_preferred_language != ''){
          this.selectedLanguage = userSession.lead_preferred_language;
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
    })
  }
  validYear() {
    return (control): { [key: string]: any } | null => {
      let now = new Date().getFullYear();
      let diff = Number(control.value) - now;
      const valid = diff >= 0 && diff <= 3;
      return !valid ? { validYear: { value: control.value } } : null;
    };
  }
  onSubmit(){
    this.submitted = true;
    if (this.cardForm.valid) {
      let paymentObject = {
        payment_source: {
          card: {
              number: "{{card_number}}",
              expiry: "2027-02",
              name: "John Doe",
              billing_address: {
                  address_line_1: "2211 N First Street",
                  address_line_2: "17.3.160",
                  admin_area_1: "CA",
                  admin_area_2: "San Jose",
                  postal_code: "95131",
                  country_code: "US"
              }
          }
        }
      }
      this.api.create('billing/store_card', paymentObject).subscribe(res=>{
        console.log('cardToken', res)
      })

    }
  }
  get cardFormControl() {
    return this.cardForm.controls;
  }
  get cardNumber() {
    return this.formatCardNumber(this.cardForm.controls["number"].value);
  }

  get cardExpiryMonth() {
    return this.formatExpiryDate(this.cardForm.controls["month"].value);
  }

  get cardExpiryYear() {
    return this.formatExpiryDate(this.cardForm.controls["year"].value);
  }

  get cardHolderName() {
    return this.cardForm.controls["name"].value || "Card Holder Name";
  }

  getMemberships(){
    this.api.read('memberships').subscribe(res=>{
      if(res['body'].length > 0){

        this.memberships = res['body'];
        var membershipParam = this.activatedRoute.snapshot.queryParamMap.get('membership')
        if( membershipParam && membershipParam != ''){

          this.memberships.forEach(element => {
            if(element._id == membershipParam){
              this.openCheckout(element);
            }
          });

        }

      }
    })

  }
  formatCardNumber(cardNumber: number){
    const format = "#### - #### - #### - ####";
    if (!cardNumber) {
      return format;
    } else {
      return cardNumber
        .toString()
        .replace(/\s+/g, "")
        .replace(/[^0-9]/gi, "")
        .padEnd(16, "#")
        .match(/.{1,4}/g)
        .join(" - ");
    }
  };
  
  formatExpiryDate(str: number){
    const format = "##";
    if (!str) {
      return format;
    } else {
      return str.toString().replace(/\s+/g, "").padEnd(2, "#");
    }
  };
  
  changePaymentMethod(event){

  }
  closeModalCheckout(){
    if(this.showAlertSuccess == true){
      this.router.navigate(['/customer/trips']);
    }
    this.showPaymentcheckout = false;
  }
  openCheckout(membership){
    
    this.membershipSelected = membership;

    if(!this.userSession){
      this.router.navigate(['/customer/login'],{queryParams:{back:'memberships', membership:this.membershipSelected._id}});
    }else{
      this.showPaymentcheckout = true;

      this.payPalConfig = {
        currency: 'USD',
        clientId: 'ASDX2c3inPc0fEtqcE4TIY_Kj6cXg3caX0pu5PuWJwcIacT0JhqXQO14LM5D0LNTkCrjqot2UGjmrCBa',      
        createSubscriptionOnClient: (data) => < ICreateSubscriptionRequest > {
          plan_id: this.membershipSelected.membership_sub_id,
        },
        advanced: {
            commit: 'true'
  
        },
        style: {
            label: 'paypal',
            layout: 'vertical'
        },
        vault:"true",
        intent:"subscription",
        onApprove: (data, actions) => {
  
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.subscription.get().then(details => {
              console.log('onApprove - you can get full order details inside onApprove: ', details);

              // Detectar si es trial: si el membership tiene trial_days > 0, el valor inicial es 0
              const isTrialSubscription = membership.membership_trial_days && membership.membership_trial_days > 0;
              const initialValue = isTrialSubscription ? '0' : membership.membership_price;
              
              console.log('📋 Creando purchased membership:', {
                membershipId: membership._id,
                hasTrial: isTrialSubscription,
                trialDays: membership.membership_trial_days,
                initialValue: initialValue,
                regularPrice: membership.membership_price,
                fullMembershipObject: membership
              });

              this.api.create('purchasedMemberships/new',{
                order_id: data.orderID,
                subscription_id: data.subscriptionID,
                lead_id: this.userSession._id,
                payer_id: details.subscriber.payer_id,
                value: initialValue, // 0 si hay trial, precio regular si no hay trial
                membership_plan_id: membership._id,
                plan_id: details.plan_id,
                error: '',
                currency:membership.membership_currency,
                description:membership.membership_title,
                prod_id: membership.membership_prod_id,
                membership_status: (details.status || 'ACTIVE').toUpperCase(),
                recurring:membership.membership_recurring,
                source:'paypal'
  
              }).subscribe(purchasedMembershipsResponse=>{
                console.log(purchasedMembershipsResponse);

                this.api.update('leads/'+this.userSession._id,{lead_role:membership.membership_role, lead_paypal_customer_id:details.subscriber.payer_id}).subscribe(res=>{
                  console.log('lead',res);
                  this.userSession.lead_role = membership.membership_role;
                  this.userSession.lead_paypal_customer_id = details.subscriber.payer_id;
                  
                  // Actualizar el usuario en el AuthService para mantener la sesión sincronizada
                  this.api.read('leads/'+this.userSession._id).subscribe(updatedUserResponse => {
                    if(updatedUserResponse['body']) {
                      const updatedUserData = updatedUserResponse['body'];
                      
                      // ✅ Mapear lead_onboarding_completed a onboarding_completed para consistencia
                      // El servidor devuelve lead_onboarding_completed, pero el AuthService usa onboarding_completed
                      if (updatedUserData.hasOwnProperty('lead_onboarding_completed')) {
                        updatedUserData.onboarding_completed = updatedUserData.lead_onboarding_completed;
                      } else if (!updatedUserData.hasOwnProperty('onboarding_completed')) {
                        // Si no existe ninguno de los dos campos, asumir que está completado (usuario existente)
                        updatedUserData.onboarding_completed = true;
                        updatedUserData.lead_onboarding_completed = true;
                      }
                      
                      localStorage.setItem('userSession', JSON.stringify(updatedUserData));
                      this.userSession = updatedUserData;
                      
                      // Actualizar AuthService con la estructura correcta de User
                      const user: any = {
                        id: updatedUserData._id || updatedUserData.id,
                        email: updatedUserData.lead_email || updatedUserData.email,
                        name: updatedUserData.lead_name || updatedUserData.name,
                        role: updatedUserData.lead_role || updatedUserData.role,
                        company_id: updatedUserData.lead_company_id || updatedUserData.company_id,
                        category: updatedUserData.lead_category || updatedUserData.category,
                        onboarding_completed: updatedUserData.lead_onboarding_completed !== false
                      };
                      
                      this.authService.updateCurrentUser(user);
                      console.log('🔄 AuthService actualizado con el nuevo rol del usuario:', user);
                    }
                    this.showAlertSuccess = true;
                    this.cd.detectChanges();
                    console.log('showPaymentcheckout',this.showPaymentcheckout);
                  }, error => {
                    // Si falla la actualización, usar los datos locales
                    // ✅ Mapear lead_onboarding_completed si existe
                    if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
                      this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
                    } else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
                      // Si no existe ninguno, asumir completado (usuario existente)
                      this.userSession.onboarding_completed = true;
                      this.userSession.lead_onboarding_completed = true;
                    }
                    
                    localStorage.setItem('userSession', JSON.stringify(this.userSession));
                    
                    // Actualizar AuthService incluso si falla el read
                    const user: any = {
                      id: this.userSession._id || this.userSession.id,
                      email: this.userSession.lead_email || this.userSession.email,
                      name: this.userSession.lead_name || this.userSession.name,
                      role: membership.membership_role,
                      company_id: this.userSession.lead_company_id || this.userSession.company_id,
                      category: this.userSession.lead_category || this.userSession.category,
                      onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
                    };
                    
                    this.authService.updateCurrentUser(user);
                    console.log('🔄 AuthService actualizado (fallback):', user);
                    
                    this.showAlertSuccess = true;
                    this.cd.detectChanges();
                  });


                })
              })
                
              
  
            });
  
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);
            //this.showCancel = true;
  
        },
        onError: err => {
            console.log('OnError', err);
            this.api.create('transactions',{
              transaction_order: '',
              transaction_subscription_id: '',
              transaction_status: 'rejected',
              transaction_lead_id: this.userSession._id,
              transaction_payer_id: '',
              transaction_value: membership.membership_price,
              transaction_membership_plan_id: membership._id,
              transaction_plan_id: '',
              transaction_error: '',
              transaction_currency:membership.membership_currency,
              transaction_description:membership.membership_title,
  
            }).subscribe(transaction_response=>{
              this.showAlertError=true;
  
            })
            //this.showError = true;
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);
            //this.resetStatus();
        }
      };
      
  
    }


  }
  onDissmissAlertSuccess(){
   this.router.navigate(['/customer/trips']);
  }

}