import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MgmtDeviceEdit } from './mgmt-device-edit';

describe('MgmtDeviceEdit', () => {
  let component: MgmtDeviceEdit;
  let fixture: ComponentFixture<MgmtDeviceEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgmtDeviceEdit, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { deviceName: 'Test Device' } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MgmtDeviceEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
