import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoginResponseI } from 'src/app/model/auth/login-response.interface';
import { UserI } from 'src/app/model/user/user.interface';
import { of, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TwoFactorAuthenticationCodeDto } from 'src/app/model/twoFactor/twoFactor.dto';
import { UserService } from '../../../public/services/user-service/user.service';

export const JWT_TWO_NAME = 'two-token';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {

  constructor(private http: HttpClient,
	private snackbar: MatSnackBar,
	private jwtService: JwtHelperService,
	private userService: UserService
	) { }

  generate(user: UserI) : Observable<string>{
	return this.http.post<string>('api/2fa/generate', user);	
  }

  authenticate(user: UserI, code: TwoFactorAuthenticationCodeDto): Observable<any> {
	return this.http.post<any>('api/2fa/authenticate', user).pipe(
		tap((res) => {
			localStorage.setItem(JWT_TWO_NAME, res)}),
		catchError(e => {
		this.snackbar.open(e.error.message, 'Close', {
			duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
		})
		return throwError(e);
	  })
	);
  }

  turnOn(user: UserI, code: TwoFactorAuthenticationCodeDto): Observable<any> {
	return this.http.post<any>('api/2fa/turn-on', user).pipe(
	  catchError(e => {
		this.snackbar.open(`Wrong Password. Please try again.`, 'Close', {
			duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
		})
		return throwError(e);
	  })
	);
  }

  turnOff(user: UserI, code: TwoFactorAuthenticationCodeDto): Observable<any> {
	return this.http.post<any>('api/2fa/turn-off', user).pipe(
	  catchError(e => {
		this.snackbar.open(`Wrong Password. Please try again.`, 'Close', {
			duration: 3000, panelClass: ['login1-snackbar', 'login2-snackbar'],
		})
		return throwError(e);
	  })
	);
  }

  getImage(imageUrl: string): Observable<Blob> {
	return this.http.get(imageUrl, { responseType: 'blob' });
  }
}
