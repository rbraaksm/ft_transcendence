import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map, switchMap, tap } from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import { LoginResponseI } from 'src/app/model/auth/login-response.interface';
import { UserService } from '../../services/user-service/user.service';
import { CustomSocket } from '../../../private/sockets/custom-socket';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{

	constructor(
		private authService: AuthService,
		private router: Router,
		private _snackBar: MatSnackBar,
	) { }

	ngOnInit() {
		if (this.authService.isAuthenticated()) {
			if (this.authService.get2faActive()) {
				this.router.navigate(['../../public/two-factor']);
			}
			else{
				this.router.navigate(['../../private/profile']);
				this._snackBar.open('Welcome!', 'Close', {
					duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
				});
			}
		}
	}

loginForm: FormGroup = new FormGroup({
	email: new FormControl(null, [Validators.required, Validators.email]),
	password: new FormControl(null, [Validators.required])
  });

	onSubmit() {
		if (this.loginForm.valid) {
			this.authService.login({
			  email: this.loginForm.get('email').value,
			  password: this.loginForm.get('password').value
			}).pipe(
				tap((res: LoginResponseI)=> {
					if (res.two_factor) this.router.navigate(['../../public/two-factor']);
					else this.router.navigate(['../../private/profile/' + res.id]);
				})
			).subscribe()
		  }
		}
	hide = true;
	getErrorMessageEmail() {
		if (this.loginForm.controls.email.hasError('required')) {
		  return '';
		}
		return this.loginForm.controls.email.hasError('email') ? 'Not a valid email' : '';
	  }

}
