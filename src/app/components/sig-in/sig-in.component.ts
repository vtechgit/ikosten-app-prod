import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {ApiService} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { ActivatedRoute, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';

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
  loadingMessage:string='titles.modules.login.loading-message'; // Default message

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
  submitted:boolean=false;

  constructor(
    private api: ApiService, 
    private authService: AuthService,
    private activatedRoute: ActivatedRoute, 
    private router: Router, 
    public platform: Platform
  ) { }

  ngOnInit() {
    console.log('🔧 SigInComponent: ngOnInit iniciado');
    
    this.loginForm = new FormGroup({
      loginEmail:new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      loginPass:new FormControl('', [
        Validators.required,
      ]),
    });
    
    console.log('📋 Formulario de login inicializado:', this.loginForm);
    console.log('✅ SigInComponent: ngOnInit completado');
    
    this.utm_lead = localStorage.getItem('utm_lead');
    this.getAvailableCountries();

  }
  getAvailableCountries(){
    this.api.read('availableCountries').subscribe({
      next: (response) => {
        this.availableCountries = response.body || response;
        
        // Establecer un país por defecto si no hay ninguno seleccionado
        if (this.availableCountries.length > 0 && !this.selectedCountry) {
          // Buscar un país por defecto (ej. España o el primer país)
          const defaultCountry = this.availableCountries.find((country: any) => 
            country.title?.toLowerCase().includes('españa') || 
            country.title?.toLowerCase().includes('spain')
          ) || this.availableCountries[0];
          
          this.selectedCountry = defaultCountry;
        }
      },
      error: (error) => {
        console.error('Error obteniendo países:', JSON.stringify(error));
      }
    });
  }

  /**
   * Limpia el número de teléfono eliminando el código de país si está presente
   * @param phoneNumber - El número de teléfono ingresado por el usuario
   * @returns El número limpio sin código de país
   */
  cleanPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || !this.selectedCountry) {
      return phoneNumber;
    }

    // Remover espacios en blanco
    let cleanedPhone = phoneNumber.trim();
    
    // Obtener el código de país (ej: "+34", "+1", "+52")
    const countryCode = this.selectedCountry.digit;
    
    if (!countryCode) {
      return cleanedPhone;
    }

    console.log('🧹 Limpiando número:', cleanedPhone);
    console.log('🌍 Código de país:', countryCode);

    // Eliminar el símbolo '+' si está al inicio
    if (cleanedPhone.startsWith('+')) {
      cleanedPhone = cleanedPhone.substring(1);
    }

    // Eliminar el código de país sin el '+' si está al inicio
    // Ej: Si el código es "+34" y el usuario ingresó "34612345678"
    const codeWithoutPlus = countryCode.replace('+', '');
    if (cleanedPhone.startsWith(codeWithoutPlus)) {
      cleanedPhone = cleanedPhone.substring(codeWithoutPlus.length);
    }

    // Eliminar espacios, guiones y paréntesis que puedan quedar
    cleanedPhone = cleanedPhone.replace(/[\s\-()]/g, '');

    console.log('✅ Número limpio:', cleanedPhone);
    
    return cleanedPhone;
  }

  closeModal(){
    this.isModalOpen = false;
    this.onClosed.emit();
  }

  goBackToLogin(){
    this.isLoginGoogle = false;
    this.isLoginApple = false;
    this.selectedCountry = null;
  }

  async doLoginGoogleV2(){
    
      try {
      // Iniciar el proceso de login con Google usando Firebase Authentication
      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['profile', 'email'],
      });

      if (result && result.user) {
        await this.handleGoogleLoginSuccess(result.user);
      } else {
        this.handleLoginError('No se pudo obtener información del usuario de Google');
      }
    } catch (error) {
      console.error('Error en login con Google:', JSON.stringify(error));
      this.handleLoginError('Error al iniciar sesión con Google');
    }
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
        let countryDigit = this.selectedCountry.digit;

        // Limpiar y formatear el número de teléfono con el código de país
        const cleanedPhone = this.cleanPhoneNumber(this.userPhone);
        const fullPhoneNumber = cleanedPhone ? `${countryDigit}${cleanedPhone}` : user.phoneNumber;
        console.log('📞 Teléfono ingresado:', this.userPhone);
        console.log('📞 Teléfono limpio:', cleanedPhone);
        console.log('📞 Teléfono formateado:', fullPhoneNumber);

        var obj = {};
        if(this.utm_lead && this.utm_lead != ''){
          obj ={
            lead_type: 'google',
            lead_email: user.email,
            lead_token: user.uid,
            lead_name: user.displayName,
            lead_phone: fullPhoneNumber,
            lead_country: country,
            lead_country_digit: countryDigit,
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
            lead_phone: fullPhoneNumber,
            lead_country: country,
            lead_country_digit: countryDigit,
            lead_role:0,
            lead_source: localStorage.getItem('clientSource')
          }
        }

        this.api.create('leads/auth/social', obj).subscribe(res=>{
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
  async loginApplev2(){
    // Autenticar con Apple después de que el usuario llene el formulario
    console.log('🍎 loginApplev2() llamado - iniciando autenticación');
    this.isLoading = true;
    this.loadingMessage = 'titles.modules.login.authenticating-apple';

    try {
      // Verificar que tenemos el país seleccionado
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado');
        this.handleAppleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🔑 Iniciando autenticación con Apple Firebase...');
      
      // Iniciar el proceso de login con Apple usando Firebase Authentication
      const result = await FirebaseAuthentication.signInWithApple();

      console.log('📝 Resultado de Firebase Auth Apple:', result);

      if (result && result.user) {
        console.log('✅ Usuario obtenido de Firebase Apple:', result.user);
        this.loadingMessage = 'titles.modules.login.processing-authentication';
        await this.handleAppleLoginSuccess(result.user);
      } else {
        console.error('❌ Apple Firebase no devolvió usuario');
        this.handleAppleLoginError('No se pudo obtener información del usuario de Apple');
      }
    } catch (error) {
      console.error('💥 Error en Firebase Apple Authentication:', error);
      this.handleAppleLoginError(`Error al iniciar sesión con Apple: ${error.message || error}`);
    }
  }

  doLoginEmail() {
    console.log('🎯 doLoginEmail: Método llamado - INICIO');
    console.log('🔍 Estado del loading:', this.isLoading);
    console.log('🔍 Formulario válido:', this.loginForm.valid);
    console.log('🔍 Errores del formulario:', this.loginForm.errors);
    console.log('🔍 Estado del email:', this.email?.value, 'Errores:', this.email?.errors);
    console.log('🔍 Estado del password:', this.password?.value ? '[PRESENT]' : '[MISSING]', 'Errores:', this.password?.errors);
    
    this.submitted = true;
    this.isLoading = true;
    this.loginForm.markAllAsTouched();
    console.log('🔄 Formulario marcado como tocado, validez:', this.loginForm.valid);

    if (this.loginForm.valid) {
      console.log('🔑 doLoginEmail: Iniciando login con email - FORMULARIO VÁLIDO');
      console.log('📧 Email:', this.email.value);
      
      this.authService.login(this.email.value, this.password.value).subscribe({
        next: (success) => {
          console.log('📥 doLoginEmail: Resultado de autenticación:', success);
          this.isLoading = false;
          
          if (success) {
            console.log('✅ doLoginEmail: Login exitoso');
            
            const currentUser = this.authService.getCurrentUser();
            console.log('👤 Usuario autenticado:', currentUser);
            
            if (currentUser) {
              this.handleTravelsInSession(currentUser.id);
            } else {
              this.navigateAfterLogin();
            }
          } else {
            console.log('❌ doLoginEmail: Login falló');
            this.showAlertInvalidCreeds = true;
          }
        },
        error: (error) => {
          console.error('💥 doLoginEmail: Error en login:', JSON.stringify(error));
          this.isLoading = false;
          if (error.status === 401) {
            this.showAlertInvalidCreeds = true;
          } else {
            this.showAppleAlertLogin = true;
          }
        }
      });
    } else {
      console.log('❌ doLoginEmail: Formulario inválido - NO EJECUTANDO LOGIN');
      console.log('❌ Errores específicos del formulario:');
      console.log('  - Email válido:', !this.email?.errors, 'Valor:', this.email?.value);
      console.log('  - Password válido:', !this.password?.errors, 'Valor presente:', !!this.password?.value);
      console.log('  - Errores completos:', this.loginForm.errors);
      
      // Mostrar errores de cada campo
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control?.errors) {
          console.log(`  - ${key} errores:`, control.errors);
        }
      });
      
      this.isLoading = false;
    }
  }

  private handleEmailLoginError(response: any) {
    this.isLoading = false;
    
    if (response && response.message) {
      if (response.message.includes('no encontrado') || response.message.includes('not found')) {
        this.showAlertNotFound = true;
      } else if (response.message.includes('credenciales') || response.message.includes('invalid')) {
        this.showAlertInvalidCreeds = true;
      } else {
        this.showAppleAlertLogin = true;
      }
    } else {
      this.showAppleAlertLogin = true;
    }
  }
  async startLoginGoogle(){
    console.log('🚀 startLoginGoogle() llamado');
    this.isLoginGoogle = true;

  }
  async loginGooglev2(){
    
    try {
      this.isLoading = true;
      this.loadingMessage = 'titles.modules.login.authenticating-google';
      
      console.log('🔍 Verificando país seleccionado:', this.selectedCountry);
      
      // Verificar que tenemos el país seleccionado
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado');
        this.handleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🔑 Iniciando autenticación con Google Firebase...');
      
      // Iniciar el proceso de login con Google usando Firebase Authentication
      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['profile', 'email'],
      });

      console.log('📝 Resultado de Firebase Auth:', result);

      if (result && result.user) {
        console.log('✅ Usuario obtenido de Firebase:', result.user);
        this.loadingMessage = 'titles.modules.login.processing-authentication';
        await this.handleGoogleLoginSuccess(result.user);
      } else {
        console.error('❌ Firebase no devolvió usuario');
        this.handleLoginError('No se pudo obtener información del usuario de Google');
      }
    } catch (error) {
      console.error('💥 Error en Firebase Authentication:', JSON.stringify(error));
      this.handleLoginError(`Error al iniciar sesión con Google: ${error.message || error}`);
    }
  }

  private async handleGoogleLoginSuccess(user: any) {
    console.log('🎯 handleGoogleLoginSuccess iniciado con usuario:', user);
    
    try {
      // Verificar que tenemos el país seleccionado
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado en handleGoogleLoginSuccess');
        this.handleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🌍 País seleccionado:', this.selectedCountry);
      const country = this.selectedCountry._id;
      const countryDigit = this.selectedCountry.digit;
      
      // Limpiar y formatear el número de teléfono con el código de país
      const cleanedPhone = this.cleanPhoneNumber(this.userPhone);
      const fullPhoneNumber = cleanedPhone ? `${countryDigit}${cleanedPhone}` : user.phoneNumber;
      console.log('📞 Teléfono ingresado:', this.userPhone);
      console.log('📞 Teléfono limpio:', cleanedPhone);
      console.log('📞 Teléfono formateado:', fullPhoneNumber);
      
      let authData: any = {
        lead_type: 'google',
        lead_email: user.email,
        lead_token: user.uid,
        lead_name: user.displayName,
        lead_phone: fullPhoneNumber,
        lead_country: country,
        lead_country_digit: countryDigit,
        lead_role: 0,
        lead_source: localStorage.getItem('clientSource')
      };

      // Si hay un lead de invitación, agregarlo
      if (this.utm_lead && this.utm_lead !== '') {
        console.log('📧 Agregando datos de invitación:', this.utm_lead);
        authData.lead_id = this.utm_lead;
        authData.lead_invitation_status = 'active';
      }

      console.log('📤 Datos a enviar al backend:', authData);

      // Hacer la llamada de autenticación usando AuthService
      console.log('🌐 Llamando a this.authService.loginSocial...');
      this.authService.loginSocial(authData).subscribe({
        next: (success) => {
          console.log('📥 Resultado de autenticación social:', success);
          
          if (success) {
            console.log('✅ Autenticación Google exitosa, usuario autenticado');
            
            // Obtener el usuario actual del AuthService
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
              console.log('👤 Usuario Google actual:', currentUser);
              // Manejar viajes en sesión y navegar
              this.handleTravelsInSession(currentUser.id);
            } else {
              console.error('❌ No se pudo obtener el usuario actual Google');
              this.handleLoginError('Error obteniendo datos del usuario');
            }
          } else {
            console.error('❌ Autenticación social Google falló');
            this.handleLoginError('No se pudo autenticar con Google');
          }
        },
        error: (error) => {
          console.error('💥 Error en la llamada al backend Google:', JSON.stringify(error));
          console.error('📋 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          let errorMessage = 'Error al autenticar con Google';
          if (error.error && error.error.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error.message) {
            errorMessage += `: ${error.message}`;
          } else if (error.status) {
            errorMessage += ` (Error ${error.status})`;
          }
          
          this.handleLoginError(errorMessage);
        }
      });

    } catch (error) {
      console.error('💥 Error en handleGoogleLoginSuccess:', error);
      this.handleLoginError(`Error procesando la autenticación: ${error.message || error}`);
    }
  }

  private handleTravelsInSession(leadId: string) {
    const travels = sessionStorage.getItem('travels');
    
    if (travels && travels !== '' && travels !== null) {
      const travelsArray = JSON.parse(travels);
      
      travelsArray.forEach((travel: any, index: number) => {
        travelsArray[index]['process_lead'] = leadId;
      });

      this.api.update('processes/update/bulk', travelsArray).subscribe({
        next: () => {
          sessionStorage.removeItem('travels');
          this.navigateAfterLogin();
        },
        error: (error) => {
          console.error('Error actualizando viajes:', error);
          this.navigateAfterLogin();
        }
      });
    } else {
      this.navigateAfterLogin();
    }
  }

  private navigateAfterLogin() {
    // Mantener isLoading = true hasta que navegue para mostrar feedback visual
    // La navegación con window.location.href recargará la página de todas formas
    this.loadingMessage = 'titles.modules.login.redirecting';

    // Verificar si el usuario ha completado el onboarding
    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 navigateAfterLogin - Usuario actual completo:', JSON.stringify(currentUser, null, 2));
    console.log('🔍 navigateAfterLogin - onboarding_completed valor:', currentUser?.onboarding_completed);
    console.log('🔍 navigateAfterLogin - Tipo de onboarding_completed:', typeof currentUser?.onboarding_completed);
    console.log('🔍 navigateAfterLogin - Es exactamente false?:', currentUser?.onboarding_completed === false);
    console.log('🔍 navigateAfterLogin - Es exactamente true?:', currentUser?.onboarding_completed === true);
    console.log('🔍 navigateAfterLogin - Es undefined?:', currentUser?.onboarding_completed === undefined);
    console.log('🔍 navigateAfterLogin - Es null?:', currentUser?.onboarding_completed === null);
    
    // Verificar también desde ApiService (usa environment.security.userStorageKey)
    const storedUser = this.api.getUserData();
    if (storedUser) {
      console.log('🔍 navigateAfterLogin - Usuario desde ApiService completo:', JSON.stringify(storedUser, null, 2));
      console.log('🔍 navigateAfterLogin - onboarding desde ApiService:', storedUser.onboarding_completed);
    } else {
      console.warn('⚠️ No hay datos de usuario disponibles desde ApiService');
    }
    
    // Verificar onboarding - considerar undefined, null y false como "no completado"
    const hasCompletedOnboarding = currentUser?.onboarding_completed === true;
    
    console.log('🔍 navigateAfterLogin - hasCompletedOnboarding (calculado):', hasCompletedOnboarding);
    
    if (currentUser && !hasCompletedOnboarding) {
      console.log('🎯 Usuario no ha completado onboarding (o es undefined/null/false), redirigiendo a /onboarding...');
      window.location.href = '/onboarding';
      return;
    }

    console.log('✅ Usuario ha completado onboarding, navegando normalmente');

    // Si tiene backParams, navegar según los parámetros
    if (this.backParams && this.backParams.back && this.backParams.back !== '') {
      let url = `/customer/${this.backParams.back}`;
      
      if (this.backParams.membership && this.backParams.membership !== '') {
        url += `/?membership=${this.backParams.membership}`;
      } else if (this.backParams.trip && this.backParams.trip !== '') {
        url += `/?trip=${this.backParams.trip}`;
        if (this.backParams.step && this.backParams.step) {
          url += `&step=${this.backParams.step}`;
        }
      }
      
      console.log('🔄 Navegando con backParams a:', url);
      window.location.href = url;
    } else {
      console.log('🔄 Navegando a trips por defecto');
      window.location.href = '/customer/trips';
    }
  }

  private handleLoginError(message: string) {
    console.error('Login error:', message);
    this.isLoginGoogle = false;
    this.isLoading = false;
    this.showAppleAlertLogin = true; // Reutilizar el alert existente
  }
  async startLoginApple(){
    // Solo mostrar el formulario de país/teléfono, como hace Google
    console.log('🍎 startLoginApple() llamado - mostrando formulario');
    this.isLoginApple = true;
    this.isLoading = false;
  }

  private async handleAppleLoginSuccess(user: any) {
    console.log('🎯 handleAppleLoginSuccess iniciado con usuario:', user);
    
    try {
      // Verificar que tenemos el país seleccionado
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado en handleAppleLoginSuccess');
        this.handleAppleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🌍 País seleccionado:', this.selectedCountry);
      const country = this.selectedCountry._id;
      const countryDigit = this.selectedCountry.digit;
      
      // Limpiar y formatear el número de teléfono con el código de país
      const cleanedPhone = this.cleanPhoneNumber(this.userPhone);
      const fullPhoneNumber = cleanedPhone ? `${countryDigit}${cleanedPhone}` : user.phoneNumber;
      console.log('📞 Teléfono ingresado:', this.userPhone);
      console.log('📞 Teléfono limpio:', cleanedPhone);
      console.log('📞 Teléfono formateado:', fullPhoneNumber);
      
      let authData: any = {
        lead_type: 'apple',
        lead_email: user.email && user.email != 'null' ? user.email : '',
        lead_token: user.uid,
        lead_name: user.displayName || '',
        lead_phone: fullPhoneNumber,
        lead_country: country,
        lead_country_digit: countryDigit,
        lead_role: 0,
        lead_source: localStorage.getItem('clientSource')
      };

      // Si hay un lead de invitación, agregarlo
      if (this.utm_lead && this.utm_lead !== '') {
        console.log('📧 Agregando datos de invitación:', this.utm_lead);
        authData.lead_id = this.utm_lead;
        authData.lead_invitation_status = 'active';
      }

      console.log('📤 Datos a enviar al backend:', authData);

      // Hacer la llamada de autenticación usando AuthService
      console.log('🌐 Llamando a this.authService.loginSocial...');
      this.authService.loginSocial(authData).subscribe({
        next: (success) => {
          console.log('📥 Resultado de autenticación social Apple:', success);
          
          if (success) {
            console.log('✅ Autenticación Apple exitosa, usuario autenticado');
            
            // Obtener el usuario actual del AuthService
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
              console.log('👤 Usuario Apple actual:', currentUser);
              // Manejar viajes en sesión y navegar
              this.handleTravelsInSession(currentUser.id);
            } else {
              console.error('❌ No se pudo obtener el usuario actual Apple');
              this.handleAppleLoginError('Error obteniendo datos del usuario');
            }
          } else {
            console.error('❌ Autenticación social Apple falló');
            this.handleAppleLoginError('No se pudo autenticar con Apple');
          }
        },
        error: (error) => {
          console.error('💥 Error en la llamada al backend Apple:', error);
          console.error('📋 Detalles del error Apple:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          let errorMessage = 'Error al autenticar con Apple';
          if (error.error && error.error.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error.message) {
            errorMessage += `: ${error.message}`;
          } else if (error.status) {
            errorMessage += ` (Error ${error.status})`;
          }
          
          this.handleAppleLoginError(errorMessage);
        }
      });

    } catch (error) {
      console.error('💥 Error en handleAppleLoginSuccess:', error);
      this.handleAppleLoginError(`Error procesando la autenticación Apple: ${error.message || error}`);
    }
  }

  private handleAppleLoginError(message: string) {
    console.error('Apple login error:', message);
    this.isLoginApple = false;
    this.isLoading = false;
    this.showAppleAlertLogin = true; // Reutilizar el alert existente
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
              let countryDigit = this.selectedCountry.digit;
              var obj = {};
              if(this.utm_lead && this.utm_lead != ''){
                obj ={
                  lead_type: 'phone',
                  lead_email: user.email,
                  lead_token: user.uid,
                  lead_name: user.displayName,
                  lead_phone: this.userPhone,
                  lead_country: country,
                  lead_country_digit: countryDigit,
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
                  lead_country_digit: countryDigit,
                  lead_role:0,
                  lead_source: localStorage.getItem('clientSource')
                }
              }

              this.api.create('leads/auth/social', obj).subscribe(res=>{
  
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

  // Método de testing - para llamar desde consola del navegador
  testLogin(email: string = 'test@example.com', password: string = 'test123') {
    console.log('🧪 TEST LOGIN iniciado');
    console.log('📧 Email de prueba:', email);
    console.log('🔒 Password presente:', !!password);
    
    // Configurar valores del formulario
    this.loginForm.patchValue({
      loginEmail: email,
      loginPass: password
    });
    
    console.log('📋 Formulario después de patchValue:');
    console.log('  - Válido:', this.loginForm.valid);
    console.log('  - Email:', this.email?.value, 'Errores:', this.email?.errors);
    console.log('  - Password:', this.password?.value ? '[PRESENT]' : '[MISSING]', 'Errores:', this.password?.errors);
    
    // Llamar al método de login
    this.doLoginEmail();
  }
}
