import { HttpClient } from "@angular/common/http";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { of } from "rxjs";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

import * as AuthActions from './auth.actions';
import { environment } from "src/environments/environment";

export interface AuthResponseData {
  kind?: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable()
export class AuthEffects {
  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((authData: AuthActions.LoginStart) => { // returns a new observable
      return this.http.post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIKey,
        {
          email: authData.payload.email,
          password: authData.payload.password,
          returnSecureToken: true
        }
      ).pipe(
        map(resData => { // map is write first: when there is a error only catchError and following code will execute, not before code
          const expirationDate: Date = new Date(new Date().getTime() + +resData.expiresIn * 1000);
          return new AuthActions.Login({
              email: resData.email,
              userId: resData.localId,
              token: resData.idToken,
              expirationDate: expirationDate
            });
        }),
        catchError(responseError => {
          // must return a non-error observable so that the overall stream doesn't die
          let errorMessage = 'An unknown error occurred!';
          if (!responseError.error || !responseError.error.error) {
            return of(new AuthActions.LoginFail(errorMessage));
          }
          switch (responseError.error.error.message) {
            case 'EMAIL_EXISTS':
              errorMessage = 'This email exists already!';
              break;
            case 'EMAIL_NOT_FOUND':
              errorMessage = 'This email does not exist!';
              break;
            case 'INVALID_PASSWORD':
              errorMessage = 'This password is not correct';
              break;
            default:
              errorMessage = responseError.error.error.message;
          }
          return of(new AuthActions.LoginFail(errorMessage)); // utility for creating a new observable, without an error
        })
      );
    })
  );

  @Effect({dispatch: false})
  authSuccess = this.actions$.pipe(
    ofType(AuthActions.LOGIN),
    tap(() => {
      this.router.navigate(['/recipes']);
    })
  );

  constructor(
    private actions$: Actions, // Big observable that give access to each dispatched actions
    private http: HttpClient,
    private router: Router
  ) {}
}
