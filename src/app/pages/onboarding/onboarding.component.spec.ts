import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OnboardingComponent } from './onboarding.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnboardingComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});