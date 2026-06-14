import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DeviceSocketService } from 'src/app/services/device.socket.service';
import { UserDashboard } from './user-dashboard';

describe('UserDashboard', () => {
  let component: UserDashboard;
  let fixture: ComponentFixture<UserDashboard>;

  const mockSocketService = {
    onActionStateUpdate: () => of(),
    onDeviceOnlineStatusChange: () => of(),
    publishActionState: jasmine.createSpy('publishActionState'),
    disconnect: jasmine.createSpy('disconnect'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboard, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DeviceSocketService, useValue: mockSocketService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
