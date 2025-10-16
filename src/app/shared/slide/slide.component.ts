import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-slide',
  standalone: false,
  templateUrl: './slide.component.html',
  styleUrls: ['./slide.component.scss'],
})
export class SlideComponent  implements OnInit, OnDestroy {

  appPages:any=[
    {
      status:true,
      route:"customer/trips",
      title:"menu.tabs.upload-receipts",
      icon:"receipt",

    },
    {
      status:true,
      route:"customer/export",
      title:"menu.tabs.export",
      icon:"download",

    },
    {
      status:true,
      route:"customer/profile",
      title:"menu.tabs.profile",
      icon:"person",
    },
    {
      status:true,
      route:"customer/language",
      title:"titles.modules.language.language-title",
      icon:"language"
    }
  ];

  userSession: any = null;
  showMembershipModal: boolean = false;
  uploadLimitData: any = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.loadUserData();
    this.subscribeToUserChanges();
  }

  ngOnDestroy() {
    // Limpiar la suscripción cuando el componente se destruya
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUserData() {
    this.userSession = this.api.getUserData();
    console.log('🔍 User session loaded in menu:', this.userSession);
  }

  subscribeToUserChanges() {
    // Suscribirse a los cambios del usuario en tiempo real
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userSession = user;
        console.log('🔄 Menu actualizado con nuevos datos del usuario:', this.userSession);
      }
    });
  }

  shouldShowUpgradeButton(): boolean {
    // Mostrar el botón si el usuario tiene role = 0 (o lead_role = 0 para compatibilidad)
    if (!this.userSession) return false;
    
    // Verificar tanto 'role' (nuevo) como 'lead_role' (legacy)
    const userRole = this.userSession.role ?? this.userSession.lead_role ?? 0;
    return userRole === 0;
  }

  openMembershipModal() {
    console.log('🔄 Abriendo modal de membresías desde el menú...');
    this.showMembershipModal = true;
  }

  closeMembershipModal() {
    this.showMembershipModal = false;
    this.uploadLimitData = null;
    // Recargar datos del usuario después de cerrar el modal
    this.refreshUserData();
  }

  onMembershipModalDismiss() {
    this.closeMembershipModal();
  }

  refreshUserData() {
    // Obtener datos actualizados del usuario desde el servidor
    const userId = this.userSession?.id || this.userSession?._id;
    if (userId) {
      console.log('🔄 Actualizando datos del usuario desde el servidor...');
      this.api.read(`leads/${userId}`).subscribe({
        next: (response: any) => {
          console.log('✅ Datos del usuario actualizados:', response);
          if (response && response.body) {
            const userData = response.body;
            // Mapear datos del backend al formato del AuthService
            const updatedUser = {
              id: userData._id || userData.id,
              email: userData.lead_email || userData.email,
              name: userData.lead_name || userData.name,
              role: userData.lead_role ?? userData.role ?? 0,
              company_id: userData.company_id,
              category: userData.category,
              onboarding_completed: userData.onboarding_completed
            };
            
            // Actualizar el usuario en el AuthService (esto disparará el Observable)
            this.authService.updateCurrentUser(updatedUser);
            
            // También actualizar userSession local con ambas estructuras
            this.userSession = {
              ...userData,
              role: updatedUser.role,
              lead_role: userData.lead_role
            };
          }
        },
        error: (error) => {
          console.error('❌ Error al actualizar datos del usuario:', error);
          // No es crítico, simplemente mantener los datos actuales
        }
      });
    }
  }

  closeSession(){
    this.authService.logout();
  }

}
