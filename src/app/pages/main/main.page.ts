import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { transition, style, animate, trigger } from '@angular/animations';
import {ApiService} from '../../services/api.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { DomSanitizer } from '@angular/platform-browser';

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
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  animations: [
    fadeIn,
  ]
})
export class MainPage implements OnInit {
  alertButtons = ['Ok'];

  public deleteExtractAlertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteExtract()
      },
    },
  ];
  public alertRestartButtons= [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Confirmar',
      role: 'confirm',
      handler: () => {
        this.confirmRestartProcess()
      },
    },
  ];
  public deleteLineAlertButtons =[
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteLine()
      },
    },
  ];
  public deleteAllNotMatchedAlertButtons =[
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteAllNotMatchedLines()
      },
    },
  ];
  public deleteBillAlertButtons =[
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBill()
      },
    },
  ];
  public deleteAllAlertButtons =[
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Eliminar',
      role: 'confirm',
      handler: () => {
        this.confirmDeleteBillAll()
      },
    },
  ];
  public goBackAlertButtons =[
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        
      },
    },
    {
      text: 'Confirmar',
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


  constructor(
    private api:ApiService,
    private http: HttpClient,
    private _sanitizer: DomSanitizer,
    private changeDetector:ChangeDetectorRef
  ) { }

  ngOnInit() {

    
    this.getCurrencies();
    this.hidrate();
    console.log('extracts',this.extracts);

    
  }
  hidrate(){
    if(sessionStorage.getItem('extracts') && sessionStorage.getItem('extracts') != ''){
      this.extracts = JSON.parse(sessionStorage.getItem('extracts'));

    }
    if(sessionStorage.getItem('result') && sessionStorage.getItem('result') != ''){
      this.results = JSON.parse(sessionStorage.getItem('result'));

    }


    if(sessionStorage.getItem('currentStep') && sessionStorage.getItem('currentStep') != ''){
      this.currentStep = Number(sessionStorage.getItem('currentStep'));
      //console.log('current step',this.currentStep)
      if(this.currentStep == 3){
        this.getAnalisysResult();
      }
      

    }

    if(sessionStorage.getItem('exportSettings') && sessionStorage.getItem('exportSettings') != ''){
      let obj = JSON.parse(sessionStorage.getItem('exportSettings'));

      if(obj['userName']){
        this.userName = obj['userName'];

      }
      if(obj['userEmail']){
        this.userEmail = obj['userEmail'];

      }
      
      if(obj['sendPdf']){
        this.sendPdf = obj['sendPdf'];

      }
      if(obj['sendExcel']){
        
        this.sendExcel = obj['sendExcel'];
        
      }
      if(obj['currencyExchange']){

        this.currencyExchange = obj['currencyExchange'];
      }
      //console.log('currency', obj);



    }
    let obj ={
      userName:this.userName,
      userEmail:this.userEmail,
      sendPdf:this.sendPdf,
      sendExcel:this.sendExcel,
      currencyExchange: this.currencyExchange

    }
    sessionStorage.setItem('exportSettings', JSON.stringify(obj));
    if(this.countBills() > 0){
      this.isUploadingOther=false;
    }else{
      this.isUploadingOther=true;

    }
    //console.log('extracts',this.extracts)
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
  pickerOptionSelected(event){
    if(this.pickerType == 'country'){
      this.currencyBlockSelected = event;
      this.scrollToTarget('card-step-2');
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

      }
    })
  }
  createProcess(){
    this.loadingButtons=true;
    if(sessionStorage.getItem('processId') && sessionStorage.getItem('processId') != null && sessionStorage.getItem('processId') != ''){
      this.currentStep++;
      this.loadingButtons=false;


    }else{
      let form = new FormData();
      this.api.create('processes',{}).subscribe(res=>{
        //console.log(res);
        if(res['status'] == 201){
          sessionStorage.setItem('processId', res['body']['_id']);
          this.extracts={bills:[],extract:{ type:'', currency:''}};
          sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

          this.currentStep++;

  
        }
        this.loadingButtons=false;

      })


    }

    if(this.countBills() > 0){
      this.isUploadingOther=false;
    }else{
      this.isUploadingOther=true;

    }

    sessionStorage.setItem('currentStep', this.currentStep.toString());


  }
  countBills(){
    if(this.extracts && this.extracts['bills']){
      return this.extracts['bills'].length;

    }else{
      return 0;
    }
  }
  nextStep(){

    if(this.currentStep == 3){
      if(this.countNotMatched() > 0){
        this.showAlertFounds = true;

      }else if(this.countMatched() <= 0){

        this.showAlertFoundsMatched = true;

      }else{
        this.currentStep++;

      }
    }else{
      this.currentStep++;

    }

    if(this.currentStep == 3){
      this.getAnalisysResult();

    }



    sessionStorage.setItem('currentStep', this.currentStep.toString());

  }
  finishProcess(){
    this.extracts=[];
    sessionStorage.removeItem('extracts');

    this.results=undefined;
    sessionStorage.removeItem('result');

    this.exportSettings=undefined;
    sessionStorage.removeItem('exportSettings');

    this.currentStep=0;
    sessionStorage.removeItem('currentStep');
    sessionStorage.removeItem('processId');

    

    this.currentExtract=0;
    this.currentBill=0;
    this.sendPdf=undefined;
    this.sendExcel=undefined;
    this.currencyExchange=undefined;


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


    if(!sessionStorage.getItem('result') || sessionStorage.getItem('result') == ''){


      console.log('extracts before analisys',this.extracts);
      this.api.create('processes/getResult', this.extracts).subscribe(res=>{
        console.log('result',res);
        if(!res['error']){
          let obj= {
            matchedBills:res['body']['matchedExtracts'],
            notMatched:res['body']['notMatched'],
            notmatchedExtractLines:res['body']['notMatchedExtractLines'],
            startDate:res['body']['startDate'],
            endDate:res['body']['endDate']
          }
          this.results=obj;
          //console.log('results',this.results);
  
          sessionStorage.setItem('result', JSON.stringify(this.results));
  
  
        }
   
  
      })
  
      /*
      let form = new FormData();
      form.append('data', JSON.stringify(obj)); 
      console.log(form);
      
      this.api.sendForm('aws/getResult',form).subscribe(res=>{

        console.log('get result',res);
        this.results=res;
        sessionStorage.setItem('result', JSON.stringify(this.results));
        let found = this.checkMatchStatus();

        if(!found.status){
          this.showAlertFounds=true;
          this.foundsQty= found.found;
        }
  
      })
        */

    }else{
      /*
      let found = this.checkMatchStatus();
      if(!found.status){
        this.showAlertFounds=true;
        this.foundsQty= found.found;
      }
        */
    }

      
  }
  confirmGoBack(){
    this.backStep();
  }
  backStep(){
    this.isSettingBill=false;
    //console.log(this.currentStep);
    if(this.currentStep == 3){
      //console.log('reset result');

      this.results=undefined;
      sessionStorage.removeItem('result');

    }
    if(this.currentStep == 1){
      this.isUploadingOther=false;
    }
    this.currentStep--;
    sessionStorage.setItem('currentStep', this.currentStep.toString());


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
    sessionStorage.setItem('currentStep', this.currentStep.toString());


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
  sendResult(){
    this.sendingForm=true; 
   
    let obj = {
      lead_name:this.userName,
      lead_email: this.userEmail.toLowerCase(),
      process_id: sessionStorage.getItem('processId')
    }
    let exportSettings ={
      userName:this.userName,
      userEmail:this.userEmail,
      sendPdf:this.sendPdf,
      sendExcel:this.sendExcel

    }


    this.api.create('leads', obj).subscribe(res=>{
      //console.log('create lead', res);
      let objSendResult = {
        results: this.results,
        exportSettings : exportSettings,
        userName : this.userName,
        userEmail : this.userEmail,
      }
      //console.log(objSendResult);
      
      this.api.create('processes/sendResult',objSendResult).subscribe(res=>{
        //console.log('send result',res);
        if(res['body'] == 202){
          this.currentStep ++;
        }
        this.sendingForm=false; 
      })
        
        

    })

    /*
    
    this.api.sendForm('leads',form).subscribe(res=>{

      form.append('results', JSON.stringify(this.results)); 
      form.append('exportSettings', sessionStorage.getItem('exportSettings')); 


      this.api.sendForm('emails',form).subscribe(res=>{
        console.log(res);
 
        this.currentStep++;
        this.sendingForm=true;
        sessionStorage.setItem('currentStep', this.currentStep.toString());


      })

    })
      */

  }
  showMemberships(){
    this.openModalMemberships=true;
  }
  showCheckout(){}
  jumpToStep(step:number){
    this.currentStep=step;
    sessionStorage.setItem('currentStep', this.currentStep.toString());

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
  dismissDeleteAllNotMatched(){
    this.isDeletingAllNotMatched=false;
  }
  changeExportSettings(){
    let obj ={
      userName: this.userName,
      userEmail:this.userEmail,
      sendPdf:this.sendPdf,
      sendExcel:this.sendExcel,
      currencyExchange: this.currencyExchange
    }
    //console.log('currencyExchange', obj)
    sessionStorage.setItem('exportSettings', JSON.stringify(obj));

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

    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

    
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
    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

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
          console.log(res);
        })
        
      });

    });
    this.extracts['bills'] = [];
    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));



  }
  startBillWorker(){

    //console.log('start bill worker')
    if(this.extracts &&  this.extracts.bills  ){

      // this.extracts[this.currentExtract]['bills'][this.currentBill]


      setTimeout(() => {
        this.extracts.bills.forEach((element,index) => {
          
          element.bill.forEach((bill,indexBill) => {

            if(bill.status == 0){
  
              let form = new FormData();
              form.append('jobId', bill.jobId); 
      
              this.api.sendForm('aws/getBillAnalysis',form).subscribe(res=>{
               // console.log('getBillAnalysis', res);

                
                if(res['status']){
                  let result = res['result'];
  
                  this.extracts.bills[index]['bill'][indexBill]['status'] = 1;
                  this.extracts.bills[index]['bill'][indexBill]['confirmed'] = 0;
                  this.extracts.bills[index]['bill'][indexBill]['date'] = result['date'];
                  this.extracts.bills[index]['bill'][indexBill]['net'] = result['net'];
                  this.extracts.bills[index]['bill'][indexBill]['tax'] = result['tax'];
                  this.extracts.bills[index]['bill'][indexBill]['tip'] = result['tip'];
                  this.extracts.bills[index]['bill'][indexBill]['total'] = result['total'];
                  this.extracts.bills[index]['bill'][indexBill]['vendor'] = result['vendor'];
                  //console.log(this.extracts);
                  sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
                  //console.log(JSON.stringify(this.extracts));
                  
                  
                }else{
                  this.startBillWorker();
                }
                  
                  
              })
              
            }
            
          });
 
        });

  
      }, 5000);
      
    

    }
  }
  changeExtractType(){
    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

  }
  nextConfirmData(){

    //console.log('extracts', this.extracts);
    this.currentStep =2;
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

    sessionStorage.setItem('currentStep', this.currentStep.toString());

  }
  confirmData(){

    this.isSettingBill = false;
    this.extracts[this.currentExtract]['bills'][this.currentBill]['confirmed']=1;

    this.currentBill = this.extracts[this.currentExtract]['bills'].length;
    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

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
      process_id:sessionStorage.getItem('processId'),
      folder:"receipts"
    }).subscribe(res=>{

      this.editLineReceipt = res['body'];
      this.changeDetector.detectChanges();
      //console.log(this.editLineReceipt);
      

    })

    this.api.create('uploads/readBlob', {
      file_name:this.extracts['extract'].blobName,
      mimeType:this.extracts['extract'].mimeType,
      process_id:sessionStorage.getItem('processId'),
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
    console.log('confirm Delete all')
    this.results['notMatched']=[];
    sessionStorage.setItem('result', JSON.stringify(this.results));

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


    sessionStorage.setItem('result', JSON.stringify(this.results));


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
    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
    sessionStorage.removeItem('result')
    this.getAnalisysResult();
    

  }
  /*
  uploadBillPhoto(){
    this.isUploading=true;
    let form = new FormData();
    form.append('image64', this.imageToUpload); 


    this.api.sendForm('aws/startExpenseAnalysisBase64',form).subscribe(res=>{

      if(res['status']){
        if(this.extracts[this.currentExtract]['bills']){
          this.extracts[this.currentExtract]['bills'].push({file:this.imageToUpload, jobId:res['result']['JobId'], status: 0, currency:''});

        }else{
          this.extracts[this.currentExtract]['bills'] = [];
          this.extracts[this.currentExtract]['bills'].push({file:this.imageToUpload,jobId:res['result']['JobId'], status: 0, currency:''});

        }
        this.imageToUpload=undefined;
        sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
        this.startBillWorker();
      }else{
        alert('Error subiendo el archivo')
      }
      this.isUploading=false;




    })

  }
    */
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
  uploadFile(file,type){
    this.showAlertTime =true;
    this.isUploading=true;
    if (file.length > 0) {
      var arrFiles =[];
    
      for(const fileElement of file){
        arrFiles.push(fileElement);

        if((fileElement.size/1048576)<=10){
          if(type == 'extracts'){

            this.extracts['extract']['file'] = fileElement.name;
            this.extracts['extract']['status'] = 0;
            this.extracts['extract']['lines'] = [];
            
            sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

          }
          if(type == 'bills'){

            if(this.extracts && this.extracts.bills){

              let founds = 0;

              this.extracts.bills.forEach( (element,index) => {
                if(element.currency == this.currencyBlockSelected['code']){
                  
                  founds ++;
                  this.extracts.bills[index]['bill'].push({ file:fileElement.name, status: 0 });

                }
              });
              if(founds <=0){
                this.extracts.bills.push({currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{file:fileElement.name, status: 0}]});

              }


            }else{
              this.extracts={bills :[{currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{file:fileElement.name, status: 0}]}]};
              

            }
           // console.log(this.extracts)
            sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
          }

        }
      }

      for (let [indexFile, fileElement] of arrFiles.entries()) {

        if((fileElement.size/1048576)<=10){

          if(type == 'extracts'){

            let form = new FormData();
            form.append('file', fileElement, fileElement.name); 
            form.append('process_id', sessionStorage.getItem('processId')); 
            form.append('model_id', 'custom-ikosten-extracts-v2'); 

            this.api.sendForm('uploads/uploadExtract',form).subscribe(res=>{
              console.log('extract',res);

              let status =500;
              if(!res['error'] && !res['body']['error']){
               status =1;

              }else{
                alert('Error subiendo el archivo')

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

              sessionStorage.setItem('extracts', JSON.stringify(this.extracts));

            })
            

          }else if(type == 'bills'){
            let form = new FormData();
            form.append('file', fileElement, fileElement.name); 
            form.append('process_id', sessionStorage.getItem('processId')); 
            form.append('model_id', 'prebuilt-receipt'); 

            this.api.sendForm('uploads/uploadReceipt',form).subscribe(res=>{
              console.log(res);
              
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

                    sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
                    

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
  _uploadFile(file, type){
    this.isUploading=true;

    if (file.length > 0) {

      for(const fileElement of file){

        if((fileElement.size/1048576)<=10){

          if(type == 'extract'){

            let form = new FormData();
            form.append('file', fileElement, fileElement.name); 
            //console.log('send form');
  
            this.api.sendForm('aws/startExpenseAnalysis',form).subscribe(res=>{
      
              //console.log(res);
              if(res['status']){
                this.extracts['extract'] = {file:fileElement, name:fileElement.name, jobId:res['result']['JobId'], status: 0, type:'', currency:''};
                sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
                this.showAlertTime =true;
                this.startExtractWorker();
              }else{
                alert('Error subiendo el archivo')
              }
              this.isUploading=false;

            })
  

          }else if(type=='bill'){
            let form = new FormData();
            form.append('file', file[0], file[0].name); 
            form.append('lot_id', sessionStorage.getItem('processId')); 

  
            this.api.sendForm('azure/startExpenseAnalysis',form).subscribe(res=>{
              //console.log(res);
              if(res['status']){
                this.showAlertTime =true;
                if(this.extracts && this.extracts.bills){

                  let founds = 0;

                  this.extracts.bills.forEach( (element,index) => {
                    if(element.currency == this.currencyBlockSelected['code']){
                      
                      founds ++;
                      this.extracts.bills[index]['bill'].push({ file:file[0], jobId:res['result']['JobId'], status: 0 });

                    }
                  });
                  if(founds <=0){
                    this.extracts.bills.push({currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{file:file[0], jobId:res['result']['JobId'], status: 0}]});

                  }

  
                }else{
                  this.extracts={bills :[{currency:this.currencyBlockSelected['code'],country:this.currencyBlockSelected['country'], bill:[{file:file[0], jobId:res['result']['JobId'], status: 0}]}]};
                  
  
                }
                //console.log(this.extracts)
                sessionStorage.setItem('extracts', JSON.stringify(this.extracts));
                this.startBillWorker();
              }else{
                alert('Error subiendo el archivo')
              }
              this.isUploading=false;
              this.isUploadingOther=false;



            })
  
          }
        }else{
          this.notUploaded.push(fileElement);
          //alert('file exeeds 10 MB')
        }
      }
      

      if(this.notUploaded.length > 0){
        alert(this.notUploaded.length+' archivos exceden el máximo de 10 MB');
      }





        
    }
        

  }
  confirmRestartProcess(){
    sessionStorage.clear();
    this.isUploadingOther=true;
    this.currentStep = 0;
  }
  fileBrowseHandler(files, type){
    //console.log('file handler')
    this.uploadFile(files.target.files, type);

  }
}
