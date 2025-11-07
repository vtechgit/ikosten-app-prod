import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { environment } from 'src/environments/environment';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { AuthService } from 'src/app/services/auth.service';
import { Platform } from '@ionic/angular';
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
  
  // Propiedades para login social
  isLoginGoogle:boolean=false;
  isLoginApple:boolean=false;
  selectedCountry:any;
  userPhone:string;
  countriesLoaded:boolean=false;
  loadingMessage:string='titles.modules.login.loading-message';
  showAppleAlertLogin:boolean=false;
  showAppleAlertAccount:boolean=false;

  constructor(
    private api:ApiService,
    private activatedRoute:ActivatedRoute,
    public translateService:TranslateService,
    private router:Router,
    private authService:AuthService,
    public platform:Platform
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
    
    // Capturar utm_lead desde localStorage (guardado previamente en app.component o login)
    this.utm_lead = localStorage.getItem('utm_lead');
    if(this.utm_lead && this.utm_lead != ''){
      console.log('✅ utm_lead recuperado de localStorage:', this.utm_lead);
    }
    
    // Capturar lead_source desde localStorage (guardado previamente en app.component)
    this.lead_source = localStorage.getItem('lead_source');
    if(this.lead_source && this.lead_source != ''){
      console.log('✅ lead_source recuperado de localStorage:', this.lead_source);
    } else {
      console.log('ℹ️  No hay lead_source en localStorage, se usará "direct" como fallback');
    }
  }

  getAvailableCountries(){
    console.log('🌍 Cargando países disponibles...');
    this.countriesLoaded = false;
    
    this.api.read('availableCountries').subscribe({
      next: (response) => {
        this.availableCountries = response.body || response;
        this.countriesLoaded = true;
        console.log('✅ Países cargados:', this.availableCountries.length);
        
        // Establecer un país por defecto si no hay ninguno seleccionado
        if (this.availableCountries.length > 0 && !this.selectedCountry) {
          // Buscar un país por defecto (ej. España o el primer país)
          const defaultCountry = this.availableCountries.find((country: any) => 
            country.title?.toLowerCase().includes('españa') || 
            country.title?.toLowerCase().includes('spain')
          ) || this.availableCountries[0];
          
          this.selectedCountry = defaultCountry;
          console.log('🏳️ País por defecto seleccionado:', this.selectedCountry.title);
        }
      },
      error: (error) => {
        console.error('❌ Error obteniendo países:', JSON.stringify(error));
        this.countriesLoaded = false;
      }
    });
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
  private trackCompleteRegistration(userId: string, userEmail: string, registrationType: string = 'email') {
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
            "content_name": `New User Registration - ${registrationType}`
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
        registrationType: registrationType,
        eventId: eventId
      });
    } catch (error) {
      console.error('❌ Error al enviar CompleteRegistration a TikTok Ads:', error);
    }
  }

  // ============ MÉTODOS DE LOGIN SOCIAL ============

  /**
   * Inicia el proceso de login con Google
   * Muestra el formulario para seleccionar país y teléfono
   */
  async startLoginGoogle(){
    console.log('🚀 startLoginGoogle() llamado');
    this.isLoginGoogle = true;
  }

  /**
   * Inicia el proceso de login con Apple
   * Muestra el formulario para seleccionar país y teléfono
   */
  async startLoginApple(){
    console.log('🍎 startLoginApple() llamado - mostrando formulario');
    this.isLoginApple = true;
    this.isLoading = false;
  }

  /**
   * Cancela el proceso de login social y vuelve al formulario principal
   */
  goBackToRegister(){
    this.isLoginGoogle = false;
    this.isLoginApple = false;
    this.selectedCountry = null;
    this.userPhone = '';
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

    let cleanedPhone = phoneNumber.trim();
    const countryCode = this.selectedCountry.digit;
    
    if (!countryCode) {
      return cleanedPhone;
    }

    console.log('🧹 Limpiando número:', cleanedPhone);
    console.log('🌍 Código de país:', countryCode);

    if (cleanedPhone.startsWith('+')) {
      cleanedPhone = cleanedPhone.substring(1);
    }

    const codeWithoutPlus = countryCode.replace('+', '');
    if (cleanedPhone.startsWith(codeWithoutPlus)) {
      cleanedPhone = cleanedPhone.substring(codeWithoutPlus.length);
    }

    cleanedPhone = cleanedPhone.replace(/[\s\-()]/g, '');

    console.log('✅ Número limpio:', cleanedPhone);
    
    return cleanedPhone;
  }

  /**
   * Ejecuta el proceso completo de login con Google
   * Autentica con Firebase y luego con el backend
   */
  async loginGooglev2(){
    try {
      this.isLoading = true;
      this.loadingMessage = 'titles.modules.login.authenticating-google';
      
      console.log('🔍 Verificando país seleccionado:', this.selectedCountry);
      
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado');
        this.handleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🔑 Iniciando autenticación con Google Firebase...');
      
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
      console.error('💥 Error en Firebase Authentication:', error);
      console.error('💥 Error code:', error?.code);
      console.error('💥 Error message:', error?.message);
      console.error('💥 Error stringified:', JSON.stringify(error));
      
      // Detectar si el usuario canceló el popup
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      const errorString = JSON.stringify(error).toLowerCase();
      
      const isCancelled = errorCode === 'auth/popup-closed-by-user' ||
                          errorCode === 'auth/cancelled-popup-request' ||
                          errorCode === 'auth/user-cancelled' ||
                          errorMessage.toLowerCase().includes('popup') ||
                          errorMessage.toLowerCase().includes('cancel') ||
                          errorMessage.toLowerCase().includes('closed') ||
                          errorString.includes('cancel') ||
                          errorString.includes('popup') ||
                          errorString.includes('closed');
      
      console.log('🔍 isCancelled:', isCancelled);
      
      if (isCancelled) {
        console.log('ℹ️ Usuario canceló la autenticación con Google');
        // Solo ocultar el loading, no mostrar error
        this.isLoading = false;
        this.loading = false;
        this.isLoginGoogle = false;
      } else {
        // Error real, mostrar mensaje
        this.handleLoginError(`Error al iniciar sesión con Google: ${error.message || error}`);
      }
    }
  }

  /**
   * Procesa el resultado exitoso de autenticación con Google
   * @param user - Usuario de Firebase
   */
  private async handleGoogleLoginSuccess(user: any) {
    console.log('🎯 handleGoogleLoginSuccess iniciado con usuario:', user);
    
    try {
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado en handleGoogleLoginSuccess');
        this.handleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🌍 País seleccionado:', this.selectedCountry);
      const country = this.selectedCountry._id;
      const countryDigit = this.selectedCountry.digit;
      
      const cleanedPhone = this.cleanPhoneNumber(this.userPhone);
      const fullPhoneNumber = cleanedPhone ? `${countryDigit}${cleanedPhone}` : user.phoneNumber;
      console.log('📞 Teléfono formateado:', fullPhoneNumber);
      
      // Determinar lead_source con sistema de prioridades
      const finalLeadSource = this.lead_source || 
                              localStorage.getItem('lead_source') || 
                              localStorage.getItem('clientSource') || 
                              'direct';
      console.log('📊 lead_source final para Google registro:', finalLeadSource);
      
      let authData: any = {
        lead_type: 'google',
        lead_email: user.email,
        lead_token: user.uid,
        lead_name: user.displayName,
        lead_phone: fullPhoneNumber,
        lead_country: country,
        lead_country_digit: countryDigit,
        lead_role: 0,
        lead_source: finalLeadSource
      };

      if (this.utm_lead && this.utm_lead !== '') {
        console.log('📧 Agregando datos de invitación:', this.utm_lead);
        authData.lead_id = this.utm_lead;
        authData.lead_invitation_status = 'active';
      }

      console.log('📤 Datos a enviar al backend:', authData);
      console.log('🌐 Llamando a this.authService.loginSocial...');
      
      this.authService.loginSocial(authData).subscribe({
        next: (success) => {
          console.log('📥 Resultado de autenticación social:', success);
          
          if (success) {
            console.log('✅ Autenticación Google exitosa, usuario autenticado');
            
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
              console.log('👤 Usuario Google actual:', currentUser);
              
              // 📊 Registrar evento de TikTok Ads
              this.trackCompleteRegistration(currentUser.id, currentUser.email, 'google');
              
              // Navegar según onboarding
              this.navigateAfterRegistration(currentUser);
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

  /**
   * Ejecuta el proceso completo de login con Apple
   * Autentica con Firebase y luego con el backend
   */
  async loginApplev2(){
    console.log('🍎 loginApplev2() llamado - iniciando autenticación');
    this.isLoading = true;
    this.loadingMessage = 'titles.modules.login.authenticating-apple';

    try {
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado');
        this.handleAppleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🔑 Iniciando autenticación con Apple Firebase...');
      
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
      console.error('💥 Error code:', error?.code);
      console.error('💥 Error message:', error?.message);
      console.error('💥 Error stringified:', JSON.stringify(error));
      
      // Detectar si el usuario canceló el popup
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      const errorString = JSON.stringify(error).toLowerCase();
      
      const isCancelled = errorCode === 'auth/popup-closed-by-user' ||
                          errorCode === 'auth/cancelled-popup-request' ||
                          errorCode === 'auth/user-cancelled' ||
                          errorCode === '1001' ||
                          errorMessage.toLowerCase().includes('popup') ||
                          errorMessage.toLowerCase().includes('cancel') ||
                          errorMessage.toLowerCase().includes('closed') ||
                          errorString.includes('cancel') ||
                          errorString.includes('popup') ||
                          errorString.includes('closed') ||
                          errorString.includes('1001');
      
      console.log('🔍 isCancelled:', isCancelled);
      
      if (isCancelled) {
        console.log('ℹ️ Usuario canceló la autenticación con Apple');
        // Solo ocultar el loading, no mostrar error
        this.isLoading = false;
        this.loading = false;
        this.isLoginApple = false;
      } else {
        // Error real, mostrar mensaje
        this.handleAppleLoginError(`Error al iniciar sesión con Apple: ${error.message || error}`);
      }
    }
  }

  /**
   * Procesa el resultado exitoso de autenticación con Apple
   * @param user - Usuario de Firebase
   */
  private async handleAppleLoginSuccess(user: any) {
    console.log('🎯 handleAppleLoginSuccess iniciado con usuario:', user);
    
    try {
      if (!this.selectedCountry) {
        console.error('❌ No hay país seleccionado en handleAppleLoginSuccess');
        this.handleAppleLoginError('Por favor selecciona un país');
        return;
      }

      console.log('🌍 País seleccionado:', this.selectedCountry);
      const country = this.selectedCountry._id;
      const countryDigit = this.selectedCountry.digit;
      
      const cleanedPhone = this.cleanPhoneNumber(this.userPhone);
      const fullPhoneNumber = cleanedPhone ? `${countryDigit}${cleanedPhone}` : user.phoneNumber;
      console.log('📞 Teléfono formateado:', fullPhoneNumber);
      
      // Determinar lead_source con sistema de prioridades
      const finalLeadSource = this.lead_source || 
                              localStorage.getItem('lead_source') || 
                              localStorage.getItem('clientSource') || 
                              'direct';
      console.log('📊 lead_source final para Apple registro:', finalLeadSource);
      
      let authData: any = {
        lead_type: 'apple',
        lead_email: user.email && user.email != 'null' ? user.email : '',
        lead_token: user.uid,
        lead_name: user.displayName || '',
        lead_phone: fullPhoneNumber,
        lead_country: country,
        lead_country_digit: countryDigit,
        lead_role: 0,
        lead_source: finalLeadSource
      };

      if (this.utm_lead && this.utm_lead !== '') {
        console.log('📧 Agregando datos de invitación:', this.utm_lead);
        authData.lead_id = this.utm_lead;
        authData.lead_invitation_status = 'active';
      }

      console.log('📤 Datos a enviar al backend:', authData);
      console.log('🌐 Llamando a this.authService.loginSocial...');
      
      this.authService.loginSocial(authData).subscribe({
        next: (success) => {
          console.log('📥 Resultado de autenticación social Apple:', success);
          
          if (success) {
            console.log('✅ Autenticación Apple exitosa, usuario autenticado');
            
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
              console.log('👤 Usuario Apple actual:', currentUser);
              
              // 📊 Registrar evento de TikTok Ads
              this.trackCompleteRegistration(currentUser.id, currentUser.email, 'apple');
              
              // Navegar según onboarding
              this.navigateAfterRegistration(currentUser);
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

  /**
   * Navega a la ruta apropiada después del registro exitoso
   * @param currentUser - Usuario autenticado
   */
  private navigateAfterRegistration(currentUser: any) {
    this.loading = false;
    this.isLoading = false;
    
    console.log('🔍 navigateAfterRegistration - Usuario completo:', JSON.stringify(currentUser, null, 2));
    console.log('🔍 onboarding_completed:', currentUser?.onboarding_completed);
    
    const hasCompletedOnboarding = currentUser?.onboarding_completed === true;
    
    if (!hasCompletedOnboarding) {
      console.log('🎯 Usuario no ha completado onboarding, navegando a /onboarding...');
      window.location.href = '/onboarding';
    } else {
      console.log('✅ Usuario ha completado onboarding, navegando a trips');
      window.location.href = '/customer/trips';
    }
  }

  /**
   * Maneja errores de login con Google
   * @param message - Mensaje de error
   */
  private handleLoginError(message: string) {
    console.error('Login error:', message);
    this.isLoginGoogle = false;
    this.isLoading = false;
    this.loading = false;
    this.showAppleAlertLogin = true;
  }

  /**
   * Maneja errores de login con Apple
   * @param message - Mensaje de error
   */
  private handleAppleLoginError(message: string) {
    console.error('Apple login error:', message);
    this.isLoginApple = false;
    this.isLoading = false;
    this.loading = false;
    this.showAppleAlertLogin = true;
  }

  /**
   * Convierte nombre de país a key de traducción
   * @param input - Nombre del país
   * @returns Key para traducción
   */
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }
}
