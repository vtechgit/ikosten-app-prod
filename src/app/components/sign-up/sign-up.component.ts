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
        
        this.api.create('leads/registerNew',obj).subscribe({
          next: (res) => {
            console.log('✅ Respuesta de registro:', res);
            
            if(res['body']['status'] == true){
                // Estructura de respuesta actualizada con tokens
                const responseData = res['body']['data'];
                
                // Guardar tokens
                if(responseData.tokens) {
                  localStorage.setItem('ikosten_access_token', responseData.tokens.accessToken);
                  localStorage.setItem('ikosten_refresh_token', responseData.tokens.refreshToken);
                }
                
                // Formato User correcto para AuthService
                const userData = {
                  id: responseData.user?.id || responseData._id,
                  email: responseData.user?.email || responseData.lead_email,
                  name: responseData.user?.name || responseData.lead_name,
                  role: responseData.user?.role !== undefined ? responseData.user.role : (responseData.lead_role || 0),
                  company_id: responseData.user?.company_id || responseData.lead_company_id,
                  category: responseData.user?.category || responseData.lead_category || null,
                  onboarding_completed: responseData.user?.onboarding_completed || responseData.lead_onboarding_completed || false
                };
                
                // Guardar en formato User (ikosten_user_data) para AuthService
                localStorage.setItem('ikosten_user_data', JSON.stringify(userData));
                console.log('✅ Datos de usuario guardados:', userData);
                
                // También guardar en formato legacy (userSession) para compatibilidad
                let sessionObj = {
                  _id: userData.id,
                  lead_name: userData.name,
                  lead_email: userData.email,
                  lead_phone: responseData.user?.phone || responseData.lead_phone,
                  lead_country: responseData.user?.country || responseData.lead_country,
                  lead_role: userData.role,
                  lead_paypal_customer_id: responseData.user?.paypal_customer_id || responseData.lead_paypal_customer_id,
                  lead_company_id: userData.company_id,
                  lead_invitation_status: responseData.user?.invitation_status || responseData.lead_invitation_status,
                  lead_category: userData.category,
                  lead_onboarding_completed: userData.onboarding_completed
                }
                localStorage.setItem('userSession', JSON.stringify(sessionObj));
                
                this.loading=false;
                
                console.log('✅ Sesión guardada, redirigiendo a onboarding o trips');
                
                // Redirigir según si completó el onboarding
                if (userData.onboarding_completed) {
                  window.location.href = '/customer/trips';
                } else {
                  window.location.href = '/onboarding';
                }
            }else if(res['body']['code'] == 'ALREADY_EXIST'){
              this.showAlertAlreadyExist=true;
              this.loading=false;
            }else{
              this.showAlertCodeError=true;
              this.loading=false;
            }
          },
          error: (error) => {
            this.loading=false;
            console.error('Error en registro:', error);
            
            // Manejar error 409 (usuario ya existe)
            if(error.status === 409 && error.error?.body?.code === 'ALREADY_EXIST'){
              this.showAlertAlreadyExist=true;
            }
            // Manejar error 400 (validación)
            else if(error.status === 400){
              this.showAlertCodeError=true;
            }
            // Otros errores
            else{
              this.showAlertCodeError=true;
            }
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
