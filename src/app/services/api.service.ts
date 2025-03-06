import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

const headers = new HttpHeaders().set("rcy-key", "Jxa4lyCUktiBkhC0IiL4");
const formHeaders = new HttpHeaders().set("rcy-key", "Jxa4lyCUktiBkhC0IiL4");


@Injectable({
  providedIn: "root",
})
export class ApiService {
  endpoint = "https://api.ikosten.com/api/";

  //endpoint = "https://ikosten-api-v2-hbcqgacnehfjbdch.eastus-01.azurewebsites.net/api/";
  //
  constructor(private http: HttpClient) {}
  //
  create(endpoint: string, params: any = {}) {
    let url = this.endpoint + endpoint;

    return this.http.post(url, params);
    
  }
  read(endpoint: string, params: any = {}) {
    let url = this.endpoint + endpoint;
    params._ = Date.now();
    return this.http.get(url, { headers: headers, params: params });
  }
  update(endpoint: string, params: any = {}) {
    let url = this.endpoint + endpoint;
    return this.http.put(url, params, { headers: headers });
  }
  delete(endpoint: string, params: any = {}) {
    let url = this.endpoint + endpoint;
    return this.http.delete(url, { headers: headers, params: params });
  }
  sendForm(endpoint: string, form:FormData){
    let url = this.endpoint + endpoint;
    return this.http.post(url, form,{ headers: formHeaders });

  }
}
