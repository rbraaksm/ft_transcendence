import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { HistoryI } from 'src/app/model/history/history.interface';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  constructor(private http: HttpClient, private snackbar: MatSnackBar) { }

  	findAllByUserId(id: number): Observable<HistoryI[]> {
	  return this.http.get('/api/history/match/' + id).pipe(
	    map((history:HistoryI[]) => history)
	  )
	}
}
