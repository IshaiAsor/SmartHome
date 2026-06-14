import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class GoogleActionsTypesService {
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);

  getGoogleActionTypes() {
    return this.http.get<GoogleActionType[]>(`${this.apiUrl}/api/google/actions/types`);
  }
}

export interface GoogleActionType {
  id: number;
  name: string;
  value: string;
}
