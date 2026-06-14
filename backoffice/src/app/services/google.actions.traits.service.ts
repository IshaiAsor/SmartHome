import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class GoogleActionsTraitsService {
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);

  getGoogleActionTraits() {
    return this.http.get<GoogleActionTrait[]>(`${this.apiUrl}/api/google/actions/traits`);
  }
}

export interface GoogleActionTrait {
  id: number;
  name: string;
  value: string;
}
