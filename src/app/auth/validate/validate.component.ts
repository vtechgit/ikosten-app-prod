import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';


@Component({
  selector: 'app-validate',
  standalone:false,
  templateUrl: './validate.component.html',
  styleUrls: ['./validate.component.scss'],
})
export class ValidateComponent  implements OnInit {

  validating:boolean=true;
  error:boolean=false;
  success:boolean=false;
  validateForm:FormGroup;
  isLoading:boolean=false;
  showAlertSubmit
  alertButtons = ['Ok'];
  showAppleAlertLogin:boolean=false;

  constructor(
    public platform: Platform,
    private activatedRoute:ActivatedRoute,
    private api:ApiService,
    private router:Router
  ) { 
    
    this.activatedRoute.queryParams.subscribe(params=>{

      if(params['token']){
        
        this.api.create('leads/auth/validate-token',{token:params['token']}).subscribe(res=>{
          console.log('validate token',res);
          if(res['body']['status']){
            setTimeout(() => {
                this.validating=false;
                this.success=true;

            }, 2000);

          }else{
            this.validating=false;
            this.error=true;

          }
        })
      }else{
        this.validating=false;
        this.error=true;
      }
  
    })
  }

  ngOnInit() {
    this.validateForm = new FormGroup({
      validatePassword:new FormControl('', [
        Validators.required,
      ]),
      validateConfirmPassword:new FormControl('', [
        Validators.required,
      ]),
    });
  }
  backToLogin(){
    this.showAlertSubmit=false;
    this.router.navigate(['/auth/login']);

  }
  doChangePassword(){
        this.isLoading=true;
        this.validateForm.markAllAsTouched();
        if (this.validateForm.valid){
           var obj ={
            lead_password: this.password.value.toLowerCase(),
          }
          this.api.create('leads/update-password', obj).subscribe(res=>{
            console.log(res);
              this.isLoading=false;
              if(res['body']['status']){
                this.showAlertSubmit=true;
                this.password.patchValue('');
                this.confirmPassword.patchValue('');
                this.validateForm.markAsUntouched();
              }else{
                this.showAppleAlertLogin=true;
              }
          })
        }else{
          this.isLoading=false;
        }
  }
  get password() {
    return this.validateForm.get('validatePassword');
  }
  get confirmPassword() {
    return this.validateForm.get('validateConfirmPassword');
  }

}
