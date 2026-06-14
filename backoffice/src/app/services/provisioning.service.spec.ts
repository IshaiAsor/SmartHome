import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProvisioningService } from './provisioning.service';

describe('ProvisioningService', () => {
  let service: ProvisioningService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProvisioningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
