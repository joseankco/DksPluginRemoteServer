import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./pages/dashboard/dashboard.component";
import {AppComponent} from "./app.component";
import {AccountComponent} from "./pages/account/account.component";
import {GameLogComponent} from "./pages/account/game-log/game-log.component";
import {BotSessionComponent} from "./pages/account/bot-session/bot-session.component";
import {LogScrapperComponent} from "./pages/account/log-scrapper/log-scrapper.component";
import {PalladiumStatsComponent} from "./pages/account/palladium-stats/palladium-stats.component";
import {ChangeConnectionGuard} from "./guards/change-connection.guard";
import {StatsComponent} from "./pages/account/stats/stats.component";
import {UpgradeModulesComponent} from "./pages/account/upgrade-modules/upgrade-modules.component";

const routes: Routes = [
  { path: '', component: AppComponent, canActivate: [ChangeConnectionGuard], children:
    [
      { path: '', component: DashboardComponent, canActivate: [ChangeConnectionGuard] },
      { path: 'account/:id', component: AccountComponent, canActivate: [ChangeConnectionGuard], children:
        [
          { path: 'session', component: BotSessionComponent },
          { path: 'stats', component: StatsComponent },
          { path: 'logs', component: GameLogComponent },
          { path: 'scrapper', component: LogScrapperComponent },
          { path: 'palladium', component: PalladiumStatsComponent },
          { path: 'modules', component: UpgradeModulesComponent }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
