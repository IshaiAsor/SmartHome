import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DeviceSocketService } from 'src/app/services/device.socket.service';
import { MgmtDeviceListComponent } from './mgmt-device-list.component';

describe('MgmtDeviceListComponent', () => {
  let component: MgmtDeviceListComponent;
  let fixture: ComponentFixture<MgmtDeviceListComponent>;

  const mockSocketService = {
    onDeviceOnlineStatusChange: () => of(),
    publishActionState: jasmine.createSpy('publishActionState'),
    disconnect: jasmine.createSpy('disconnect'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgmtDeviceListComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DeviceSocketService, useValue: mockSocketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MgmtDeviceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
