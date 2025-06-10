import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-slide',
  standalone: false,
  templateUrl: './slide.component.html',
  styleUrls: ['./slide.component.scss'],
})
export class SlideComponent  implements OnInit {

  appPages:any=[
    {
      status:true,
      route:"customer/trips",
      title:"menu.tabs.trips",
      icon:"airplane",

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
      title:"titles.modules.profile.language-title",
      icon:"language"
    }
  ];
  constructor() { }

  ngOnInit() {}

  closeSession(){
    localStorage.removeItem('userSession');
    sessionStorage.clear();
    window.location.href = '/';

  }

}
