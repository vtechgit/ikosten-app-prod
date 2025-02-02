import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {

  indexTab:Number=1;
  isLoginOpened:boolean=false;
  userLogged:boolean=false;
  userSession:any;

  constructor(
    private router:Router,
    private route :ActivatedRoute,

  ) {}

  ngOnInit(){
    this.validateUserLogged();
    let lastSegment = this.router.url.substring(this.router.url.lastIndexOf('/')+1);
    console.log(lastSegment)
    if(lastSegment == 'trips'){
      this.changeIndexTab(1);
    }
    if(lastSegment == 'profile'){
      this.changeIndexTab(2);
    }
    if(lastSegment == 'login'){
      this.changeIndexTab(3);
    }
    if(lastSegment == 'language'){
      this.changeIndexTab(4);
    }
    if(lastSegment == 'memberships'){
      this.changeIndexTab(5);
    }

  }

  validateUserLogged(){
   if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' && localStorage.getItem('userSession') != null){
    this.userSession = JSON.parse(localStorage.getItem('userSession'));
    this.userLogged=true;
   }else{
    this.userLogged=false;
   } 
  }
  openLanguage(){
    this.router.navigate(['/language']);

  }
  openLogin(){
    this.router.navigate(['/login']);
  }
  changeIndexTab(index){
    this.indexTab =index;
  }

  closeLogin(){
    this.isLoginOpened=false;
  }

}
