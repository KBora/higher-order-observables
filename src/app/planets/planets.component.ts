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
  planets: Planet[] = [];
  moons: Moon[] = [];

  planetsWithMoonNames: Planet[] = [];

  constructor(private planetsService: PlanetsService) { }

  ngOnInit(): void {    
  }

  loadPlanets() {

    // solution 1 - subscribe in a subscribe
    // PRO - easier to see what's happening
    // CONS - nested subscriptions are bad - subscriptions need to be cleaned up
    // CONS - return values of inner subscribe are not assigned in sequence
    // this.planets$.pipe(
    //   tap( result => console.log("tap: ", result))
    // ).subscribe(
    //   planets => {
    //     this.planets = planets;
    //     planets.forEach( planet => {
    //       planet.moons.forEach( moon => {
    //         this.planetsService.moon(moon).subscribe(
    //           moon => {
    //             console.log(`moon id ${moon.id}, moon name ${moon.name}`);
    //             this.moons.push(moon.name);
    //           }
    //         )
    //       }            
    //       )
    //     })       
    //   }
    // );

    // solution 2 - higher order observables
    // PROS - inner observables are automatically subscribed / unsubscribed
    // CONS - complex code - have to convert results in observables (mergeMap, from) and use higher order observables (mergeMap)
    // this.planets$
    //   .pipe(
    //       tap(planets => this.planets = planets),
    //       mergeMap( planets =>     // transform planets into observable       
    //         from(planets) // converts planets into observable
    //           .pipe(
    //             tap( planet => console.log("tap planet", planet)),
    //             map( planet => planet.moonIds ), // get the moon ids
    //             mergeMap( moonIds => // transform moon ids into observable
    //               from(moonIds) // convert ids into observables
    //                 .pipe(
    //                   tap(moonId => console.log("tap moonId", moonId)),
    //                   mergeMap( (moonId: number) => this.planetsService.moon(moonId)), // merge http results into one strem
    //                   // toArray() // concatenate results of stream into array of moons
    //                 )
    //             ),
    //             tap((moon: Moon) => this.moons.push(moon))
    //           )
    //         )
    //   ).subscribe()

    
    // solution 2b - write results of inner calls into outer call data rather than external variables
    // this.planets$
    //   .pipe(
    //     tap(planets => this.planets = planets),
    //     mergeMap(planets =>     // transform planets into observable       
    //       from(planets) // converts planets into observable
    //         .pipe(
    //           mergeMap(planet => // transform moon ids into observable
    //             from(planet.moons) // convert ids into observables
    //               .pipe(
    //                 mergeMap((moon: Moon) => this.planetsService.moon(moon.id)), 
    //                 toArray(), // concatenate results of stream into array of moons,
    //                 map(moonsWithNamesArray => {
    //                   // do data mapping, data transform here
    //                   // in this case, we want to append moon names to the moon array in the parent 'planet' object
    //                   // note: we have access to planet (if you reference the variable, a closure will be created and you can access it)
    //                   let moonsUpdated: Moon[] = 
    //                      planet.moons.map(moon => {
    //                        const matchingMoon = moonsWithNamesArray.find(moonWithName => moon.id === moonWithName.id)
    //                        return matchingMoon ? matchingMoon : moon;
    //                      })
    //                   let updatedPlanet = { ...planet,  moons: moonsUpdated };                    
    //                   return updatedPlanet;
    //                 })
    //               )
    //           ),
    //         )
    //     ),
    //     tap(planetWithMoonNames => console.log('planetWithMoonNames: ', planetWithMoonNames)),
    //     toArray(), // wait til everything comes back and return as an array
    // ).subscribe(planetsWithMoonNames => {
    //   this.planetsWithMoonNames = planetsWithMoonNames;
    // })


    // solution 2c - forkJoin shortens the code a little
    this.planets$.pipe(
        tap(planets => this.planets = planets),
        mergeMap((planets: Planet[]) =>     
          from(planets).pipe(
              mergeMap(planet => 
                // forkJoin executes in parallel and returns an array of results                
                forkJoin(planet.moons.map((moon: Moon) => this.planetsService.moon(moon.id))).pipe(
                  map(moonsWithNamesArray => {
                    let moonsUpdated: Moon[] =
                         planet.moons.map(moon => {
                           const matchingMoon = moonsWithNamesArray.find(moonWithName => moon.id === moonWithName.id)
                           return matchingMoon ? matchingMoon : moon;
                         })
                    let updatedPlanet = { ...planet,  moons: moonsUpdated };                    
                    return updatedPlanet;
                  })
                )
              ),             
          )      
        ),
        toArray()
      ).subscribe( planetsWithMoonNames  => {
        this.planetsWithMoonNames = planetsWithMoonNames;
      })

    // solution 3 - Promises and await

    // error handling
        
  }

}


