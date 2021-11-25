import { UserService } from '../../services/user-service/user.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth-service/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

class CustomValidators {
	static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
	  return (control: AbstractControl): { [key: string]: any } => {
		if (!control.value) {
		  return null as any;
		}
		const valid = regex.test(control.value);
		return valid ? null as any : error;
	  };
	}

  static passwordsMatch (control: AbstractControl): ValidationErrors {
    const password = control.get('password')!.value;
    const confirmPassword = control.get('confirmPassword')!.value;

    if((password === confirmPassword) && (password !== null && confirmPassword !== null)) {
      return null as any;
    } else {
      return {passwordsNotMatching: true};
    }
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
	
export class RegisterComponent  {
  
	registerForm: FormGroup = new FormGroup({
    email: new FormControl(null, [
		  Validators.required,
		  Validators.email,
		  Validators.minLength(5)
		]),
    username: new FormControl(null, [Validators.required, Validators.maxLength(20)]),
    password: new FormControl(null, [
			Validators.required,
			Validators.minLength(8),
			CustomValidators.patternValidator(/.{8,}/, { minimumLength: true}),
			CustomValidators.patternValidator(/\d/, { hasNumber: true }),
			CustomValidators.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
			CustomValidators.patternValidator(/[a-z]/, { hasSmallCase: true }),
			CustomValidators.patternValidator(/[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,{ hasSpecialCharacters: true }),
		]),
  },{
  });

   
	constructor(private authService: AuthService,
		private userService: UserService,
		private formBuilder: FormBuilder,
		private router: Router,
		private _snackBar: MatSnackBar,
	 ) { }

	ngOnInit() {    
		if (this.authService.isAuthenticated()) {
			this.router.navigate(['../../private/profile']);
			this._snackBar.open('Welcome!', 'Close', {
				duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
			});
		}
	  }

	onSubmit() {
    if (this.registerForm.valid) {
      this.userService.create({
        email: this.registerForm.get('email')!.value,
        password: this.registerForm.get('password')!.value,
        username: this.registerForm.get('username')!.value
      }).pipe(
        tap(() => this.router.navigate(['../login']))
      ).subscribe();
    }
  }
		
		hide = true;
	getErrorMessageUser() {
		if (this.registerForm.controls.username.hasError('required')) {
		  return 'You must enter a username';
		}
		else if (this.registerForm.controls.username.hasError('maxlength')) {
			return 'Username must be less than 20 characters';
		}
		return '';
	  }
	getErrorMessageEmail() {
		if (this.registerForm.controls.email.hasError('required')) {
		  return 'You must enter a email';
		}
		return this.registerForm.controls.email.hasError('email') ? 'Not a valid email' : '';
	  }
}
