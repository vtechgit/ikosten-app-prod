import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService, PaymentProduct } from '../../services/payment.service';
import { IPayPalConfig, ICreateSubscriptionRequest } from 'ngx-paypal';
import { environment } from '../../../environments/environment';
declare var ttq;

@Component({
  selector: 'app-membership-modal',
  standalone: false,
  templateUrl: './membership-modal.component.html',
  styleUrls: ['./membership-modal.component.scss']
})
export class MembershipModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() uploadLimitData: any = null;
  @Output() dismiss = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<string>();

  membershipPlans: any[] = [];
  isLoadingMemberships: boolean = false;
  
  // In-App Purchase products (para iOS/Android)
  inAppProducts: PaymentProduct[] = [];
  isLoadingProducts: boolean = false;
  
  // PayPal checkout (para web)
  currentStep: 'plans' | 'checkout' = 'plans'; // Control de pasos
  membershipSelected: any = null;
  payPalConfig?: IPayPalConfig;
  userSession: any;
  
  // Platform detection
  isNativePlatform: boolean = false;
  isIOS: boolean = false;
  
  // Trial tracking
  modalOpenTime: number = 0;
  viewedPlans: string[] = [];
  
  // Payment success flag (to avoid sending trial declined webhook on successful payment)
  paymentSuccessful: boolean = false;
  
  // Alerts
  showAlertError: boolean = false;
  showAlertSuccess: boolean = false;
  
  // 🆕 Specific alert types for better UX
  currentAlertType: 'generic' | 'product-not-found' | 'store-error' | 'sandbox-required' = 'generic';
  
  public errorButtons = [
    {
      text: 'buttons.accept',
      role: 'cancel',
      handler: () => {
        this.showAlertError = false;
      },
    },
  ];

  public successButtons = [
    {
      text: 'buttons.accept',
      role: 'cancel',
      handler: () => {
        this.onSuccessPayment();
      },
    },
  ];

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private paymentService: PaymentService,
    private platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {
    // Verificar que sea plataforma nativa (iOS/Android) Y NO sea mobileweb
    // mobileweb = navegador móvil, hybrid/capacitor = app nativa
    this.isNativePlatform = (this.platform.is('ios') || this.platform.is('android')) && 
                             !this.platform.is('mobileweb') &&
                             (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid'));
    
    // Detectar específicamente iOS
    this.isIOS = this.platform.is('ios') && !this.platform.is('mobileweb');
    
    console.log('💳 MembershipModal: Plataforma nativa:', this.isNativePlatform);
    console.log('🍎 MembershipModal: Es iOS:', this.isIOS);
    console.log('📱 MembershipModal: Plataforma detectada:', {
      ios: this.platform.is('ios'),
      android: this.platform.is('android'),
      mobileweb: this.platform.is('mobileweb'),
      capacitor: this.platform.is('capacitor'),
      cordova: this.platform.is('cordova'),
      hybrid: this.platform.is('hybrid')
    });
  }
                  

  ngOnChanges(changes: SimpleChanges) {
    // Cuando el modal se abre, cargar las membresías
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.modalOpenTime = Date.now(); // Registrar tiempo de apertura
      this.viewedPlans = []; // Resetear planes vistos
      this.paymentSuccessful = false; // Resetear bandera de pago exitoso
      this.currentStep = 'plans'; // Resetear al paso inicial
      this.membershipSelected = null; // Limpiar selección previa
      this.payPalConfig = undefined; // Limpiar configuración de PayPal
      this.loadMemberships();
      this.loadUserSession();
      this.translateWords(); // Traducir textos de botones
      
      // 📊 Registrar evento de TikTok Ads cuando se abre el modal (solo web)
      this.trackInitiateCheckout();
    }
  }

  private translateWords() {
    this.translate.get('buttons.accept').subscribe((text: string) => {
      this.errorButtons[0].text = text;
      this.successButtons[0].text = text;
    });
  }

  private loadUserSession() {
    if (this.api.isLoggedIn()) {
      this.userSession = this.api.getUserData();
      console.log('✅ User session loaded in membership modal:', this.userSession);
    }
  }

  private loadMemberships() {
    console.log('🔄 Cargando membresías...');
    this.isLoadingMemberships = true;
    this.api.read('memberships').subscribe({
      next: (res) => {
        console.log('✅ Membresías cargadas:', res);
        this.membershipPlans = res['body'] || res;
        this.isLoadingMemberships = false;
        this.cdr.detectChanges();
        
        // Si es plataforma nativa, cargar productos de In-App Purchase
        if (this.isNativePlatform) {
          this.loadInAppProducts();
        }
      },
      error: (err) => {
        console.error('❌ Error cargando membresías:', err);
        this.membershipPlans = [];
        this.isLoadingMemberships = false;
      }
    });
  }

  private async loadInAppProducts() {
    console.log('🔄 Cargando productos de In-App Purchase...');
    this.isLoadingProducts = true;
    
    try {
      // Extraer los IDs de productos de las membresías
      const productIds = this.membershipPlans
        .filter(plan => plan.membership_in_app_product_id) // Solo planes con ID configurado
        .map(plan => plan.membership_in_app_product_id);
      
      if (productIds.length === 0) {
        console.warn('⚠️ No hay productos configurados para In-App Purchase');
        this.isLoadingProducts = false;
        return;
      }
      
      console.log('📦 IDs de productos a cargar:', productIds);
      
      // Obtener productos desde la tienda
      this.inAppProducts = await this.paymentService.getProducts(productIds);
      
      console.log('✅ Productos de In-App Purchase cargados:', this.inAppProducts);
      this.isLoadingProducts = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error cargando productos de In-App Purchase:', error);
      this.isLoadingProducts = false;
      this.cdr.detectChanges();
    }
  }

  closeModal() {
    this.sendTrialDeclined('maybe_later');
    this.dismiss.emit();
  }

  closeModalWithButton() {
    this.sendTrialDeclined('close_button');
    this.dismiss.emit();
  }

  onModalDismiss() {
    this.sendTrialDeclined('modal_dismiss');
    this.closeModal();
  }

  selectPlan(planId: string) {
    console.log('📋 Plan seleccionado:', planId);
    
    // Registrar que el usuario vio este plan
    if (!this.viewedPlans.includes(planId)) {
      this.viewedPlans.push(planId);
    }
    
    // Buscar el plan completo
    const selectedPlan = this.membershipPlans.find(p => p._id === planId);
    
    if (!selectedPlan) {
      console.error('❌ Plan no encontrado');
      return;
    }

    // Verificar si el usuario está logueado
    if (!this.userSession) {
      console.log('⚠️ Usuario no logueado, redirigiendo a login');
      this.closeModal();
      this.router.navigate(['/customer/login'], {
        queryParams: { back: 'main', membership: planId }
      });
      return;
    }

    // Decidir qué método de pago usar según la plataforma
    if (this.isNativePlatform) {
      // Usar In-App Purchase en iOS/Android
      this.purchaseWithInApp(selectedPlan);
    } else {
      // Usar PayPal en web
      this.openCheckout(selectedPlan);
    }
  }

  /**
   * Compra usando In-App Purchase (iOS/Android)
   */
  async purchaseWithInApp(membership: any) {
    console.log('💰 Iniciando compra con In-App Purchase:', membership);
    
    // Verificar que el plan tenga un product ID configurado
    if (!membership.membership_in_app_product_id) {
      console.error('❌ El plan no tiene un product ID configurado para In-App Purchase');
      this.handlePurchaseError('Producto no configurado para In-App Purchase');
      return;
    }
    
    try {
      // Mostrar loading
      this.isLoadingMemberships = true;
      
      // Iniciar compra
      const result = await this.paymentService.purchaseProduct(membership.membership_in_app_product_id);
      
      this.isLoadingMemberships = false;
      
      if (result.success) {
        console.log('✅ Compra exitosa:', result);
        
        // 🔍 Determinar si es trial y ajustar el valor
        const isTrialPurchase = result.isInTrial || false;
        const purchaseValue = isTrialPurchase ? 0 : membership.membership_price;
        
        console.log('💰 Tipo de compra:', {
          isInTrial: isTrialPurchase,
          originalPrice: membership.membership_price,
          valueSent: purchaseValue
        });
        
        // Registrar la compra en el backend
        this.api.create('purchasedMemberships/new', {
          order_id: result.transactionId,
          subscription_id: result.transactionId,
          lead_id: this.userSession.id,
          payer_id: this.userSession.id,
          value: purchaseValue, // 🔧 0 si es trial, precio real si no
          membership_plan_id: membership._id,
          plan_id: membership.membership_in_app_product_id,
          error: '',
          currency: membership.membership_currency,
          description: membership.membership_title,
          prod_id: membership.membership_prod_id,
          membership_status: 'ACTIVE'.toUpperCase(), // Asegurar mayúsculas consistentes con PayPal
          recurring: membership.membership_recurring,
          source: this.platform.is('ios') ? 'app_store' : 'google_play'
        }).subscribe({
          next: (purchasedMembershipsResponse) => {
            console.log('✅ Membership purchased:', purchasedMembershipsResponse);
            
            // Actualizar el usuario con el nuevo rol
            this.api.update('leads/' + this.userSession.id, {
              lead_role: membership.membership_role
            }).subscribe({
              next: (res) => {
                console.log('✅ User updated:', res);
                
                // Actualizar sesión local - IMPORTANTE: mantener onboarding_completed
                this.userSession.lead_role = membership.membership_role;
                this.userSession.role = membership.membership_role;
                
                // ✅ Mapear lead_onboarding_completed a onboarding_completed
                if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
                  this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
                } else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
                  // Si no existe ninguno, asumir completado (usuario existente)
                  this.userSession.onboarding_completed = true;
                  this.userSession.lead_onboarding_completed = true;
                }
                
                localStorage.setItem('userSession', JSON.stringify(this.userSession));
                
                // Actualizar AuthService con la estructura correcta de User
                const updatedUser: any = {
                  id: this.userSession.id || this.userSession._id,
                  email: this.userSession.email || this.userSession.lead_email,
                  name: this.userSession.name || this.userSession.lead_name,
                  role: membership.membership_role,
                  company_id: this.userSession.company_id || this.userSession.lead_company_id,
                  category: this.userSession.category || this.userSession.lead_category,
                  onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
                };
                
                this.authService.updateCurrentUser(updatedUser);
                console.log('🔄 AuthService actualizado con el nuevo rol del usuario:', updatedUser);
                
                // 📊 Registrar evento de TikTok Ads solo para web (no apps nativas)
                if (!this.isNativePlatform && typeof ttq !== 'undefined') {
                  try {
                    ttq.track('Purchase', {
                      "contents": [
                        {
                          "content_id": membership._id,
                          "content_type": "membership",
                          "content_name": membership.membership_title || "Membership Plan"
                        }
                      ],
                      "value": purchaseValue,
                      "currency": membership.membership_currency || "USD"
                    });
                    console.log('📊 TikTok Ads: Purchase event enviado (In-App Purchase)', {
                      planId: membership._id,
                      planName: membership.membership_title,
                      value: purchaseValue,
                      currency: membership.membership_currency,
                      isTrial: isTrialPurchase
                    });
                  } catch (error) {
                    console.error('❌ Error al enviar evento de TikTok Ads:', error);
                  }
                }
                
                // Marcar pago como exitoso
                this.paymentSuccessful = true;
                
                // Mostrar alerta de éxito
                this.showAlertSuccess = true;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('❌ Error actualizando usuario:', err);
                this.handlePurchaseError('Error updating user profile');
              }
            });
          },
          error: (err) => {
            console.error('❌ Error registrando compra:', err);
            this.handlePurchaseError('Error registering purchase');
          }
        });
      } else {
        console.error('❌ Compra fallida:', result.error);
        this.handlePurchaseError(result.error);
      }
    } catch (error: any) {
      console.error('❌ Error en compra con In-App Purchase:', error);
      this.isLoadingMemberships = false;
      this.handlePurchaseError(error.message || error.toString());
    }
  }

  /**
   * 🆕 Maneja errores específicos de compra con mensajes apropiados
   */
  private handlePurchaseError(errorMessage: string) {
    console.log('🚨 Handling purchase error:', errorMessage);
    
    // Si el usuario canceló, no mostrar error
    if (errorMessage?.includes('cancelada') || 
        errorMessage?.includes('cancelled') ||
        errorMessage?.includes('cancel')) {
      console.log('👤 Usuario canceló la compra - no mostrar error');
      return;
    }
    
    // Determinar el tipo de error específico
    if (errorMessage?.includes('Producto no encontrado') || 
        errorMessage?.includes('not found') ||
        errorMessage?.includes('not available') ||
        errorMessage?.includes('under review') ||
        errorMessage?.includes('sandbox Apple ID')) {
      this.currentAlertType = 'product-not-found';
    } else if (errorMessage?.includes('connection') || 
               errorMessage?.includes('network') ||
               errorMessage?.includes('internet')) {
      this.currentAlertType = 'store-error';
    } else {
      this.currentAlertType = 'generic';
    }
    
    this.showAlertError = true;
    this.cdr.detectChanges();
  }

  /**
   * 🆕 Obtiene el título del alert según el tipo de error
   */
  getAlertTitle(): string {
    switch (this.currentAlertType) {
      case 'product-not-found':
        return this.translate.instant('alerts.iap.product-not-found.title');
      case 'store-error':
        return this.translate.instant('alerts.iap.store-error.title');
      default:
        return this.translate.instant('alerts.payment.error.title');
    }
  }

  /**
   * 🆕 Obtiene el mensaje del alert según el tipo de error
   */
  getAlertMessage(): string {
    switch (this.currentAlertType) {
      case 'product-not-found':
        return this.translate.instant('alerts.iap.product-not-found.message');
      case 'store-error':
        return this.translate.instant('alerts.iap.store-error.message');
      default:
        return this.translate.instant('alerts.payment.error.subtitle');
    }
  }

  /**
   * Abre el checkout de PayPal (solo web)
   */
  openCheckout(membership: any) {
    if (this.isNativePlatform) {
      console.warn('⚠️ openCheckout llamado en plataforma nativa, usando In-App Purchase en su lugar');
      this.purchaseWithInApp(membership);
      return;
    }
    
    this.membershipSelected = membership;
    this.currentStep = 'checkout'; // Cambiar al paso de checkout

    // Configurar PayPal
    this.payPalConfig = {
      currency: 'USD',
      clientId: environment.paypal.clientId,      
      createSubscriptionOnClient: (data) => <ICreateSubscriptionRequest>{
        plan_id: this.membershipSelected.membership_sub_id,
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      vault: "true",
      intent: "subscription",
      onApprove: (data, actions) => {
        console.log('onApprove - transaction was approved', data, actions);
        actions.subscription.get().then(details => {
          console.log('onApprove - subscription details: ', details);

          // Detectar si es trial: si el membership tiene trial_days > 0, el valor inicial es 0
          const isTrialSubscription = membership.membership_trial_days && membership.membership_trial_days > 0;
          const initialValue = isTrialSubscription ? '0' : membership.membership_price;
          
          console.log('📋 Creando purchased membership:', {
            membershipId: membership._id,
            hasTrial: isTrialSubscription,
            trialDays: membership.membership_trial_days,
            initialValue: initialValue,
            regularPrice: membership.membership_price
          });

          // Crear registro de membresía comprada
          this.api.create('purchasedMemberships/new', {
            order_id: data.orderID,
            subscription_id: data.subscriptionID,
            lead_id: this.userSession.id,
            payer_id: details.subscriber.payer_id,
            value: initialValue, // 0 si hay trial, precio regular si no hay trial
            membership_plan_id: membership._id,
            plan_id: details.plan_id,
            error: '',
            currency: membership.membership_currency,
            description: membership.membership_title,
            prod_id: membership.membership_prod_id,
            membership_status: (details.status || 'ACTIVE').toUpperCase(),
            recurring: membership.membership_recurring,
            source: 'paypal'
          }).subscribe(purchasedMembershipsResponse => {
            console.log('✅ Membership purchased:', purchasedMembershipsResponse);

            // Actualizar el usuario con el nuevo rol
            this.api.update('leads/' + this.userSession.id, {
              lead_role: membership.membership_role,
              lead_paypal_customer_id: details.subscriber.payer_id
            }).subscribe(res => {
              console.log('✅ User updated:', res);
              
              // Actualizar sesión local con ambas propiedades para compatibilidad
              this.userSession.lead_role = membership.membership_role;
              this.userSession.role = membership.membership_role; // Para AuthService
              this.userSession.lead_paypal_customer_id = details.subscriber.payer_id;
              
              // ✅ Mapear lead_onboarding_completed a onboarding_completed
              if (this.userSession.hasOwnProperty('lead_onboarding_completed')) {
                this.userSession.onboarding_completed = this.userSession.lead_onboarding_completed;
              } else if (!this.userSession.hasOwnProperty('onboarding_completed')) {
                // Si no existe ninguno, asumir completado (usuario existente)
                this.userSession.onboarding_completed = true;
                this.userSession.lead_onboarding_completed = true;
              }
              
              localStorage.setItem('userSession', JSON.stringify(this.userSession));
              
              // Actualizar AuthService con la estructura correcta de User
              const updatedUser: any = {
                id: this.userSession.id || this.userSession._id,
                email: this.userSession.email || this.userSession.lead_email,
                name: this.userSession.name || this.userSession.lead_name,
                role: membership.membership_role,
                company_id: this.userSession.company_id || this.userSession.lead_company_id,
                category: this.userSession.category || this.userSession.lead_category,
                onboarding_completed: this.userSession.lead_onboarding_completed !== false || this.userSession.onboarding_completed !== false
              };
              
              this.authService.updateCurrentUser(updatedUser);
              console.log('🔄 AuthService actualizado con el nuevo rol del usuario:', updatedUser);
              
              // 📊 Registrar evento de TikTok Ads solo para web (no apps nativas)
              if (!this.isNativePlatform && typeof ttq !== 'undefined') {
                try {
                  ttq.track('Purchase', {
                    "contents": [
                      {
                        "content_id": membership._id,
                        "content_type": "membership",
                        "content_name": membership.membership_title || "Membership Plan"
                      }
                    ],
                    "value": initialValue, // Usar initialValue en lugar de membership_price
                    "currency": membership.membership_currency || "USD"
                  });
                  console.log('📊 TikTok Ads: Purchase event enviado (PayPal)', {
                    planId: membership._id,
                    planName: membership.membership_title,
                    value: initialValue, // 0 si es trial, 20 si no
                    regularPrice: membership.membership_price,
                    currency: membership.membership_currency,
                    isTrial: isTrialSubscription
                  });
                } catch (error) {
                  console.error('❌ Error al enviar evento de TikTok Ads:', error);
                }
              }
              
              // Marcar pago como exitoso
              this.paymentSuccessful = true;
              
              // Mostrar alerta de éxito
              this.currentStep = 'plans'; // Volver al paso de planes
              this.showAlertSuccess = true;
              this.cdr.detectChanges();
            });
          });
        });
      },
      onCancel: (data, actions) => {
        console.log('OnCancel', data, actions);
        this.currentStep = 'plans'; // Volver al paso de planes
      },
      onError: err => {
        console.error('OnError', err);
        
        // Registrar transacción fallida
        this.api.create('transactions', {
          transaction_order: '',
          transaction_subscription_id: '',
          transaction_status: 'rejected',
          transaction_lead_id: this.userSession.id,
          transaction_payer_id: '',
          transaction_value: membership.membership_price,
          transaction_membership_plan_id: membership._id,
          transaction_plan_id: '',
          transaction_error: err.toString(),
          transaction_currency: membership.membership_currency,
          transaction_description: membership.membership_title,
        }).subscribe(() => {
          this.currentStep = 'plans'; // Volver al paso de planes
          this.showAlertError = true;
        });
      },
      onClick: (data, actions) => {
        console.log('onClick', data, actions);
      }
    };
  }

  backToPlans() {
    this.currentStep = 'plans';
    this.membershipSelected = null;
  }

  closeCheckout() {
    this.currentStep = 'plans';
    this.membershipSelected = null;
  }

  onSuccessPayment() {
    this.showAlertSuccess = false;
    
    // Marcar que el pago fue exitoso para evitar el webhook de trial declined
    this.paymentSuccessful = true;
    
    // Emitir el dismiss sin tracking de rechazo
    this.dismiss.emit();
    
    // Navegar a la página de trips después de comprar
    console.log('🎉 Navegando a /customer/trips después de compra exitosa');
    this.router.navigate(['/customer/trips']);
  }

  /**
   * Obtiene el precio formateado de In-App Purchase para un plan
   * Si no está disponible, retorna el precio por defecto del backend
   * Incluye el período (mensual o anual) traducido
   */
  getFormattedPrice(membership: any): string {
    let priceString = '';
    
    if (this.isNativePlatform && membership.membership_in_app_product_id) {
      const product = this.inAppProducts.find(
        p => p.id === membership.membership_in_app_product_id
      );
      if (product) {
        priceString = product.price;
      } else {
        // Fallback al precio del backend si el producto no se encuentra
        priceString = `$${membership.membership_price} ${membership.membership_currency}`;
      }
    } else {
      // Fallback al precio del backend para plataforma web
      priceString = `$${membership.membership_price} ${membership.membership_currency}`;
    }
    
    // Agregar el período según membership_recurring (traducido)
    const periodKey = membership.membership_recurring === 'year' 
      ? 'global.periods.per-year-short' 
      : 'global.periods.per-month-short';
    const period = this.translate.instant(periodKey);
    
    return `${priceString}${period}`;
  }

  /**
   * Envía webhook cuando el usuario rechaza el trial
   * @param action - Tipo de acción: 'maybe_later', 'close_button', 'modal_dismiss'
   */
  private sendTrialDeclined(action: 'maybe_later' | 'close_button' | 'modal_dismiss') {
    // NO enviar si el pago fue exitoso
    if (this.paymentSuccessful) {
      console.log('✅ Pago exitoso: no se envía webhook de trial declined');
      return;
    }
    
    // Solo enviar si el modal estuvo abierto (evitar duplicados)
    if (this.modalOpenTime === 0) {
      return;
    }

    const timeSpent = Math.floor((Date.now() - this.modalOpenTime) / 1000); // Segundos

    const payload = {
      lead_id: this.userSession?.id || null,
      action: action,
      viewed_plans: this.viewedPlans,
      time_spent_seconds: timeSpent,
      upload_limit_reached: this.uploadLimitData?.currentCount >= this.uploadLimitData?.maxAllowed,
      current_uploads: this.uploadLimitData?.currentCount || 0,
      max_uploads: this.uploadLimitData?.maxAllowed || 0,
      page: 'membership_modal',
      source: 'web'
    };

    console.log('📊 Enviando trial declined webhook:', payload);

    // Enviar al backend (no esperar respuesta para no bloquear el cierre)
    this.api.create('memberships/trial-declined', payload).subscribe({
      next: (res) => {
        console.log('✅ Trial declined webhook enviado:', res);
      },
      error: (err) => {
        console.error('❌ Error al enviar trial declined webhook:', err);
        // No hacer nada si falla, es solo tracking
      }
    });

    // Resetear contador para evitar envíos duplicados
    this.modalOpenTime = 0;
  }

  /**
   * Registra evento InitiateCheckout en TikTok Ads cuando se abre el modal de membresías
   * Solo se ejecuta en plataforma web (no apps nativas)
   */
  private trackInitiateCheckout() {
    // Solo ejecutar en web (no apps nativas)
    if (this.isNativePlatform) {
      console.log('📱 Plataforma nativa: no se envía evento InitiateCheckout a TikTok Ads');
      return;
    }

    // Verificar que TikTok Pixel esté disponible
    if (typeof ttq === 'undefined') {
      console.warn('⚠️ TikTok Pixel no disponible para InitiateCheckout');
      return;
    }

    try {
      // Si ya hay membresías cargadas, enviar evento con el primer plan
      if (this.membershipPlans && this.membershipPlans.length > 0) {
        const firstPlan = this.membershipPlans[0];
        
        ttq.track('InitiateCheckout', {
          "contents": [
            {
              "content_id": firstPlan._id,
              "content_type": "membership",
              "content_name": firstPlan.membership_title || "Membership Plan"
            }
          ],
          "value": firstPlan.membership_price || 0,
          "currency": firstPlan.membership_currency || "USD"
        });

        console.log('📊 TikTok Ads: InitiateCheckout event enviado', {
          planId: firstPlan._id,
          planName: firstPlan.membership_title,
          value: firstPlan.membership_price,
          currency: firstPlan.membership_currency
        });
      } else {
        // Si aún no hay planes cargados, enviar evento genérico
        ttq.track('InitiateCheckout', {
          "contents": [
            {
              "content_id": "membership_modal",
              "content_type": "membership",
              "content_name": "Membership Plans"
            }
          ],
          "value": 0,
          "currency": "USD"
        });

        console.log('📊 TikTok Ads: InitiateCheckout event enviado (genérico)');
      }
    } catch (error) {
      console.error('❌ Error al enviar InitiateCheckout a TikTok Ads:', error);
    }
  }
}
