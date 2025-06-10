import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';
import { IonHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-login',
  standalone:false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent  implements OnInit {


  backParams:any;

  constructor(
    private activatedRoute: ActivatedRoute,
    public platform: Platform,
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
