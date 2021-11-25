import { Component,ViewChild, OnInit } from '@angular/core';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import { UserService } from '../../../public/services/user-service/user.service';
import { AuthService } from '../../../public/services/auth-service/auth.service';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { UserI } from 'src/app/model/user/user.interface';
import { TwoFactorService } from 'src/app/private/services/twoFactor-service/twoFactor.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-two-factor-diabled',
  templateUrl: './two-factor-disabled.component.html',
  styleUrls: ['./two-factor-disabled.component.css']
})
export class TwoFactorDisabledComponent implements OnInit {

  constructor(
	private formBuilder: FormBuilder,
	private userService: UserService,
	private authService: AuthService,
	private router: Router,
	private twoFactorService: TwoFactorService,
	private _snackBar: MatSnackBar
  ) { }

  @ViewChild('stepper') stepper;
  settingForm: FormGroup;
  isOptional = false;
  imageToShow: any;
  isImageLoading : boolean;
  ngOnInit(): void {
	this.settingForm = this.formBuilder.group({
		id: [{value: null, disabled: true}, [Validators.required]],
		username: [null, [Validators.required]],
		avatar: [null],
		image_url: [null],
		email: [{value: null, disabled: true}, [Validators.required]],
		twoFactorAuthEnabled: [null],
		twoFactorAuthenticationSecret : [null, [Validators.required]],
		twoFactorAuthenticationCode : [null, [Validators.required]],
	});


	this.authService.getUserId().pipe(
		switchMap((idt: number) => this.userService.findOne(idt).pipe(
			tap((user) => {
				this.settingForm.patchValue({
					id: user.id,
					username: user.username,
					avatar: user.avatar,
					image_url: user.image_url,
					email: user.email,
					twoFactorAuthEnabled: user.twoFactorAuthEnabled,
					twoFactorAuthenticationSecret: user.twoFactorAuthenticationSecret
				})
				if (!this.settingForm.value.twoFactorAuthEnabled){
					this.router.navigate(['../../private/setting']);
					this._snackBar.open('Two factor authentication is disabled', 'Close', {
						duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
					});
				}
			})
			))
			).subscribe()
	}

	turnOff(){
		this.twoFactorService.turnOff(this.settingForm.getRawValue(), this.settingForm.value.twoFactorAuthenticationCode).subscribe(data => {
			this._snackBar.open('Two factor authentication is enabled', 'Close', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
			this.stepper.next();
			setTimeout(() => {
				localStorage.removeItem('two-token');
				this.router.navigate(['../../private/setting']);
			}, 2500);
		}, error => {
			console.log(error);
		});
	}
}
