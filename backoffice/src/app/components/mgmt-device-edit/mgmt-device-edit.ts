import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SHARED_MATERIAL } from 'src/app/shared-ui';

@Component({
  selector: 'app-mgmt-device-edit',
  imports: [SHARED_MATERIAL],
  templateUrl: './mgmt-device-edit.html',
  styleUrl: './mgmt-device-edit.css',
})
export class MgmtDeviceEdit {
  dialogRef = inject(MatDialogRef<MgmtDeviceEdit>);
  data: { deviceName: string } = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close();
  }
}
