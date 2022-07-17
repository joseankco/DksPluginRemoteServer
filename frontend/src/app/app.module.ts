import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {AppRoutingModule} from "./app-routing.module";
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ServerStatusComponent } from './components/server-status/server-status.component';
import { BotMapComponent } from './components/bot-map/bot-map.component';
import { HeaderComponent } from './components/header/header.component';
import {HttpClientModule} from "@angular/common/http";
import { AccountComponent } from './pages/account/account.component';
import { GameLogComponent } from './pages/account/game-log/game-log.component';
import { BotSessionComponent } from './pages/account/bot-session/bot-session.component';
import { LogScrapperComponent } from './pages/account/log-scrapper/log-scrapper.component';
import { PalladiumStatsComponent } from './pages/account/palladium-stats/palladium-stats.component';
import { AsUsernamePipe } from './pipes/as-username.pipe';
import { AsNumberPipe } from './pipes/as-number.pipe';
import { PerHourPipe } from './pipes/per-hour.pipe';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ServerStatusComponent,
    BotMapComponent,
    HeaderComponent,
    AccountComponent,
    GameLogComponent,
    BotSessionComponent,
    LogScrapperComponent,
    PalladiumStatsComponent,
    AsUsernamePipe,
    AsNumberPipe,
    PerHourPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
