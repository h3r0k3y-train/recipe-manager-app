import { HttpClient } from "@angular/common/http";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { map, switchMap, withLatestFrom } from "rxjs";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";

import * as RecipesActions from '../store/recipes.actions';
import { Recipe } from "../recipe.model";
import * as fromApp from "src/app/store/app.reducer";

@Injectable()
export class RecipesEffects {
  @Effect()
  fetchRecipes = this.action$.pipe(
    ofType(RecipesActions.FETCH_RECIPES),
    switchMap(() => {
      return this.http
        .get<Recipe[]>(
          'https://ng-complete-guide-17fcd-default-rtdb.europe-west1.firebasedatabase.app/recipes.json'
        )
    }),
    map(recipes => {
      return recipes.map(recipe => {
        return {
          ...recipe,
          ingredients: recipe.ingredients ? recipe.ingredients : []
        };
      });
    }),
    map(recipes => {
      return new RecipesActions.SetRecipes(recipes);
    })
  );

  @Effect({dispatch: false})
  storeRecipes = this.action$.pipe(
    ofType(RecipesActions.STORE_RECIPES),
    withLatestFrom(this.store.select('recipes')), // allows us to merge a value from another observable into this observable stream here
    switchMap(([actionData, recipesState]) => { // syntax called 'array destructuring'. first element come from 'ofType' and the second from 'withLatestFrom'
      return this.http.put(
        'https://ng-complete-guide-17fcd-default-rtdb.europe-west1.firebasedatabase.app/recipes.json',
        recipesState.recipes
      );
    })
  );

  constructor(
    private action$: Actions,
    private http: HttpClient,
    private store: Store<fromApp.AppState>
  ) {}
}
