import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {LoginResponse} from "../../models/main.model";
import {DarkBotService} from "../../services/dark-bot.service";
import {firstValueFrom} from "rxjs";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  password: string = '';
  error: string = '';
  @ViewChild('trigger', {static: true}) trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild('closer', {static: true}) closer!: ElementRef<HTMLButtonElement>;
  @Output() onSuccess = new EventEmitter<LoginResponse>();

  constructor(private darkbot: DarkBotService) { }

  ngOnInit(): void { }

  public openModal() {
    if (this.trigger) {
      this.trigger.nativeElement.click();
    }
  }

  login() {
    firstValueFrom(this.darkbot.getSid(this.password)).then((r) => {
      const data = r as LoginResponse;
      this.onSuccess.emit(data);
      if (this.closer) {
        this.closer.nativeElement.click();
      }
      this.error = '';
    }).catch(() => {
        this.error = 'Invalid Password';
    });
  }
}
