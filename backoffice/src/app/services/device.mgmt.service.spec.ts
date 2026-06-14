import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeviceMgmtService } from './device.mgmt.service';

describe('DeviceMgmtService', () => {
  let service: DeviceMgmtService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeviceMgmtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
