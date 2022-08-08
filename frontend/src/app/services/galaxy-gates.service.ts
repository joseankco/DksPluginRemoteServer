import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {of} from "rxjs";
import {DarkBotService} from "./dark-bot.service";


@Injectable({
  providedIn: 'root'
})
export class GalaxyGatesService {

  constructor(
    private http: HttpClient,
    private darkbot: DarkBotService
  ) { }

  public getGalaxyGateFull(id: number, type: string = 'full') {
    return this.darkbot.getUrlBackend() + '/get-gate?gate=' + id + '&type=' + type;
  }
}
