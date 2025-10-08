import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
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
  
  // PayPal checkout
  currentStep: 'plans' | 'checkout' = 'plans'; // Control de pasos
  membershipSelected: any = null;
  payPalConfig?: IPayPalConfig;
  userSession: any;
  
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
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

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
      },
      error: (err) => {
        console.error('❌ Error cargando membresías:', err);
        this.membershipPlans = [];
        this.isLoadingMemberships = false;
      }
    });
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

    // Abrir el checkout de PayPal
    this.openCheckout(selectedPlan);
  }

  openCheckout(membership: any) {
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
