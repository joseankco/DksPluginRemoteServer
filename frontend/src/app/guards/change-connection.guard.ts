import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import {DarkBotService} from "../services/dark-bot.service";

@Injectable({
  providedIn: 'root'
})
export class ChangeConnectionGuard implements CanActivate {

  constructor(private darkbot: DarkBotService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const id = route.paramMap.get('id');
    if (id) {
      this.darkbot.switch(id);
    } else {
      this.darkbot.switch();
    }
    return true;
  }

}
