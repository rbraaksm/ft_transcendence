import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CreateRoomComponent } from './components/create-room/create-room.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';

import { PrivateRoutingModule } from './private-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SelectUsersComponent } from './components/select-users/select-users.component';
import { ChatRoomComponent } from './components/chat-room/chat-room.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component'
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { SettingComponent } from '../private/components/setting/setting.component';
import { LogoutComponent } from '../private/components/logout/logout.component';
import { MatchComponent } from '../private/components/match/match.component';
import { ProfileComponent } from '../private/components/profile/profile.component';
import { FriendComponent } from '../private/components/friend/friend.component';
import { TwoFactorComponent } from './components/two-factor/two-factor.component';
import { MatStepperModule } from '@angular/material/stepper';
import { TwoFactorDisabledComponent } from './components/two-factor-disabled/two-factor-disabled.component';
import { ProfileusersComponent } from './components/profile-users/profile-users.component';
import { MatRadioModule } from '@angular/material/radio';
import { AllRoomsComponent } from './components/all-rooms/all-rooms.component';
import { AddUserRoomComponent } from './components/add-user-room/add-user-room.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { OptionRoomComponent } from './components/option-room/option-room.component';
import { RulesComponent } from './components/rules/rules.component';

@NgModule({
  declarations: [
	DashboardComponent,
	AllRoomsComponent,
    CreateRoomComponent,
    SelectUsersComponent,
    ChatRoomComponent,
	AddUserRoomComponent,
    ChatMessageComponent,
	PageNotFoundComponent,
	SettingComponent,
	LogoutComponent,
	MatchComponent,
	ProfileComponent,
	ProfileusersComponent,
	FriendComponent,
	TwoFactorComponent,
	TwoFactorDisabledComponent,
	AdministrationComponent,
	OptionRoomComponent,
	RulesComponent,
  ],
  imports: [
    CommonModule,
    PrivateRoutingModule,
    MatListModule,
    MatPaginatorModule,
    MatCardModule,
	MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
	MatRadioModule,
    MatInputModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
	FormsModule,
	MatSlideToggleModule,
	MatStepperModule,
  ]
})
export class PrivateModule { }
