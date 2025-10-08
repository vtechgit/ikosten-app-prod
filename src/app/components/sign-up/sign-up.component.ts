import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
@Component({
  selector: 'app-sign-up',
  standalone:false,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent  implements OnInit {
  @Input() isModalOpen: boolean;
  @Input() mainTitle: string;
  @Input() backParams: any;
  @Output() onClosed = new EventEmitter<string>();

  isLoading:boolean=false;
  alertButtons = ['Ok'];
  showAlertCodeError:boolean=false;
  showAlertAlreadyExist:boolean=false;
  availableCountries = [];
  loading:boolean=false;
  submitted:boolean=false;

  registerForm:FormGroup;
  utm_lead:string;

  constructor(
    private api:ApiService,
    private activatedRoute:ActivatedRoute,
    public translateService:TranslateService,
    private router:Router
  ) { }

  ngOnInit() {

    this.getAvailableCountries();

    this.registerForm = new FormGroup({
      registerName:new FormControl('', [
        Validators.required,
      ]),
      registerEmail:new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      registerCountry:new FormControl('', [
        Validators.required,
      ]),
      registerPhone:new FormControl('', [
        Validators.required,
      ]),
      registerPass:new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),

    });
    this.utm_lead = this.activatedRoute.snapshot.queryParamMap.get('utm_lead');
    if(this.utm_lead && this.utm_lead != ''){
      localStorage.setItem('utm_lead', this.utm_lead);
    }
  }

  getAvailableCountries(){
    this.api.read('availableCountries').subscribe(res=>{
      this.availableCountries= res['body'];
    })
  }
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }

  goBack(){
    this.router.navigate(['/auth/login']);
  }

  onSubmit(){
    this.submitted = true;
    this.registerForm.markAllAsTouched();

      if (this.registerForm.valid){
        this.loading=true;
        var obj = {};
        var country = this.countrySelect.value._id;
        var country_digit= this.countrySelect.value.digit;
        if(this.utm_lead && this.utm_lead != ''){
          obj ={
            lead_type: 'email',
            lead_email: this.email.value,
            lead_name: this.name.value,
            lead_phone: this.phone.value,
            lead_country: country,
            lead_country_digit: country_digit,
            lead_role:0,
            lead_id: this.utm_lead,
            lead_invitation_status: 'active',
            lead_source: localStorage.getItem('clientSource'),
            lead_password: this.password.value
          }
        }else{
          obj ={
            lead_type: 'email',
            lead_email: this.email.value,
            lead_name: this.name.value,
            lead_phone: this.phone.value,
            lead_country: country,
            lead_country_digit: country_digit,
            lead_role:0,
            lead_source: localStorage.getItem('clientSource'),
            lead_password: this.password.value
          }
        }
        
        this.api.create('leads/registerNew',obj).subscribe(res=>{
          if(res['body']['status'] == true){
              let sessionObj = {
                _id:res['body']['data']['_id'],
                lead_name:res['body']['data']['lead_name'],
                lead_email:res['body']['data']['lead_email'],
                lead_phone:res['body']['data']['lead_phone'],
                lead_country:res['body']['data']['lead_country'],
                lead_role:res['body']['data']['lead_role'],
                lead_paypal_customer_id:res['body']['data']['lead_paypal_customer_id'],
                lead_company_id:res['body']['data']['lead_company_id'],
                lead_invitation_status:res['body']['data']['lead_invitation_status'],
              }
              localStorage.setItem('userSession', JSON.stringify(sessionObj));
              this.loading=false;
              window.location.href = '/customer/trips';
          }else if(res['body']['code'] == 'ALREADY_EXIST'){

            this.showAlertAlreadyExist=true;
            this.loading=false;

          }else{
            this.showAlertCodeError=true;
            this.loading=false;
          }
        })
          
      }
  }

  get name() {
    return this.registerForm.get('registerName');
  }
  get email() {
    return this.registerForm.get('registerEmail');
  }
  get countrySelect() {
    return this.registerForm.get('registerCountry');
  }
  get phone() {
    return this.registerForm.get('registerPhone');
  }
  get password() {
    return this.registerForm.get('registerPass');
  }

}
