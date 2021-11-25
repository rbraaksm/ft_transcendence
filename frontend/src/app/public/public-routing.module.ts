import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { RegisterComponent } from './components/register/register.component';
import { TwoFactorComponent } from './components/two-factor/two-factor.component';
import { CallbackComponent } from './components/callback/callback.component';
const routes: Routes = [

	{path: 'login', component: LoginComponent},
	{path: 'register', component: RegisterComponent},
	{path: 'callback', component: CallbackComponent},
	{path: 'two-factor', component: TwoFactorComponent},
	{path: '', redirectTo: 'login', pathMatch: 'full'},
	{path: '**', component: PageNotFoundComponent}

  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
