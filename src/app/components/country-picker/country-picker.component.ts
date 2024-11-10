import { Component, Input, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-country-picker',
  templateUrl: './country-picker.component.html',
  styleUrls: ['./country-picker.component.scss'],
})
export class CountryPickerComponent  implements OnInit {

  @Input() isModalOpen: boolean;
  @Input() modalTitle: string;
  @Input() options: any;
  @Input() type: string;
  @Output() optionSelected = new EventEmitter<string>();
  @Output() dismiss = new EventEmitter<boolean>();
  @Input() selectedOption:any;
  searchText:string = '';

  constructor() { }

  ngOnInit() {
  }

  selectOption(option){
    if(this.type == 'country'){
      this.selectedOption = {country:option.country,code:option.code};
    }
    if(this.type == 'currency'){
      this.selectedOption = option.code;

    }
    
  }
  search(event){
    const query = event.target.value.toLowerCase();
    this.searchText = query;

  }
  confirmOptionSelected(){
    this.optionSelected.emit(this.selectedOption);
    this.isModalOpen=false;
  }
  onWillDismiss(){
    this.dismiss.emit(false);
  }

}
