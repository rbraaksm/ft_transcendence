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

  @ViewChild('stepper') stepper;
  settingForm: FormGroup;
  isOptional = false;
  imageToShow: any;
  secret: string;
  isImageLoading : boolean;
  ngOnInit(): void {
	this.settingForm = this.formBuilder.group({
		id: [{value: null, disabled: true}, [Validators.required]],
		username: [null, [Validators.required]],
		avatar: [null],
		image_url: [null],
		email: [{value: null, disabled: true}, [Validators.required]],
		twoFactorAuthEnabled: [null],
		twoFactorAuthenticationSecret : [null],
		twoFactorAuthenticationCode : [null, [Validators.required,
			Validators.minLength(6),
			Validators.maxLength(6),]],
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
				this.secret = user.twoFactorAuthenticationSecret;
				if (this.settingForm.value.twoFactorAuthEnabled){
					this.router.navigate(['../../private/setting']);
					this._snackBar.open('Two factor authentication is enabled', 'Close', {
						duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
					});
				}
			})
			))
			).subscribe()
		this.getImageFromService();
	}

	changed(){
		if (this.settingForm.controls['twoFactorAuthEnabled'].value) this.settingForm.value.twoFactorAuthEnabled = true;
		else this.settingForm.value.twoFactorAuthEnabled = false;
	}


	createImageFromBlob(image: Blob) {
		let reader = new FileReader();
		reader.addEventListener("load", () => {
		   this.imageToShow = reader.result;
		}, false);

		if (image) {
		   reader.readAsDataURL(image);
		}
	}
	getImageFromService() {
		this.isImageLoading = true;
		this.twoFactorService.getImage("/api/2fa/qrcode").subscribe(data => {
		  this.createImageFromBlob(data);
		  this.isImageLoading = false;
		}, error => {
		  this.isImageLoading = false;
		});
	}
	turnOn(){
		this.twoFactorService.turnOn(this.settingForm.getRawValue(), this.settingForm.value.twoFactorAuthenticationCode).subscribe(data => {
			this._snackBar.open('Two factor authentication is enabled', 'Close', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
			this.stepper.next();
			setTimeout(() => {
				this.router.navigate(['../../private/setting']);
			}, 3500);
		}, error => {
			console.log(error);
		});
	}
}
