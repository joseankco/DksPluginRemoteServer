import {Component, OnDestroy, OnInit} from '@angular/core';
import {ServerResponse} from "../../models/main.model";
import {DarkBotService} from "../../services/dark-bot.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  constructor( ) { }

  ngOnInit(): void { }

}
