import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { environment } from 'src/environments/environment';
declare var ttq: any;

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
  lead_source:string;

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
        Validators.minLength(2),
        Validators.maxLength(100)
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
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]),

    });
    
    // Capturar utm_lead desde URL
    this.utm_lead = this.activatedRoute.snapshot.queryParamMap.get('utm_lead');
    if(this.utm_lead && this.utm_lead != ''){
      localStorage.setItem('utm_lead', this.utm_lead);
      console.log('✅ utm_lead capturado desde URL:', this.utm_lead);
    }
    
    // Capturar lead_source desde URL
    this.lead_source = this.activatedRoute.snapshot.queryParamMap.get('lead_source');
    if(this.lead_source && this.lead_source != ''){
      localStorage.setItem('lead_source', this.lead_source);
      console.log('✅ lead_source capturado desde URL:', this.lead_source);
    }
    
    // Si no hay lead_source en URL, verificar si existe en localStorage
    // (puede haber sido guardado previamente o por otro componente)
    if(!this.lead_source){
      const storedSource = localStorage.getItem('lead_source');
      if(storedSource){
        this.lead_source = storedSource;
        console.log('ℹ️  lead_source recuperado de localStorage:', this.lead_source);
      }
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
        
        var country = this.countrySelect.value._id;
        var country_digit= this.countrySelect.value.digit;
        
        // Determinar lead_source: prioridad URL > localStorage > clientSource (legacy)
        const finalLeadSource = this.lead_source || 
                                localStorage.getItem('lead_source') || 
                                localStorage.getItem('clientSource') || 
                                'direct';
        
        console.log('📊 Lead source para registro:', finalLeadSource);
        
        var obj = {};
        
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
            lead_source: finalLeadSource,
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
            lead_source: finalLeadSource,
            lead_password: this.password.value
          }
        }
        
        this.api.create('leads/registerNew',obj).subscribe({
          next: (res) => {
            console.log('✅ Respuesta de registro:',JSON.stringify( res));
            
            if(res['body']['status'] == true){
                // Estructura de respuesta actualizada con tokens
                const responseData = res['body']['data'];
                
                // Guardar tokens usando ApiService para mantener consistencia
                if(responseData.tokens) {
                  this.api.setToken(responseData.tokens.accessToken);
                  this.api.setRefreshToken(responseData.tokens.refreshToken);
                  console.log('✅ Tokens guardados a través de ApiService');
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
                
                // Guardar datos de usuario usando ApiService para mantener consistencia
                this.api.setUserData(userData);
                console.log('✅ Datos de usuario guardados a través de ApiService:', JSON.stringify(userData));
                
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
                
                // 📊 Registrar evento de TikTok Ads - CompleteRegistration
                this.trackCompleteRegistration(userData.id, userData.email);
                
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
            console.error('Error en registro:', JSON.stringify(error));
            
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

  /**
   * Validador personalizado para la fortaleza de la contraseña
   * Requiere: 1 mayúscula, 1 minúscula, 1 número
   * Permite caracteres especiales opcionalmente
   */
  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Si está vacío, lo maneja el required
      }

      // Verificar que tenga al menos una mayúscula
      const hasUpperCase = /[A-Z]/.test(value);
      
      // Verificar que tenga al menos una minúscula
      const hasLowerCase = /[a-z]/.test(value);
      
      // Verificar que tenga al menos un número
      const hasNumber = /\d/.test(value);
      
      // Verificar que solo contenga caracteres permitidos
      const validCharacters = /^[A-Za-z\d@$!%*?&#]+$/.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumber && validCharacters;

      if (!passwordValid) {
        return {
          passwordStrength: {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            validCharacters
          }
        };
      }

      return null;
    };
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

  /**
   * Registra evento CompleteRegistration en TikTok Ads cuando el usuario se registra exitosamente
   * Usa localStorage para evitar disparar el evento múltiples veces para el mismo usuario
   * @param userId - ID del usuario registrado
   * @param userEmail - Email del usuario registrado
   */
  private trackCompleteRegistration(userId: string, userEmail: string) {
    // Verificar que TikTok Pixel esté disponible
    if (typeof ttq === 'undefined') {
      console.warn('⚠️ TikTok Pixel no disponible para CompleteRegistration');
      return;
    }

    // Verificar si ya se disparó el evento para este usuario
    const registrationTrackedKey = `ttq_registration_tracked_${userId}`;
    const alreadyTracked = localStorage.getItem(registrationTrackedKey);
    
    if (alreadyTracked === 'true') {
      console.log('ℹ️ CompleteRegistration ya fue enviado para este usuario, omitiendo...');
      return;
    }

    try {
      // Generar event_id único para evitar duplicados
      const eventId = `${Date.now()}_${userId}`;
      
      ttq.track('CompleteRegistration', {
        "contents": [
          {
            "content_id": userId,
            "content_type": "user",
            "content_name": "New User Registration"
          }
        ]
      }, {
        "event_id": eventId
      });

      // Marcar como enviado en localStorage
      localStorage.setItem(registrationTrackedKey, 'true');

      console.log('📊 TikTok Ads: CompleteRegistration event enviado', {
        userId: userId,
        userEmail: userEmail,
        eventId: eventId
      });
    } catch (error) {
      console.error('❌ Error al enviar CompleteRegistration a TikTok Ads:', error);
    }
  }
}
