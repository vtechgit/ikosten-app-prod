import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { transition, style, animate, trigger } from '@angular/animations';
import {ApiService} from '../../services/api.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { marker as _ } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '@capacitor/device';

const enterTransition = transition(':enter', [
  style({
    opacity: 0
  }),
  animate('0.2s 0.1s ease-in', style({
    opacity: 1
  }))
]);
const fadeIn = trigger('fadeIn', [
  enterTransition
]);


@Component({
  selector: 'app-main',
  standalone:false,
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  animations: [
    fadeIn,
  ]
})
export class MainPage implements OnInit {
  alertButtons = ['buttons.accept'];

  public deleteExtractAlertButtons = [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteExtract()
      },
    },
  ];
  public alertRestartButtons= [
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.confirm',
      role: 'confirm',
      handler: () => {
        this.confirmRestartProcess()
      },
    },
  ];
  public deleteLineAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteLine()
      },
    },
  ];
  public deleteAllNotMatchedAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteAllNotMatchedLines()
      },
    },
  ];
  public deleteBillAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBill()
      },
    },
  ];
  public deleteAllAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.delete',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBillAll()
      },
    },
  ];
  public goBackAlertButtons =[
    {
      text: 'buttons.cancel',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'buttons.confirm',
      role: 'confirm',
      handler: () => {
        this.confirmGoBack()
      },
    },
  ];
  currentStep=0;
  loadingButtons:boolean=false;
  extracts:any;
  notUploaded:any = [];
  uploadedBill:string;
  results:any;
  userEmail:string='';
  userName:string='';
  openModalMemberships:boolean=false;
  isUploading:boolean=false;
  uploadMessage:string="Subir archivo";

  uploadedExtractName:string;
  currentExtract:number=0;
  currentBill:number=0;

  isAlertDeleteExtract:boolean=false;
  idToDelete:number=0;
  openModalAddBill:boolean=false;
  isAlertDeleteBill:boolean=false;
  isAlertDeleteAll:boolean=false;
  idToDeleteBill:number=0;
  idToDeleteBillContainer:number=0;
  documentIdToDelete:string;
  isSettingBill:boolean=false;
  exportSettings:any;
  sendPdf:boolean;
  sendExcel:boolean;
  sendingForm:boolean=false;

  currencies:any;
  isEdditingLine:boolean=false;

  selectedLine:any;
  selectedDeleteLine:any;
  docToDelete:string;
  isDeletingLine:boolean=false;
  isDeletingAllNotMatched:boolean=false;

  linesDescription:string;
  linesBill:number;
  linesExtract:number;
  linesCurrency:string;

  showAlertRestart:boolean=false;
  showAlertFounds:boolean=false;
  showAlertFoundsMatched:boolean=false;
  foundsQty:number=0;
  imagesToUpload:any=[];

  currencyExchange:string;
  showAlertTime:boolean=false;
  isUploadingOther:boolean=true;

  uploadLineResultId:number;
  uploadLineExtractId:number;
  currencyBlockSelected:string;


  matchedBills:any;
  notMatched:any;
  showResults:boolean=false;
  notmatchedExtractLines:any;


  isAlertGoBack:boolean=false;

  editLineDate:string;
  editLineTime:string;
  editLineDescription:string;
  editLineBill:string;
  editLineCurrency:string;
  editLineReceipt:any;
  editLineExtract:any;
  editLineDocId:string;
  editLineReason:string;


  toggleDate:boolean=false;
  toggleTime:boolean=false;

  imageMimes = [ "image/png", "image/jpeg", ];
  pdfMimes = ["application/pdf"];

  toggleDatesExtracts:any;
  showPicker:boolean = false;
  pickerTitle:string = '';
  pickerType:string = '';
  pickerOptions:any=[];

  billAccOpened:number = 0;
  checkResults:boolean=false;

  modalHelp:boolean=false;

  userSession:any;
  travels:any;
  openModalAddTravel:boolean=false;

  todayDate:string;

  travelSelected:any;
  showAlertLogin:boolean=false;
  showAlert24Hours:boolean=false;

  showAlertResend:boolean=false;

  dateLocale:string ='en-US';
  limitations:any;
  showModalUpgrade:boolean=false;

  constructor(
    private api:ApiService,
    private http: HttpClient,
    private _sanitizer: DomSanitizer,
    private changeDetector:ChangeDetectorRef,
    private router:Router,
    private translate: TranslateService
  ) { }

  ngOnInit() {

    let today = new Date();
    this.todayDate = today.getFullYear()+"-"+this.addZero(today.getMonth()+1)+"-"+this.addZero(today.getDate())+"T00:00";
    this.hidrate();
    this.getCurrencies();

    this.translate.get(_('buttons.accept')).subscribe((text: string) => {
      this.alertButtons[0]=text;
    });
    this.translate.get(_('buttons.delete')).subscribe((text: string) => {
      this.deleteExtractAlertButtons[1].text =text;
      this.deleteLineAlertButtons[1].text = text;
      this.deleteAllNotMatchedAlertButtons[1].text = text;
      this.deleteBillAlertButtons[1].text = text;
      this.deleteAllAlertButtons[1].text = text;

      
    });
    this.translate.get(_('buttons.cancel')).subscribe((text: string) => {
      this.deleteExtractAlertButtons[0].text =text;
      this.alertRestartButtons[0].text = text;
      this.deleteLineAlertButtons[0].text = text;
      this.deleteAllNotMatchedAlertButtons[0].text = text;
      this.deleteBillAlertButtons[0].text = text;
      this.deleteAllAlertButtons[0].text = text;
      this.goBackAlertButtons[0].text = text;
    });
    this.translate.get(_('buttons.confirm')).subscribe((text: string) => {
      this.alertRestartButtons[1].text = text;
      this.goBackAlertButtons[1].text = text;
      

    });

    
  }


  hidrate(){

    if(localStorage.getItem('userSession') && localStorage.getItem('userSession') != ''){

      this.userSession = JSON.parse(localStorage.getItem('userSession'));

      this.api.read('processes/list/'+this.userSession._id).subscribe(res=>{
        //console.log('processes',res);
        this.travels = res['body'];
      })
      this.api.read('leads/'+this.userSession._id).subscribe(res=>{

        if(res['body']['lead_email'] && res['body']['lead_email'] != ''){

          this.userEmail = res['body']['lead_email'];

        }
        if(res['body']['lead_name'] && res['body']['lead_name'] != ''){

          this.userName = res['body']['lead_name'];

        }
      })

    }else{

      if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){

        this.travels = JSON.parse(sessionStorage.getItem('travels'));

      }else{
        this.travels = [];
      }

    }

    //console.log(this.travels);

    if(this.countBills() > 0){
      this.isUploadingOther=false;
    }else{
      this.isUploadingOther=true;

    }
    //console.log('extracts',this.extracts)
  }
  ionViewWillEnter(){
    if(localStorage.getItem('langIntl') && localStorage.getItem('langIntl') != '' && localStorage.getItem('langIntl') != null){
      
      this.dateLocale=localStorage.getItem('langIntl');
    }else{
  
    }
  }

  openLogin(){
    this.showAlertLogin=false;
    setTimeout(() => {
    this.router.navigate(['/login']);
      
    }, 500);
  }
  listProcesses(){
    if(this.userSession){
      this.api.read('processes/list/'+this.userSession._id).subscribe(res=>{
        this.travels = res['body'];
      })
    }else{
      if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){

        this.travels = JSON.parse(sessionStorage.getItem('travels'));

      }else{
        this.travels = [];
      }
    }

  }
  scrollToTarget(target){
    setTimeout(() => {

      if(document.getElementById(target)){
        document.getElementById(target).scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      }


   // console.log('scrolling');
      
    }, 500);
  }
  showModalPicker(modaTitle, type){
    this.pickerTitle = modaTitle;
    this.showPicker = true;
    this.pickerType = type;
    this.pickerOptions = this.currencies;
  }
  pickerDismissed(){
    this.showPicker = false;
    

    


  }
  validateCountriesLimitations(){
    return new Promise ((resolve,rejected)=>{
      var user_id;
    
      if(this.userSession){
        user_id= this.userSession._id;
        this.api.read('limitations/validateCountries/'+this.userSession._id).subscribe(res=>{
          console.log('res limitations', res);
          if(res['body']['result']){
            resolve(true);
          }else{
            resolve(false);
          }
    
        })
  
      }else{

        
      }
    })




  }
  pickerOptionSelected(event){
    if(this.pickerType == 'country'){

      this.currencyBlockSelected = event;
      this.scrollToTarget('card-step-2');

      /*
      this.validateCountriesLimitations().then(res=>{
        if(res){
          this.currencyBlockSelected = event;
          this.scrollToTarget('card-step-2');
        }else{
          this.showModalUpgrade=true;
          this.currencyBlockSelected=undefined;
        }
      })*/

      /*
      if(this.travelSelected.process_data.bills.length >= this.limitations.limitations_country_x_travel){


        var founds = 0;
        this.travelSelected.process_data.bills.forEach(bill => {


          if(bill.country == event.country){
            founds ++;
          }
        });


        if(founds == 0){
          this.showModalUpgrade=true;
          this.currencyBlockSelected=undefined;
        }else{
          this.currencyBlockSelected = event;
          this.scrollToTarget('card-step-2');
        }
        

      }else{

        this.currencyBlockSelected = event;
        this.scrollToTarget('card-step-2');
      }
        */
      


      
    }
    if(this.pickerType == 'currency'){
      this.extracts['extract']['currency'] = event;
      this.scrollToTarget('card-step-4');

    }

  }
  cancelUploading(){
    this.isUploadingOther = false;
    this.imagesToUpload = [];
    this.currencyBlockSelected=undefined;

  }
  deleteImageToUpload(i){
    this.imagesToUpload.splice(i,1);
  }
  addZero(value){

    return ("0"+value).slice(-2);

  }
  getCurrencies(){
    this.api.read('countries').subscribe(res=>{
      if(res['status'] == 200){
        this.currencies=res['body'];
        /*
        console.log('currencies', this.currencies);

        var jsonObj="";

        this.currencies.forEach(element => {
          let string = element.country.replace(/ /g, '-').toLowerCase();
          string = string.replace(/,/g, '');
          string = string.replace(/\./g, "");
          string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          let objString = '"countries.'+string+'":"'+element.country+'",';
          jsonObj = jsonObj +objString;

        });
        console.log(jsonObj);
        */
      }
    })
  }
  convertKey(input){
    let string = input.replace(/ /g, '-').toLowerCase();
    string = string.replace(/,/g, '');
    string = string.replace(/\./g, "");
    string = string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return 'countries.'+string;
  }
  openTravel(travel){
    this.travelSelected = travel;

    this.currentStep = this.travelSelected['process_step'];
    this.extracts={bills:[],extract:{ type:'', currency:''}};
    this.currencyBlockSelected = travel.process_country;

    if(this.travelSelected['process_data']){

      this.extracts = this.travelSelected['process_data'];

    }else{

      this.extracts={bills:[],extract:{ type:'', currency:''}};
      
    }
    if(this.travelSelected['process_result']){

      this.results = this.travelSelected['process_result'];
    }

    if(this.travelSelected['process_settings']){

      if(this.travelSelected['process_settings']['sendPdf']){

        this.sendPdf = this.travelSelected['process_settings']['sendPdf'];

      }
      if(this.travelSelected['process_settings']['sendExcel']){

        this.sendExcel = this.travelSelected['process_settings']['sendExcel'];

      }
    }

    if(this.extracts.bills.length > 0){
      this.isUploadingOther=false;
    }else{
      this.isUploadingOther = true;

    }

    let date = new Date(this.travelSelected['last_uploaded_bill_date']);
    let today = new Date();
    var diff = Math.abs(today.getTime() - date.getTime()) / 3600000;
    if(diff > 24){
      this.showAlert24Hours=true;
    }



  }
  updateTravel(){

    this.travelSelected['process_data']= this.extracts;

    if(this.results){
     // console.log('yes results')

      this.travelSelected['process_result'] = this.results;
    }else{
      //console.log('no results')
      this.travelSelected['process_result'] = undefined;
    }
    
    
    
    this.travels.forEach((element,index) => {

      if(element._id == this.travelSelected._id){
        this.travels[index] = this.travelSelected;
      }

    });
   // console.log(this.travelSelected);
    if(this.userSession){
      this.api.update('processes/'+this.travelSelected._id,this.travelSelected).subscribe(res=>{
        //console.log('update process', res);
      })
    }else{
        sessionStorage.setItem('travels', JSON.stringify(this.travels));
    }

  }

  addTravel(){

    /*
    this.validateCountriesLimitations().then(res=>{
      if(res){
        this.openModalAddTravel =true;

      }else{
        this.showModalUpgrade=true;
      }
    })*/
    
    
    this.openModalAddTravel =true;
    
  }
  createProcess(){
    this.loadingButtons=true;
    let startDate = this.todayDate.split('T')[0];
    let processSettings = {
      sendPdf:false,
      sendExcel:false
    }


    let req = {
      process_lead: this.userSession ? this.userSession._id : undefined,
      process_start_date :startDate,
      process_country: this.currencyBlockSelected,
      process_step:1,
      process_settings:processSettings
    };
    this.api.create('processes',req).subscribe(res=>{
      if(res['status'] == 201){

        this.openModalAddTravel = false;
        this.listProcesses();

        if(!this.userSession){
          if(sessionStorage.getItem('travels') && sessionStorage.getItem('travels') != '' && sessionStorage.getItem('travels') != null){

            this.travels = JSON.parse(sessionStorage.getItem('travels'));
            this.travels.push(res['body']);
            
    
          }else{
            this.travels = [];
            this.travels.push(res['body']);

          }
          sessionStorage.setItem('travels', JSON.stringify(this.travels));

        }

      }
      this.loadingButtons=false;

    })



  }
  countBills(){
    if(this.extracts && this.extracts['bills']){
      return this.extracts['bills'].length;

    }else{
      return 0;
    }
  }
  nextStep(){
    //console.log(this.results);
    if(this.currentStep == 1 ){
      this.currentStep ++;
      this.travelSelected['process_step']= this.currentStep;
      this.travelSelected['process_status']=1;
      this.updateTravel();
      if(!this.userSession){
      
        this.showAlertLogin = true;
      }

    }else if(this.currentStep == 2){
      this.currentStep ++;

      this.getAnalisysResult().then(res=>{

        if(this.countNotMatched() <= 0){
         this.currentStep ++;


        }
        this.travelSelected['process_step']= this.currentStep;
        this.updateTravel();

     });
     this.travelSelected['process_step']= this.currentStep;
     this.updateTravel();
    }else{
      this.currentStep++;

      this.travelSelected['process_step']= this.currentStep;
      this.updateTravel();
    }




  }
  finishProcess(event){

    this.api.create('ratings', {ratings_lead_email: this.userEmail, ratings_process:this.travelSelected._id ,ratings_score:event['score'], ratings_comment:event['comment'] }).subscribe(res=>{
      
      this.api.update('processes/'+this.travelSelected._id, {process_date_finished:Date.now()}).subscribe(res=>{

        this.travelSelected['process_status']=2;
        this.updateTravel();
        this.extracts=[];
    
        this.results=undefined;
    
        this.exportSettings=undefined;
    
        this.currentExtract=0;
        this.currentBill=0;
        this.sendPdf=undefined;
        this.sendExcel=undefined;
        this.checkResults=false;
        this.currentStep = 0;
      })

    })
    



    

  }
  countNotMatched(){
    let founds =0;

    if(this.results){
      this.results['notMatched'].forEach(element => {

        founds = founds + element['bill'].length;
      });
    }


    return founds;

  }
  countMatched(){
    let founds =0;
    
    if(this.results && this.results['matchedBills']){
      this.results['matchedBills'].forEach(element => {

        founds = founds + element['bill'].length;
      });
    }


    return founds;
  }
  getAnalisysResult(){

    return new Promise((resolve,rejected)=>{
      if(!this.travelSelected['process_result']){

        this.api.create('processes/getResult', this.extracts).subscribe(res=>{

          if(!res['error']){
            let obj= {
              matchedBills:res['body']['matchedExtracts'],
              notMatched:res['body']['notMatched'],
              notmatchedExtractLines:res['body']['notMatchedExtractLines'],
              startDate:res['body']['startDate'],
              endDate:res['body']['endDate']
            }
            this.results=obj;
    
            this.updateTravel();
            resolve(true);
    
          }
     
    
        })
  
      }else{
        console.log('entra a else')
        this.results = this.travelSelected['process_result'];
        resolve(true);
      }
    })



      
  }
  confirmGoBack(){
    this.backStep();
  }
  backStep(){
    this.isSettingBill=false;
    if(this.currentStep == 3){

      this.results=undefined;
      this.checkResults=false;

    }

    if(this.currentStep == 1){
      this.isUploadingOther=false;

    }
    this.currentStep--;
    if(this.currentStep == 3){
      if(this.countNotMatched() <= 0){
        this.currentStep --;
        this.results=undefined;
        this.checkResults=false;

       }
    }
    if(this.currentStep > 0){
      this.travelSelected['process_step']= this.currentStep;
      this.updateTravel();
    }

  }
  addExtract(){
    this.extracts.push({
      fileName:"Bancolombia_16-04-2024.pdf",
      uploadedDate:"16/04/2023",
      id:1
    })
  }
  changeDateBill(){

  }
  exportResult(){
    this.currentStep++;
    this.travelSelected['process_step']= this.currentStep;

    this.updateTravel();

  }
  dismissAlertFounds(){
    this.showAlertFounds=false;
  }
  dismissAlertFoundsNotMatched(){
    this.showAlertFoundsMatched=false;
  }
  dismissAlertRestart(){
    this.showAlertRestart=false;
  }
  takePhoto(){

    Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    }).then((imageData) => {

      // imageData is either a base64 encoded string or a file URI
      // If it's base64 (DATA_URL):
      this.imagesToUpload.push(imageData);

      

     }, (err) => {
      // Handle error
        //console.log(err)
     });
  }
  deleteBillFromResult(docId){
    
  }
  updateOrCreateLead(obj){
    return new Promise ((resolve,reject)=>{
      if(this.userSession){
        this.api.update('leads/'+this.userSession._id,obj).subscribe(res=>{
          //console.log('update lead', res);
          resolve(res);
        })
      }else{
        this.api.create('leads', obj).subscribe(res=>{
          //console.log('create lead', res);

          resolve(res);
        });
      }

    })
  }

  ionResult(){
    this.sendingForm=true; 

    let exportSettings ={
      userName:this.userName,
      userEmail:this.userEmail,
      sendPdf:this.sendPdf,
      sendExcel:this.sendExcel

    }


   let obj = {
    lead_name:this.userName,
    lead_email: this.userEmail.toLowerCase(),
    process_id: this.travelSelected._id
  }
   this.updateOrCreateLead(obj).then(()=>{
    if(this.countNotMatched() > 0 ){
    
      if(this.results.matchedBills.length > 0){
        this.results.matchedBills.forEach( (matched,index) => {

          this.results.notMatched.forEach(notMatched => {
  
            if(matched.currency && matched.currency == notMatched.currency && notMatched.bill && notMatched.bill.length > 0){
  
              this.results.matchedBills[index].bill = this.results.matchedBills[index].bill.concat(notMatched.bill);
  
            }
  
          });
  
        });
      }else{
        this.results.matchedBills = this.results.notMatched;
      }


      //this.results.matchedBills = this.results.matchedBills.concat(this.results.notMatched);

    }

    let objSendResult = {
      results: this.results,
      exportSettings : exportSettings,
      userName : this.userName,
      userEmail : this.userEmail,
    }
    
    this.api.create('processes/sendResult',objSendResult).subscribe(res=>{
      if(res['body'] == 202){

        this.showAlertResend = true;
        this.currentStep = 0;
        this.router.navigate(['./customer/trips'],{queryParams:{lead:true}});

      }
      this.sendingForm=false; 
    })
   })


  }
  sendResult(){
    this.sendingForm=true; 


    let exportSettings ={
      userName:this.userName,
      userEmail:this.userEmail,
      sendPdf:this.sendPdf,
      sendExcel:this.sendExcel

    }


   let obj = {
    lead_name:this.userName,
    lead_email: this.userEmail.toLowerCase(),
    process_id: this.travelSelected._id
  }
   this.updateOrCreateLead(obj).then(()=>{

    var resultToSend = this.results;

    if(this.countNotMatched() > 0 ){
    
      if(resultToSend.matchedBills.length > 0){

        resultToSend.matchedBills.forEach( (matched,index) => {

          resultToSend.notMatched.forEach(notMatched => {
  
            if(matched.currency && matched.currency == notMatched.currency && notMatched.bill && notMatched.bill.length > 0){
  
          
              resultToSend.matchedBills[index].bill = resultToSend.matchedBills[index].bill.concat(notMatched.bill);
  
            }
  
          });
  
        });
      }else{
        resultToSend.matchedBills = resultToSend.notMatched;
      }



    }

    this.getlanguage().then(res=>{
      var lang = res;
      let objSendResult = {
        results: resultToSend,
        exportSettings : exportSettings,
        userName : this.userName,
        userEmail : this.userEmail,
        lang: lang
      }
      //console.log(objSendResult);
      this.api.create('processes/sendResult',objSendResult).subscribe(res=>{
        if(res['body'] == 202){
          this.currentStep ++;
          this.travelSelected['process_step']= this.currentStep;
  
          this.updateTravel();
  
          this.router.navigate(['./customer/trips'],{queryParams:{lead:true}});
  
        }
        this.sendingForm=false; 
      })

    })


      
   })


  }

  getlanguage(){
    return new Promise((resolve,rejected)=>{

      if(localStorage.getItem('lang') && localStorage.getItem('lang') != '' && localStorage.getItem('lang') != null){
        resolve(localStorage.getItem('lang'));
  
      }else{
        Device.getLanguageCode().then(res=>{
          resolve(res.value);

        });
      }

    })
  }
  showMemberships(){
    this.openModalMemberships=true;
  }
  showCheckout(){}
  jumpToStep(step:number){
    this.currentStep=step;
    this.travelSelected['process_step']= this.currentStep;

    this.updateTravel();
  }
  flushData(){
    this.jumpToStep(0);
  }
  onWillDismiss(){
    this.openModalMemberships=false;
  }
  onWillDismissEditLine(){
    this.isEdditingLine=false;
    this.selectedLine=undefined;
  }
  onWillDismissModalHelp(){
    this.modalHelp=false;
  }
  dismissDeleteAllNotMatched(){
    this.isDeletingAllNotMatched=false;
  }
  changeExportSettings(){


    this.travelSelected['process_settings']['sendPdf'] = this.sendPdf ? true : false;
    this.travelSelected['process_settings']['sendExcel'] = this.sendExcel? true : false;

    this.updateTravel();


  }
  skipRevision(){
    this.nextStep();
    this.modalHelp=false;
  }
  showModalAddBill(){
    this.openModalAddBill=true;
    this.currentBill = this.extracts[this.currentExtract]['bills'].length;
    this.uploadedBill='';
    //console.log(this.currentBill);
  }
  onWillDismissAddBill(){
    this.openModalAddBill=false;
    this.uploadedBill="";
  }
  onWillDismissAddTravel(){
    this.openModalAddTravel =false;
    this.currencyBlockSelected = undefined;
  }
  onFileDropped($event,type){
    this.uploadFile($event,type);
  }
  deleteExtract(id, document_id){
    this.isAlertDeleteExtract=true;
    this.idToDelete = id;
    this.documentIdToDelete = document_id;
    //console.log(this.extracts['extract']);
    //console.log('delete document id', this.documentIdToDelete);


  }
  deleteBill(iBill,id, document_id){


    this.isAlertDeleteBill=true;
    this.idToDeleteBill =id;
    this.documentIdToDelete = document_id;
    this.idToDeleteBillContainer =iBill;
    //console.log('delete document id', this.documentIdToDelete);

  }
  deleteAllReceiptsAlert(){
    this.isAlertDeleteAll = true;
  }
  dismissDeleteExtract(){
    this.isAlertDeleteExtract=false;
  }
  dismissDeleteLine(){
    this.isDeletingLine=false;
    this.selectedDeleteLine=undefined;
  }
  openAddBill(){
    this.openModalAddBill=true;
    this.uploadedBill='';
  }
  dismissDeleteBill(){
    this.isAlertDeleteBill=false;
    this.idToDeleteBill=0;
    this.idToDeleteBillContainer=0;

  }
  dismissDeleteAll(){
    this.isAlertDeleteAll=false;

  }
  finishSettingBill(){
    this.isSettingBill = false;
    this.currentBill = this.extracts[this.currentExtract]['bills'].length;
    this.openModalAddBill=false;

   
  }
  confirmDeleteExtract(){
  

    delete this.extracts['extract']['file'];
    delete this.extracts['extract']['status'];
    delete this.extracts['extract']['lines'];
    delete this.extracts['extract']['bankName'];
    delete this.extracts['extract']['blobName'];
    delete this.extracts['extract']['document_id'];
    delete this.extracts['extract']['endDate'];
    delete this.extracts['extract']['file_url'];
    delete this.extracts['extract']['mimeType'];
    delete this.extracts['extract']['startDate'];


    this.updateTravel();
    this.api.update('documents/'+ this.documentIdToDelete,{deleted:true}).subscribe(res=>{
     // console.log(res);
    })
    this.isAlertDeleteExtract=false;

  }
  confirmDeleteBill(){
    
    
    this.extracts['bills'][this.idToDeleteBillContainer]['bill'].splice(this.idToDeleteBill, 1);


    if(this.extracts['bills'][this.idToDeleteBillContainer]['bill'].length <=0){

      this.extracts['bills'].splice(this.idToDeleteBillContainer,1);

    }
    this.updateTravel();

    this.api.update('documents/'+ this.documentIdToDelete,{deleted:true}).subscribe(res=>{
     // console.log(res);
    })
    
    this.isAlertDeleteBill=false;
    

  }
  confirmDeleteBillAll(){

    let extractsToDelete = this.extracts;

    extractsToDelete['bills'].forEach( (group,groupIndex) => {
      
      group['bill'].forEach( (bill, billIndex) => {

    
        this.api.update('documents/'+ bill.document_id,{deleted:true}).subscribe(res=>{
          //console.log(res);
        })
        
      });

    });
    this.extracts['bills'] = [];
    this.updateTravel();




  }

  changeExtractType(){
    this.updateTravel();

  }
  nextConfirmData(){

    //console.log('extracts', this.extracts);
    this.currentStep =2;
    this.travelSelected['process_step']= this.currentStep;

    this.getAnalisysResult();
    /*
    if(this.currentStep ==1 && this.extracts 
      && this.extracts[this.currentExtract] 
      && this.extracts[this.currentExtract]['bills'] 
      && this.extracts[this.currentExtract]['bills'][this.currentBill] 
      && this.extracts[this.currentExtract]['bills'][this.currentBill]['confirmed'] == 1){
        
       
    
    }else{
      this.isSettingBill = true;

    }
      */

    this.updateTravel();

  }
  confirmData(){

    this.isSettingBill = false;
    this.extracts[this.currentExtract]['bills'][this.currentBill]['confirmed']=1;

    this.currentBill = this.extracts[this.currentExtract]['bills'].length;
    this.updateTravel();

    this.nextStep();

  }
  startExtractWorker(){
    if(this.extracts && this.extracts['extract'] ){


        setTimeout(() => {
          if(this.extracts['extract']['status'] == 0){

            //console.log('jobid',this.extracts['extract']['jobId']);
  
            let form = new FormData();
            form.append('jobId', this.extracts['extract']['jobId']); 
    
            this.api.sendForm('aws/getExpenseAnalysis',form).subscribe(res=>{
              //console.log('getExpenseAnalysis', res);
              if(res['status']){
                let data = res['result'];
 
                this.extracts['extract']['status'] = 1; 
                this.extracts['extract']['lines'] = res['result']['lines']; 

                if(res['result']['name'] && res['result']['name'] != ''){
                this.extracts['extract']['name'] = res['result']['name']; 

                }
                sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

                
              }else{
                this.startExtractWorker();
              }
            })
            
          }
    
        }, 5000);
        
      

    }


  }
  uploadLineBill(extract,line){

    this.openModalAddBill = true;

    this.uploadLineResultId=line;
    this.uploadedExtractName=extract;
    

  }

  changeDateExtractLine(i){
    console.log(this.extracts.extract.lines[i].date);

  }
  editLine(line){
    let startDate = new Date(line.date+"T"+line.hour);

    this.editLineDate = startDate.getFullYear()+"-"+this.addZero(startDate.getMonth()+1)+"-"+this.addZero(startDate.getDate())+"T00:00";
    this.editLineTime = startDate.getFullYear()+"-"+this.addZero(startDate.getMonth()+1)+"-"+this.addZero(startDate.getDate())+"T"+startDate.getHours()+":"+startDate.getMinutes()+":00";

    this.editLineReason = line.reason && line.reason != '' ? line.reason : '';
    this.editLineDescription=line.vendor;
    this.editLineBill = line.bill;
    this.editLineCurrency = line.currency;
    this.editLineDocId= line.document_id;
    this.toggleDatesExtracts = [];
    this.extracts.extract.lines.forEach(element => {
      this.toggleDatesExtracts.push(false);
    });

    
    this.api.create('uploads/readBlob', {
      file_name:line.blobName,
      mimeType:line.mimeType,
      process_id:this.travelSelected._id,
      folder:"receipts"
    }).subscribe(res=>{

      this.editLineReceipt = res['body'];
      this.changeDetector.detectChanges();
      //console.log(this.editLineReceipt);
      

    })

    this.api.create('uploads/readBlob', {
      file_name:this.extracts['extract'].blobName,
      mimeType:this.extracts['extract'].mimeType,
      process_id:this.travelSelected._id,
      folder:"extracts"
    }).subscribe(res=>{

      this.editLineExtract = res['body'];
      this.changeDetector.detectChanges();

      //console.log(this.editLineExtract);

      

    })


    this.isEdditingLine=true;
    


  }

  sanitizeImage(blob){

    return this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' 
      + blob);
  }

  isImage(mime){
    if(this.imageMimes.indexOf(mime) >= 0){
      return true;
    }else{
      return false;
    }
  }

  isPdf(mime){
    if(mime){
      if(this.pdfMimes.indexOf(mime) >= 0){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }

  }

  deleteLine(i,line){
    this.selectedDeleteLine=[i,line];
    
    this.isDeletingLine=true;
  }
  deleteAllNotMatched(){
    this.isDeletingAllNotMatched = true;
  }
  deleteNotMatched(group,line, lineObj){

    //console.log(lineObj);

    this.selectedDeleteLine=[group,line];
    this.docToDelete = lineObj.document_id;

    this.isDeletingLine=true;


  }

  getNotScheduledStatus(){
    let founds =0;

    this.results['notMatched'].forEach(element => {

      if(element['bill'] && element['bill'].length > 0){
        element['bill'].forEach(bill => {
          founds ++;
        });
      }
    });

    if(founds == 0){
      return false;
    }else{
      return true;
    }

  }
  confirmDeleteAllNotMatchedLines(){
    this.results['notMatched']=[];
    this.updateTravel();

  }
  confirmDeleteLine(){

    this.results['notMatched'][this.selectedDeleteLine[0]]['bill'].splice(this.selectedDeleteLine[1],1);

    if(this.results['notMatched'][this.selectedDeleteLine[0]]['bill'].length <=0){
      this.results['notMatched'].splice(0,1);
    }
    

    this.extracts.bills.forEach((billGroup,groupIndex) => {
      billGroup.bill.forEach((bill, billIndex) => {
        if(bill.document_id == this.docToDelete){
          this.idToDeleteBillContainer = groupIndex;
          this.idToDeleteBill = billIndex;
          this.documentIdToDelete = this.docToDelete;
        }
      });
    });
    this.confirmDeleteBill();


    this.updateTravel()


  }
  checkMatchStatus(){
    let found = 0;
   // console.log(this.results)
    this.results.forEach(element => {
      element.lines.forEach(line => {
          if(!line.match){
            found ++;
          }
      });
    });
    if(found >0){
      return {status:false, found:found};
    }else{
      return {status:true, found:found};

    }
  }
  finishEditLine(){

    this.extracts.bills.forEach((billGroup, indexBillGroup) => {
      billGroup.bill.forEach((bill, indexBill) => {

        if(bill.document_id == this.editLineDocId){

          let date = new Date(this.editLineDate);
          let time = new Date(this.editLineTime);

          this.extracts.bills[indexBillGroup].bill[indexBill].date = date.getFullYear()+"-"+this.addZero(date.getMonth()+1)+"-"+this.addZero(date.getDate());
          this.extracts.bills[indexBillGroup].bill[indexBill].hour = time.getHours()+":"+time.getMinutes()+":00";
          this.extracts.bills[indexBillGroup].bill[indexBill].vendor = this.editLineDescription;
          this.extracts.bills[indexBillGroup].bill[indexBill].currency = this.editLineCurrency;
          this.extracts.bills[indexBillGroup].bill[indexBill].total = this.editLineBill;



        }
      });
      
    });


    
    this.extracts.extract.lines.forEach( (line, index) => {
      if(line.date && line.date != '' && line.date.indexOf('T') >= 0){

        let date = line.date.split('T');
        
        this.extracts.extract.lines[index].date = date[0];

      }

    });
  


    this.isEdditingLine=false;
    this.results=undefined;
    this.updateTravel();
    sessionStorage.removeItem('result')
    this.getAnalisysResult();
    

  }

  checkUploadStatus(){
    if(!this.extracts || this.extracts &&
       this.extracts['bills'].length <=0 
      ){

        return true;

      }else{

        if(this.extracts['bills'] &&  
          this.extracts['bills'].length >0){

            let count = 0;
            this.extracts['bills'].forEach((element,index) => {

              element.bill.forEach(bill => {
                if(bill.status == false){
                  count ++;
                }
              });
   
            });
            if(count > 0){
              return true;
            }else{
              return false;
            }
            
          }else{
              return true;
          }

      }
  }
  sanitizeFileName(name){

    name = name.replace(/\s+/g, '-').toLowerCase();
    name = name.replace(/[^a-zA-Z0-9]/g,'');
    return name;

  }

  uploadFile(file,type){
    this.showAlertTime =true;
    this.isUploading=true;
    this.travelSelected['last_uploaded_bill_date'] = Date.now();
    this.updateTravel();
    if (file.length > 0) {
      var arrFiles =[];
    
      for(const fileElement of file){
        arrFiles.push(fileElement);

        if((fileElement.size/1048576)<=10){
          if(type == 'extracts'){

            this.extracts['extract']['file'] = this.sanitizeFileName(fileElement.name);
            this.extracts['extract']['original_name'] = fileElement.name;
            this.extracts['extract']['status'] = 0;
            this.extracts['extract']['lines'] = [];
            
            this.updateTravel();

          }
          if(type == 'bills'){

            if(this.extracts && this.extracts.bills){

              let founds = 0;

              this.extracts.bills.forEach( (element,index) => {
                if(element.currency == this.currencyBlockSelected['code']){
                  
                  founds ++;
                  this.extracts.bills[index]['bill'].push({ original_name:fileElement.name, file:this.sanitizeFileName(fileElement.name), status: 0 });
                  this.billAccOpened = index;
                }
              });
              if(founds <=0){
                this.extracts.bills.push({currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{original_name:fileElement.name,file:this.sanitizeFileName(fileElement.name), status: 0}]});

              }


            }else{
              this.extracts={bills :[{currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{original_name:fileElement.name,file:this.sanitizeFileName(fileElement.name), status: 0}]}]};
              

            }
            this.updateTravel();

          }

        }
      }

      for (let [indexFile, fileElement] of arrFiles.entries()) {

        if((fileElement.size/1048576)<=10){

          if(type == 'extracts'){

            let form = new FormData();
            form.append('file', fileElement, fileElement.name); 
            form.append('process_id', this.travelSelected._id); 
            form.append('model_id', 'custom-ikosten-extracts-v2'); 

            this.api.sendForm('uploads/uploadExtract',form).subscribe(res=>{
              //console.log('extract',res);

              let status =500;
              if(!res['error'] && !res['body']['error']){
               status =1;

              }else{
                alert('Error subiendo el archivo');

              }

              this.extracts['extract']['status'] = status; 
              this.extracts['extract']['lines'] = res['body']['document_result']['lines']; 
              this.extracts['extract']['bankName'] = res['body']['document_result']['bankName']; 
              this.extracts['extract']['startDate'] = res['body']['document_result']['startDate']; 
              this.extracts['extract']['endDate'] = res['body']['document_result']['endDate']; 
              this.extracts['extract']['document_id'] = res['body']['document_id']; 
              this.extracts['extract']['file_url'] = res['body']['fileUrl']; 
              this.extracts['extract']['blobName'] = res['body']['document_result']['blobName']; 
              this.extracts['extract']['mimeType'] = res['body']['document_result']['mimeType']; 

              this.updateTravel();


            })
            

          }else if(type == 'bills'){
            let form = new FormData();
            form.append('file', fileElement, fileElement.name); 
            form.append('process_id', this.travelSelected._id); 
            form.append('model_id', 'prebuilt-receipt'); 

            this.api.sendForm('uploads/uploadReceipt',form).subscribe(res=>{
              //console.log(res);
              
              let status =500;
              if(!res['body']['error']){
               
                status=1;

              }
              for (let [index, element] of this.extracts.bills.entries()) {


                for (let [indexBill, bill] of element.bill.entries()) {

                  if(element.currency == this.currencyBlockSelected['code'] && 
                    bill.file == res['body']['document_result']['fileName']
                  ){
                    this.extracts.bills[index]['bill'][indexBill]['status']=status;
                    if(status == 1){
                      this.extracts.bills[index]['bill'][indexBill]['date']=res['body']['document_result']['date'];
                      this.extracts.bills[index]['bill'][indexBill]['hour']=res['body']['document_result']['hour'];
                      this.extracts.bills[index]['bill'][indexBill]['vendor']=res['body']['document_result']['vendor'];
                      this.extracts.bills[index]['bill'][indexBill]['docType']=res['body']['document_result']['docType'];
                      this.extracts.bills[index]['bill'][indexBill]['total']=res['body']['document_result']['total'];
                      this.extracts.bills[index]['bill'][indexBill]['document_id']=res['body']['document_id'];
                      this.extracts.bills[index]['bill'][indexBill]['file_url']=res['body']['fileUrl'];
                      this.extracts.bills[index]['bill'][indexBill]['mimeType']=res['body']['document_result']['mimeType'];
                      this.extracts.bills[index]['bill'][indexBill]['blobName']=res['body']['document_result']['blobName'];
  
                    }else{
                      this.extracts.bills[index]['bill'][indexBill]['date']="";
                      this.extracts.bills[index]['bill'][indexBill]['hour']="";
                      this.extracts.bills[index]['bill'][indexBill]['vendor']="Error";
                      this.extracts.bills[index]['bill'][indexBill]['docType']="";
                      this.extracts.bills[index]['bill'][indexBill]['total']=0;
                      this.extracts.bills[index]['bill'][indexBill]['document_id']=res['body']['document_id'];
                      this.extracts.bills[index]['bill'][indexBill]['file_url']="";
                      this.extracts.bills[index]['bill'][indexBill]['mimeType']="";
                      this.extracts.bills[index]['bill'][indexBill]['blobName']="";
                    }

                    this.updateTravel();

                    

                  }
                  
                };
 
              };

            })

          }

        }
      };
      this.isUploading=false;
      this.isUploadingOther=false;
      this.imagesToUpload = [];



    }
  
  }
  openUploading(){

    this.currencyBlockSelected=undefined;
    this.isUploadingOther = true
    /*
    if(this.extracts['bills'].length >= this.limitations.limitations_country_x_travel){
      this.router.navigate(['/customer/memberships'])
    }else{


    }*/


  }
  checkBillsErrors(){
    let founds = 0;
    this.extracts.bills.forEach((element,index) => {
          
      element.bill.forEach((bill,indexBill) => {
        if(bill.status == 500 || bill.status == 0){
          founds ++;
        }
      })

    })

    if(founds == 0){
      return false;
    }else{
      return true;
    }
  }
  uploadImagesBase64(){
    let files = [];


    this.imagesToUpload.forEach(image => {

      const imageName = Date.now()+'.'+image.format;
      const imageBlob = this.dataURItoBlob(image.dataUrl);

      const imageFile = new File([imageBlob], imageName, { type: 'image/'+image.format });
      files.push(imageFile);

    });

    this.uploadFile(files,'bills');
  }
  dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
  }

  confirmRestartProcess(){
    sessionStorage.clear();
    this.isUploadingOther=true;
  }
  fileBrowseHandler(files, type){
    //console.log('file handler')
    this.uploadFile(files.target.files, type);

  }
}
