import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../public/services/auth-service/auth.service'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorGuard implements CanActivate {

  constructor(private router: Router, private jwtService: JwtHelperService, private authService: AuthService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
	if(!this.authService.isTwofactor()) { //twofactor
		this.router.navigate(['two-factor']);
		return false;
	}
		return true;
	}
}
