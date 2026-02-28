import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 1. Import the environment file
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
  // 2. Use the environment variable to build the base URL
  private apiUrl = `${environment.apiUrl}/api/devices`;

  constructor(private http: HttpClient) {}

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  toggleDevice(id: string, isOn: boolean): Observable<Device> {
    return this.http.patch<Device>(`${this.apiUrl}/${id}/state`, { isOn });
  }
}