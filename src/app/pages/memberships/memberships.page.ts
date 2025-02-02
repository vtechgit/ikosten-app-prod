import { Component, OnInit } from '@angular/core';
import {ApiService} from '../../services/api.service';
import {
  IPayPalConfig,
  ICreateOrderRequest, 
  ICreateSubscriptionRequest
} from 'ngx-paypal';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

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
        window.location.href = '/';
        
      },
    },
  ];

  public payPalConfig ? : IPayPalConfig;
  userSession:any;
  languageCode:string;


  cardForm: FormGroup;
  submitted = false;

  constructor(
    public api:ApiService,
    private router:Router,
    private fb: FormBuilder
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
  openCheckout(membership){
    this.membershipSelected = membership;

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

            this.api.create('transactions',{
              transaction_order: data.orderID,
              transaction_subscription_id: data.subscriptionID,
              transaction_status: 'approved',
              transaction_lead_id: this.userSession._id,
              transaction_payer_id: details.subscriber.payer_id,
              transaction_value: membership.membership_price,
              transaction_membership_plan_id: membership._id,
              transaction_plan_id: details.plan_id,
              transaction_error: ''
            }).subscribe(transaction_response=>{
              this.api.update('leads/'+this.userSession._id,{lead_role:membership.membership_role}).subscribe(res=>{
                console.log('lead updated',res);
                this.userSession.lead_role = membership.membership_role;
                localStorage.setItem('userSession', JSON.stringify(this.userSession));
                this.showAlertSuccess =true;

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
          this.showAlertError=true;
          //this.showError = true;
      },
      onClick: (data, actions) => {
          console.log('onClick', data, actions);
          //this.resetStatus();
      }
    };
    

    this.showPaymentcheckout = true;

  }
  onDissmissAlertSuccess(){
   // this.router.navigate(['/customer/trips']);
   window.location.href = '/';
  }

}
