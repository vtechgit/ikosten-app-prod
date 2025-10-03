import { Component, Input, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-country-picker',
  templateUrl: './country-picker.component.html',
  styleUrls: ['./country-picker.component.scss'],
  standalone: false,
})
export class CountryPickerComponent  implements OnInit {

  @Input() isModalOpen: boolean;
  @Input() modalTitle: string;
  @Input() options: any;
  @Input() temp: any;
  @Input() type: string;
  @Output() optionSelected = new EventEmitter<string>();
  @Output() dismiss = new EventEmitter<boolean>();
  @Input() selectedOption:any;
  searchText:string = '';
  selected:any;

  constructor() { }

  ngOnInit() {
    if(this.type == 'country'){
      this.selected = this.selectedOption;
    }
    if(this.type == 'currency'){
      this.selected = this.selectedOption;
    }
    if(this.type == 'add_country'){
      this.selected = undefined;

    }
    this.temp=this.options;
  }

  selectOption(option){
    if(this.type == 'country'){
      this.selected = {country:option.country,code:option.code};
    }
    if(this.type == 'currency'){
      this.selected = option.code;

    }
    if(this.type == 'add_country'){
      this.selected = {country:option.country,code:option.code};

    }
    
  }
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }
  search(event){

    const val = event.target.value.toLowerCase();

    this.options = this.temp.filter(function (d) {

      return d.country.toLowerCase().indexOf(val) !== -1 ||
       d.code.toLowerCase().indexOf(val) !== -1 ||
       d.country_code.toLowerCase().indexOf(val) !== -1 ||
       d.currency_name.toLowerCase().indexOf(val) !== -1 || !val;

    });

  }
  confirmOptionSelected(){
    this.optionSelected.emit(this.selected);
    this.isModalOpen=false;
  }
  onWillDismiss(){
    this.searchText ='';
    this.selectedOption = undefined;
    this.selected = undefined;

    this.dismiss.emit(false);
  }

}
