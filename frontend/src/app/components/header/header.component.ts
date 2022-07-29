import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {LoginResponse, ServerResponse} from "../../models/main.model";
import {ActivatedRoute} from "@angular/router";
import {firstValueFrom, Subscription} from "rxjs";
import {LoginComponent} from "../login/login.component";
import {isMobilePhone} from "../../utils/utils";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  single: ServerResponse | undefined;
  multiple: ServerResponse[] | undefined;
  subscriptions$: Subscription[] = [];
  id: string = '';
  password: string | undefined;
  action: string = '';
  logged: LoginResponse | undefined;

  constructor(
    public darkbot: DarkBotService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const datasub = this.darkbot.getData().subscribe(data => {
      if (this.darkbot.isSingle()) {
        this.multiple = undefined;
        this.single = data as ServerResponse;
      } else {
        this.single = undefined;
        this.multiple = data as ServerResponse[];
      }
    })
    this.subscriptions$.push(datasub);
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

  setLoginResponse(event: LoginResponse) {
    this.logged = event;
    if (this.action === 'open-client') {
      this.openClient();
    }
  }

  setOpenClient(login: LoginComponent) {
    if (!this.logged) {
      login.openModal();
      this.action = 'open-client';
    } else {
      this.openClient();
    }
  }

  openClient() {
    if (this.logged) {
      window.open('darkorbit-client://' + this.logged.instance + '?dosid=' + this.logged.sid)
    }
  }

  isMobilePhone() {
    return isMobilePhone();
  }
}
