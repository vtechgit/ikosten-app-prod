import { Component, OnInit } from '@angular/core';
import { transition, style, animate, trigger } from '@angular/animations';
import {ApiService} from '../../services/api.service';
import { Output, EventEmitter } from '@angular/core';

const enterTransition = transition(':enter', [
  style({
    opacity: 0
  }),
  animate('0.1s 0.1s ease-in', style({
    opacity: 1
  }))
]);
const fadeIn = trigger('fadeIn', [
  enterTransition
]);

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
  animations: [
    fadeIn,
  ]
})
export class StarRatingComponent  implements OnInit {

  rating =0;
  comment:string='';
  userEmail:string='';
  @Output() sent = new EventEmitter<string>();

  constructor( private api:ApiService) { }

  ngOnInit() {



  }
  
  setRating(value:number){
    this.rating=value;
  }
  finishRating(){
    let objSettings = JSON.parse(sessionStorage.getItem('exportSettings'));
    let process_id =  sessionStorage.getItem('processId');

    if(objSettings['userEmail']){
      this.userEmail = objSettings['userEmail'];

    }

    this.api.create('ratings', {ratings_lead_email: this.userEmail, ratings_process:process_id ,ratings_score:this.rating, ratings_comment:this.comment }).subscribe(res=>{
      
      this.api.update('processes/'+process_id, {process_date_finished:Date.now()}).subscribe(res=>{
        this.sent.emit();

      })

    })

    
  }

}
