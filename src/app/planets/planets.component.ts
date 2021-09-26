import { Component, OnInit, ɵɵsetComponentScope } from '@angular/core';
import { combineLatest, concat, forkJoin, from, of } from 'rxjs';
import { catchError, concatMap, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { Moon, Planet } from '../models';
import { PlanetsService } from '../planets.service';

@Component({
  selector: 'app-planets',
  templateUrl: './planets.component.html',
  styleUrls: ['./planets.component.scss']
})
export class PlanetsComponent implements OnInit {

  planets$ = this.planetsService.planets();

  planetsWithMoonNames: Planet[] = [];

  constructor(private planetsService: PlanetsService) { }

  ngOnInit(): void {
  }

  loadPlanetsNestedSubscribe() {
    // Solution 1 - subscribe in a subscribe
    // PRO - sort of easier to see what's happening
    // CONS - nested subscriptions are bad - subscriptions need to be managed / unsubscribed
    // BUG: moon names get populated after planetsWithMoonNames are assigned
    this.planets$.pipe(
      tap(result => console.log("tap: ", result))
    ).subscribe(
      planets => {     
        let planetsWithMoonNames: Planet[] = { ...planets};   
        planets.forEach(planet => {
          planet.moons.forEach(moon => {
            this.planetsService.moon(moon.id).subscribe(
              moon => {
                console.log(`moon id ${moon.id}, moon name ${moon.name}`);
                // update planets moon name
                let matchingMoon = planet.moons.find( m => m.id === moon.id);
                if (matchingMoon) matchingMoon.name = moon.name;
              }
            )
          }
          )
        })
        console.log('planetsWithMoonNames', planetsWithMoonNames );
        this.planetsWithMoonNames = planetsWithMoonNames;
      }
    );
  }

  loadPlanetsMergeMap() {
    // Solution 2 - Higher order observables
    // PROS - inner observables are automatically subscribed / unsubscribed
    // CONS - complex code - have to convert results in observables (mergeMap, from) and use higher order observables (mergeMap)
    this.planets$
      .pipe(
        mergeMap(planets =>     // transform planets into observable       
          from(planets) // converts planets into observable
            .pipe(
              mergeMap(planet => // transform moon ids into observable
                from(planet.moons) // convert ids into observables
                  .pipe(
                    mergeMap((moon: Moon) => this.planetsService.moon(moon.id)),  // replace with concatMap to run requests in sequence rather than parallel
                    toArray(), // concatenate results of stream into array of moons,
                    map(moonsWithNamesArray => {
                      // do data mapping, data transform here
                      // in this case, we want to append moon names to the moon array in the parent 'planet' object
                      // note: we have access to planet (if you reference the variable, a closure will be created and you can access it)
                      let moonsUpdated: Moon[] =
                        planet.moons.map(moon => {
                          const matchingMoon = moonsWithNamesArray.find(moonWithName => moon.id === moonWithName.id)
                          return matchingMoon ? matchingMoon : moon;
                        })
                      let updatedPlanet = { ...planet, moons: moonsUpdated };
                      return updatedPlanet;
                    })
                  )
              ),
            )
        ),
        tap(planetWithMoonNames => console.log('planetWithMoonNames: ', planetWithMoonNames)),
        toArray(), // wait til everything comes back and return as an array
      ).subscribe(planetsWithMoonNames => {
        this.planetsWithMoonNames = planetsWithMoonNames;
      })
  }

  
  loadPlanetsForkJoin() {    
    // Solution 3 - forkJoin shortens the code a little (no need for .toArray) 
    this.planets$.pipe(
      mergeMap((planets: Planet[]) =>
        forkJoin(planets.map((planet: Planet) => of(planet).pipe(
          mergeMap(planet =>
            // forkJoin executes in parallel and returns an array of results                
            forkJoin(planet.moons.map((moon: Moon) => this.planetsService.moon(moon.id))).pipe(
              map(moonsWithNamesArray => {
                let moonsUpdated: Moon[] =
                  planet.moons.map(moon => {
                    const matchingMoon = moonsWithNamesArray.find(moonWithName => moon.id === moonWithName.id)
                    return matchingMoon ? matchingMoon : moon;
                  })
                let updatedPlanet = { ...planet, moons: moonsUpdated };
                return updatedPlanet;
              })
            ))
        ))
        ))
    ).subscribe(planetsWithMoonNames => {
      this.planetsWithMoonNames = planetsWithMoonNames;
    })

    // error handling
    // to do    
  }

  async loadPlanetsAsync() {
    // Solution 4 - Promises 
    const planets = await this.planets$.toPromise();

    console.log('planets: ', planets);

    for (const planet of planets) { // note: cannot use forEach when using await inside the loop
      for (const moon of planet.moons) {
        const moonResponse = await this.planetsService.moon(moon.id).toPromise();
        moon.name = (moonResponse).name;
      }
    }

    this.planetsWithMoonNames = planets;
    
  }

}


