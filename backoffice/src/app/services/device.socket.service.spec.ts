import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeviceSocketService } from './device.socket.service';

describe('DeviceSocketService', () => {
  let service: DeviceSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeviceSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
