import {Component, OnDestroy, OnInit} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {LoginResponse, ServerResponse} from "../../models/main.model";
import {ActivatedRoute} from "@angular/router";
import {firstValueFrom, Subscription} from "rxjs";
import {LoginComponent} from "../login/login.component";
import {isMobilePhone} from "../../utils/utils";
import {AuthService} from "../../services/auth.service";

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
  session: LoginResponse | undefined;

  constructor(
    public darkbot: DarkBotService,
    public auth: AuthService
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
    this.session = event;
    if (this.action === 'open-client') {
      this.openClient();
    }
  }

  setOpenClient(login: LoginComponent) {
    if (!this.auth.isLogged()) {
      login.openModal();
      this.action = 'open-client';
    } else {
      this.openClient();
    }
  }

  openClient() {
    if (this.session) {
      window.open('darkorbit-client://' + this.session.instance + '?dosid=' + this.session.sid)
    }
  }

  isMobilePhone() {
    return isMobilePhone();
  }

  doLogin(login: LoginComponent) {
    if (!this.auth.isLogged()) {
      login.openModal();
    }
  }
}
