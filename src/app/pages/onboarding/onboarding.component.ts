import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  standalone: false
})
export class OnboardingComponent implements OnInit {

  selectedCategory: 'travel' | 'finance' | null = null;
  isLoading: boolean = false;
  currentUser: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Verificar que el usuario esté autenticado
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  selectCategory(category: 'travel' | 'finance') {
    this.selectedCategory = category;
  }

  async continueOnboarding() {
    if (!this.selectedCategory) {
      await this.showErrorToast('Por favor selecciona una opción para continuar');
      return;
    }

    this.isLoading = true;

    try {
      // Preparar datos de actualización
      const updateData: any = {
        lead_category: this.selectedCategory,
        lead_onboarding_completed: true
      };

      this.apiService.update(`leads/${this.currentUser.id}`, updateData).subscribe({
        next: async (response) => {
          // Actualizar datos del usuario en el AuthService
          const updatedUser = {
            ...this.currentUser,
            category: this.selectedCategory,
            onboarding_completed: true
          };
          
          this.authService.updateCurrentUser(updatedUser);
          
          await this.showSuccessToast('¡Perfil configurado exitosamente!');
          
          // Navegar a trips
          this.router.navigate(['/customer/trips']);
        },
        error: async (error) => {
          this.isLoading = false;
          await this.showErrorToast('Error al configurar tu perfil. Inténtalo de nuevo.');
        }
      });

    } catch (error) {
      this.isLoading = false;
      await this.showErrorToast('Error inesperado. Inténtalo de nuevo.');
    }
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle'
    });
    await toast.present();
  }
}