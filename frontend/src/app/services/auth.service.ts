import { Injectable } from '@angular/core';
import {DarkBotService} from "./dark-bot.service";
import {firstValueFrom, ReplaySubject} from "rxjs";
import {LoginResponse} from "../models/main.model";
import {HttpErrorResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  session: LoginResponse | undefined;
  session$: ReplaySubject<LoginResponse | undefined> = new ReplaySubject<LoginResponse | undefined>(1);

  constructor(
    private darkbot: DarkBotService
  ) { }

  login(password: string) {
    return firstValueFrom(this.darkbot.getSid(password)).then((r) => {
      this.session = r as LoginResponse;
      this.session$.next(this.session);
      return this.session;
    }).catch((reason: HttpErrorResponse) => {
      switch (reason.status) {
        case 403:
          throw 'Invalid Password.'
        case 404:
          throw 'Unable to Authenticate. Unsetted password in Server.';
        default:
          throw 'Unknown Error';
      }
    })
  }

  isLogged() {
    return !!this.session;
  }

  getSession() {
    return this.session$;
  }
}
