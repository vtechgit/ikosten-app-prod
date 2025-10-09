import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService, PaymentProduct } from '../../services/payment.service';
import { IPayPalConfig, ICreateSubscriptionRequest } from 'ngx-paypal';

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
  
  // Trial tracking
  modalOpenTime: number = 0;
  viewedPlans: string[] = [];
  
  // Alerts
  showAlertError: boolean = false;
  showAlertSuccess: boolean = false;
  
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
    this.isNativePlatform = this.platform.is('ios') || this.platform.is('android');
    console.log('💳 MembershipModal: Plataforma nativa:', this.isNativePlatform);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Cuando el modal se abre, cargar las membresías
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.modalOpenTime = Date.now(); // Registrar tiempo de apertura
      this.viewedPlans = []; // Resetear planes vistos
      this.currentStep = 'plans'; // Resetear al paso inicial
      this.membershipSelected = null; // Limpiar selección previa
      this.payPalConfig = undefined; // Limpiar configuración de PayPal
      this.loadMemberships();
      this.loadUserSession();
      this.translateWords(); // Traducir textos de botones
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
      this.showAlertError = true;
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
        
        // Registrar la compra en el backend
        this.api.create('purchasedMemberships/new', {
          order_id: result.transactionId,
          subscription_id: result.transactionId,
          lead_id: this.userSession.id,
          payer_id: this.userSession.id,
          value: membership.membership_price,
          membership_plan_id: membership._id,
          plan_id: membership.membership_in_app_product_id,
          error: '',
          currency: membership.membership_currency,
          description: membership.membership_title,
          prod_id: membership.membership_prod_id,
          membership_status: 'active',
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
                
                // Actualizar sesión local
                this.userSession.lead_role = membership.membership_role;
                this.userSession.role = membership.membership_role;
                localStorage.setItem('userSession', JSON.stringify(this.userSession));
                
                // Actualizar AuthService
                this.authService.updateCurrentUser(this.userSession);
                console.log('🔄 AuthService actualizado con el nuevo rol del usuario');
                
                // Mostrar alerta de éxito
                this.showAlertSuccess = true;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('❌ Error actualizando usuario:', err);
                this.showAlertError = true;
              }
            });
          },
          error: (err) => {
            console.error('❌ Error registrando compra:', err);
            this.showAlertError = true;
          }
        });
      } else {
        console.error('❌ Compra fallida:', result.error);
        
        // Si el usuario canceló, no mostrar error
        if (result.error && !result.error.includes('cancelada')) {
          this.showAlertError = true;
        }
      }
    } catch (error) {
      console.error('❌ Error en compra con In-App Purchase:', error);
      this.isLoadingMemberships = false;
      this.showAlertError = true;
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
      clientId: 'ASDX2c3inPc0fEtqcE4TIY_Kj6cXg3caX0pu5PuWJwcIacT0JhqXQO14LM5D0LNTkCrjqot2UGjmrCBa',      
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

          // Crear registro de membresía comprada
          this.api.create('purchasedMemberships/new', {
            order_id: data.orderID,
            subscription_id: data.subscriptionID,
            lead_id: this.userSession.id,
            payer_id: details.subscriber.payer_id,
            value: membership.membership_price,
            membership_plan_id: membership._id,
            plan_id: details.plan_id,
            error: '',
            currency: membership.membership_currency,
            description: membership.membership_title,
            prod_id: membership.membership_prod_id,
            membership_status: details.status,
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
              localStorage.setItem('userSession', JSON.stringify(this.userSession));
              
              // Actualizar el AuthService para que todos los componentes se enteren del cambio
              this.authService.updateCurrentUser(this.userSession);
              console.log('🔄 AuthService actualizado con el nuevo rol del usuario');
              
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
    this.closeModal();
    // Recargar la página para reflejar los cambios
    window.location.reload();
  }

  /**
   * Obtiene el precio formateado de In-App Purchase para un plan
   * Si no está disponible, retorna el precio por defecto del backend
   */
  getFormattedPrice(membership: any): string {
    if (this.isNativePlatform && membership.membership_in_app_product_id) {
      const product = this.inAppProducts.find(
        p => p.id === membership.membership_in_app_product_id
      );
      if (product) {
        return product.price;
      }
    }
    // Fallback al precio del backend
    return `$${membership.membership_price} ${membership.membership_currency}`;
  }

  /**
   * Envía webhook cuando el usuario rechaza el trial
   * @param action - Tipo de acción: 'maybe_later', 'close_button', 'modal_dismiss'
   */
  private sendTrialDeclined(action: 'maybe_later' | 'close_button' | 'modal_dismiss') {
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
}
