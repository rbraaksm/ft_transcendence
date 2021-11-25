import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import { LoginResponseI } from 'src/app/model/auth/login-response.interface';
import { UserService } from '../../services/user-service/user.service';
import { TwoFactorService } from 'src/app/private/services/twoFactor-service/twoFactor.service';



@Component({
  selector: 'app-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.css']
})
export class TwoFactorComponent implements OnInit {

  constructor(
	private formBuilder: FormBuilder,
	private userService: UserService,
	private authService: AuthService,
	private router: Router,
	private twoFactorService: TwoFactorService,
	private _snackBar: MatSnackBar
  ) { }

  twofactorForm: FormGroup;
  ngOnInit(): void {
	this.twofactorForm = this.formBuilder.group({
		id: [{value: null, disabled: true}, [Validators.required]],
		twoFactorAuthEnabled: [null],
		twoFactorAuthenticationSecret : [null, [Validators.required]],
		twoFactorAuthenticationCode : [null, [Validators.required]],
	});
	

	this.authService.getUserId().pipe(
		switchMap((idt: number) => this.userService.findOne(idt).pipe(
			tap((user) => {
				this.twofactorForm.patchValue({
					id: user.id,
					twoFactorAuthEnabled: user.twoFactorAuthEnabled,
					twoFactorAuthenticationSecret: user.twoFactorAuthenticationSecret
				})
				if (!this.twofactorForm.value.twoFactorAuthEnabled){
					this.router.navigate(['../../public/login']);
					this._snackBar.open('Two factor authentication isn\'t active', 'Close', {
						duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
					});
				}
			})
			))
			).subscribe()
	}

	onSubmit() {
		if (this.twofactorForm.valid) {
			this.twoFactorService.authenticate(this.twofactorForm.getRawValue(), this.twofactorForm.value.twoFactorAuthenticationCode).subscribe(data => {
					this.router.navigate(['../../private/profile']);
			});
		  }
		}
	cancel() {
		localStorage.removeItem('auth-token');
		this.router.navigate(['../../public/login']);
	}
}
