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
import { StatsComponent } from './pages/account/stats/stats.component';
import { TickAsTimePipe } from './pipes/tick-as-time.pipe';
import { UpgradeModulesComponent } from './pages/account/upgrade-modules/upgrade-modules.component';
import {FormsModule} from "@angular/forms";
import { MillisecondsAsDHMPipe } from './pipes/milliseconds-as-dhm.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { SpecialTitleCasePipe } from './pipes/special-title-case.pipe';
import { UrlShipPipe } from './pipes/url-ship.pipe';
import {MatTooltipModule} from "@angular/material/tooltip";
import { UrlItemPipe } from './pipes/url-item.pipe';
import { LoginComponent } from './components/login/login.component';
import { GalaxyGatesComponent } from './pages/account/galaxy-gates/galaxy-gates.component';
import { PilotSheetComponent } from './pages/account/pilot-sheet/pilot-sheet.component';

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
    PerHourPipe,
    StatsComponent,
    TickAsTimePipe,
    UpgradeModulesComponent,
    MillisecondsAsDHMPipe,
    SpecialTitleCasePipe,
    UrlShipPipe,
    UrlItemPipe,
    LoginComponent,
    GalaxyGatesComponent,
    PilotSheetComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
