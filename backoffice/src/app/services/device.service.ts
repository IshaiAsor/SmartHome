import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Device {
  id: string;
  name: string;
  type: string;
  is_on: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/api/devices`);
  }

  toggleDevice(id: string, isOn: boolean): Observable<Device> {
    return this.http.patch<Device>(`${this.apiUrl}/api/devices/${id}/state`, { isOn });
  }
}
