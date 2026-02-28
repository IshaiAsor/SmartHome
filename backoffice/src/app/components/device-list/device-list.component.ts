import { Component, OnInit } from '@angular/core';
import { Device, DeviceService } from '../../services/device.service';

// Make sure this entire block exists right above the class
@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit {
  // ... your component code ...
  devices: Device[] = [];

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.deviceService.getDevices().subscribe(data => {
      this.devices = data;
    });
  }

  onToggle(device: Device): void {
    const newState = !device.is_on;
    // Optimistic UI update
    device.is_on = newState; 
    
    this.deviceService.toggleDevice(device.id, newState).subscribe({
      next: (updatedDevice) => console.log(`Device ${updatedDevice.id} updated`),
      error: (err) => {
        console.error('Failed to update device', err);
        device.is_on = !newState; // Revert if API fails
      }
    });
  }
}