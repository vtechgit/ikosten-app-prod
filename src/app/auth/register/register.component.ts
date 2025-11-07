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
    
    // Capturar utm_lead desde URL y guardar en localStorage
    let utm_lead = this.activatedRoute.snapshot.queryParamMap.get('utm_lead');
    if(utm_lead && utm_lead != ''){
      localStorage.setItem('utm_lead', utm_lead);
      console.log('✅ utm_lead guardado desde register.component:', utm_lead);
    }

    // Capturar lead_source desde URL y guardar en localStorage
    let lead_source = this.activatedRoute.snapshot.queryParamMap.get('lead_source');
    if(lead_source && lead_source != ''){
      localStorage.setItem('lead_source', lead_source);
      console.log('✅ lead_source guardado desde register.component:', lead_source);
    }

    this.backParams = {
      back:back?back :'',
      trip:trip?trip :'',
      membership:membership?membership:'',
      step:step?step:''
    };
  }

}
