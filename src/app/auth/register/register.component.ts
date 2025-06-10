import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-register',
  standalone:false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent  implements OnInit {

  backParams:any;

  constructor(
    public platform:Platform,
    private activatedRoute: ActivatedRoute,
    
  ) { }

  ngOnInit() {
    let back = this.activatedRoute.snapshot.queryParamMap.get('back');
    let trip = this.activatedRoute.snapshot.queryParamMap.get('trip');
    let membership = this.activatedRoute.snapshot.queryParamMap.get('membership');
    let step = this.activatedRoute.snapshot.queryParamMap.get('step');
    let utm_lead = this.activatedRoute.snapshot.queryParamMap.get('utm_lead');
    if(utm_lead && utm_lead != ''){
      localStorage.setItem('utm_lead', utm_lead);
    }
    this.backParams = {
      back:back?back :'',
      trip:trip?trip :'',
      membership:membership?membership:'',
      step:step?step:''
    };
  }

}
