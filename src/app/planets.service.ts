import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Moon, Planet } from './models';

@Injectable({
  providedIn: 'root'
})
export class PlanetsService {

  constructor(private http: HttpClient) { }

  planets(): Observable<Planet[]> {
    return this.http.get<Planet[]>('http://localhost:4400/planets');
  }

  moon(id: number): Observable<Moon> {
    return this.http.get<Moon>(`http://localhost:4400/moons/${id}`);
  }
}
