import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';


import { Router, RouterModule, Routes } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

	constructor(
		private apiService: AuthService,
		private router: Router,
		private snackBar: MatSnackBar
	 ) { }

  ngOnInit(): void {

	if (this.apiService.isAuthenticated()) {
		this.router.navigate(['../../private/profile']);
		return ;
	}
	
	let uri: string = window.location.href;
	
	let auth = "/api/oauth2/school42";
	uri = uri.replace('public/', '');
	let output = [uri.slice(0, 21), auth, uri.slice(21)].join('');
	uri = output;

    this.apiService.getToken(uri).subscribe(
		(result: any) =>{
        localStorage.setItem('auth-token', result.token);        
		    if (result.two_factor) this.router.navigate(['../../public/two-factor']);
		    else this.router.navigate(['../../private/profile/']);
    },
	(error) => {
		this.snackBar.open('Error: ' + error.error.message, 'Close', {
			duration: 3000,
			panelClass: ['login1-snackbar','login2-snackbar'],
		});
		this.router.navigate(['../../public/login']);
	})
	}
}
