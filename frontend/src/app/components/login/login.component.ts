import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {LoginResponse} from "../../models/main.model";
import {DarkBotService} from "../../services/dark-bot.service";
import {firstValueFrom} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "../../services/auth.service";

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
  @ViewChild('modal', {static: true}) modal!: ElementRef<HTMLDivElement>;
  @ViewChild('input', {static: true}) input!: ElementRef<HTMLInputElement>;
  @Output() onSuccess = new EventEmitter<LoginResponse>();

  constructor(
    private darkbot: DarkBotService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.modal.nativeElement.addEventListener('shown.bs.modal', () => this.input.nativeElement.focus());
  }

  public openModal() {
    if (this.trigger) {
      this.trigger.nativeElement.click();
    }
  }

  login() {
    this.auth.login(this.password).then(data =>{
      this.onSuccess.emit(data);
      if (this.closer) {
        this.closer.nativeElement.click();
      }
      this.error = '';
    }).catch(error => {
      this.error = error;
    });
  }
}
