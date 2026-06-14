import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GoogleActionsTraitsService } from './google.actions.traits.service';

describe('GoogleActionsTraitsService', () => {
  let service: GoogleActionsTraitsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GoogleActionsTraitsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
