import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MgmtDeviceRegisterComponent } from './mgmt-device-register.component';

describe('MgmtDeviceRegisterComponent', () => {
  let component: MgmtDeviceRegisterComponent;
  let fixture: ComponentFixture<MgmtDeviceRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgmtDeviceRegisterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MgmtDeviceRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
