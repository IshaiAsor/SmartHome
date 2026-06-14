import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GoogleActionsTypesService } from './google.actions.types.service';

describe('GoogleActionsTypesService', () => {
  let service: GoogleActionsTypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GoogleActionsTypesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
