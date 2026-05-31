import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { SHARED_MATERIAL } from 'src/app/shared-ui';

@Component({
  selector: 'app-rename-action-dialog',
  standalone: true,
  imports: [SHARED_MATERIAL],
  templateUrl: './rename-action-dialog.component.html',
})
export class RenameActionDialogComponent {
  dialogRef = inject(MatDialogRef<RenameActionDialogComponent>);
  data: { name: string; title?: string } = inject(MAT_DIALOG_DATA);

  nameControl = new FormControl(this.data.name, [Validators.required, Validators.minLength(1)]);

  save() {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value);
    }
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
