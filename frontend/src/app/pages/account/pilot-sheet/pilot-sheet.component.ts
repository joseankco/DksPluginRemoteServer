import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DarkBotService} from "../../../services/dark-bot.service";

@Component({
  selector: 'app-pilot-sheet',
  templateUrl: './pilot-sheet.component.html',
  styleUrls: ['./pilot-sheet.component.css']
})
export class PilotSheetComponent implements OnInit {
  rawHTML: string | undefined;

  constructor(
    public http: HttpClient,
    public darkbot: DarkBotService
  ) { }

  ngOnInit(): void {
    this.http.get(this.darkbot.getUrlBackend() + '/get-pilot-sheet', {responseType: 'text'}).subscribe(data => {
      this.rawHTML = data as string;
    })
  }

}
