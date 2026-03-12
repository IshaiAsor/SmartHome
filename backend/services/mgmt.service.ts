import deviceRepo from '../dal/device.repo';
import mqttService from './mqtt.service';
import { deviceStatusEnum } from '../dal/deviceStatusEnum';

class MgmtService {
  async getAllDevices() {
    return deviceRepo.getAll();
  }

  async updateDeviceStatus(id: string, status: number) {
    const updatedDevice = await deviceRepo.updateStatus(id, status);

    if (updatedDevice.status === deviceStatusEnum.Registered) {
      // TODO: perform post-registration logic
    }
    return updatedDevice;
  }
}

export default new MgmtService();