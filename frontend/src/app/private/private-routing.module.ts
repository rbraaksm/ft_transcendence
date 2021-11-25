import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateRoomComponent } from './components/create-room/create-room.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SettingComponent } from './components/setting/setting.component';
import { LogoutComponent } from './components/logout/logout.component';
import { MatchComponent } from './components/match/match.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FriendComponent } from './components/friend/friend.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { TwoFactorComponent } from './components/two-factor/two-factor.component';
import { TwoFactorDisabledComponent } from './components/two-factor-disabled/two-factor-disabled.component';
import { ProfileusersComponent } from './components/profile-users/profile-users.component';
import { AllRoomsComponent } from './components/all-rooms/all-rooms.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { OptionRoomComponent } from './components/option-room/option-room.component';
import { RulesComponent } from './components/rules/rules.component';

const routes: Routes = [
  {path: 'dashboard', component: DashboardComponent},
  {path: 'create-room', component: CreateRoomComponent},
  {path: 'all-rooms', component: AllRoomsComponent},
  {path: 'setting', component: SettingComponent},
  {path: 'logout', component: LogoutComponent},
  {path: 'match', component: MatchComponent},
  {path: 'profile',
    children: [
      {path: '', component: ProfileComponent},
      {path: ':id', component: ProfileusersComponent},
    ]
  },
  {path: 'option-room/:id', component: OptionRoomComponent},
  {path: 'friend', component: FriendComponent},
  {path: 'rules', component: RulesComponent},
  {path: 'admin', component: AdministrationComponent},
  {path: 'two-factor', component: TwoFactorComponent},
  {path: 'two-factor-disabled', component: TwoFactorDisabledComponent},
  {path: 'page-not-found', component: PageNotFoundComponent},
  {path: '**', component: PageNotFoundComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivateRoutingModule { }
