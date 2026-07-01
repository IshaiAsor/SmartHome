import { Component, inject, OnInit } from '@angular/core';
import { SHARED_MATERIAL } from 'src/app/shared-ui';
import {
  AdminDeviceConfigService,
  AdminDeviceType,
  AdminDeviceAction,
  AdminTraitView,
} from 'src/app/services/admin.device.config.service';

export interface DeviceTypeGroup {
  type: string;
  versions: AdminDeviceType[];
}

@Component({
  selector: 'app-admin-device-config',
  imports: [SHARED_MATERIAL],
  templateUrl: './admin-device-config.component.html',
  styleUrls: ['./admin-device-config.component.css'],
})
export class AdminDeviceConfigComponent implements OnInit {
  private service = inject(AdminDeviceConfigService);

  deviceTypes: AdminDeviceType[] = [];
  deviceTypeGroups: DeviceTypeGroup[] = [];
  selectedType: string | null = null;
  selectedDevice: AdminDeviceType | null = null;
  actions: AdminDeviceAction[] = [];
  loading = false;

  ngOnInit() {
    this.loadDeviceTypes();
  }

  loadDeviceTypes() {
    this.service.getDeviceTypes().subscribe((types) => {
      this.deviceTypes = types;
      this.deviceTypeGroups = this.buildGroups(types);
      if (this.selectedDevice) {
        this.selectedDevice = types.find((t) => t.id === this.selectedDevice!.id) ?? null;
      }
    });
  }

  private buildGroups(types: AdminDeviceType[]): DeviceTypeGroup[] {
    const map = new Map<string, AdminDeviceType[]>();
    for (const t of types) {
      const group = map.get(t.type) ?? [];
      group.push(t);
      map.set(t.type, group);
    }
    return Array.from(map.entries()).map(([type, versions]) => ({
      type,
      versions: versions.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true })),
    }));
  }

  toggleType(type: string) {
    this.selectedType = this.selectedType === type ? null : type;
  }

  selectDevice(device: AdminDeviceType) {
    this.selectedDevice = device;
    this.loadActions();
  }

  loadActions() {
    if (!this.selectedDevice) return;
    this.loading = true;
    this.service.getActions(this.selectedDevice.id).subscribe({
      next: (actions) => { this.actions = actions; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  pinsLabel(action: AdminDeviceAction): string {
    return action.pins?.map(p => `${p.label} (${p.mode})`).join(', ') || '—';
  }

  traitShortName(trait: AdminTraitView): string {
    return trait.value.replace('action.devices.traits.', '');
  }

  setDefaultTrait(action: AdminDeviceAction, trait: AdminTraitView) {
    if (trait.is_default) return;
    this.service.setDefaultTrait(action.id, trait.id).subscribe(() => {
      action.google_traits.forEach(t => (t.is_default = t.id === trait.id));
    });
  }
}
