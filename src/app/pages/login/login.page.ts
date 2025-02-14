import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage implements OnInit {

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

    this.backParams = {
      back:back?back :'',
      trip:trip?trip :'',
      membership:membership?membership:'',
      step:step?step:''
    };




  }


}
