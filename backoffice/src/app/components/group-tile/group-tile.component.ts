import { Component, input, output } from '@angular/core';
import { ActionGroupView } from 'src/app/services/user.actions.service';
import { SHARED_MATERIAL } from 'src/app/shared-ui';

@Component({
  selector: 'app-group-tile',
  standalone: true,
  imports: [SHARED_MATERIAL],
  templateUrl: './group-tile.component.html',
  styleUrl: './group-tile.component.css',
})
export class GroupTileComponent {
  group = input.required<ActionGroupView>();
  expand = output<void>();
  rename = output<void>();
  ungroupAll = output<void>();

  iconForType(typeValue: string | null): string {
    switch (typeValue) {
      case 'action.devices.types.OUTLET': return 'outlet';
      case 'action.devices.types.SENSOR': return 'thermometer';
      case 'action.devices.types.FAN': return 'toys_fan';
      case 'action.devices.types.LIGHT': return 'light_mode';
      default: return 'device_unknown';
    }
  }
}
