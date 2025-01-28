import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-memberships',
  templateUrl: './memberships.page.html',
  styleUrls: ['./memberships.page.scss'],
  standalone: false
})
export class MembershipsPage implements OnInit {

  showAlertPayment:boolean=false;
  constructor() { }

  ngOnInit() {
  }

}
