import { Component, OnInit } from '@angular/core';
import { from, of } from 'rxjs';
import { concatMap, map, mergeMap, tap, toArray } from 'rxjs/operators';
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
    this.planets$
      .pipe(
        tap(planets => this.planets = planets),
        mergeMap(planets =>     // transform planets into observable       
          from(planets) // converts planets into observable
            .pipe(
              tap(planet => console.log("tap planet", planet)),
              // map(planet => planet.moonIds), // get the moon ids
              concatMap(planet => // transform moon ids into observable
                from(planet.moons) // convert ids into observables
                  .pipe(
                    map(moon => moon.id),
                    tap(moonId => console.log("tap moonId", moonId)),
                    concatMap((moonId: number) => 
                      this.planetsService.moon(moonId)
                        .pipe(
                          map( moon => ({...moon}))
                        )
                    ), // merge http results into one strem
                    toArray() // concatenate results of stream into array of moons
                  )
              ),
              tap((moonArray: Moon[]) => this.moons.concat(moonArray))
            )
        ),
        tap( what => console.log('what?? ', what))
      ).subscribe()


    // solution 2c - forkJoin stackoverflow example

    // solution 3 - Promises and await
        
  }

}


