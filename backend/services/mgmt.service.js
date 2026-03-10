const db = require('../dal/device.repo'); 
const mqttService = require('./mqtt.service');
const { deviceStatusEnum } = require('../dal/deviceStatusEnum');
class MgmtService {
  async getAllDevices() {
    return db.getAll();
  }

    async updateDeviceStatus(id, status) {
    const updatedDevice = await db.updateStatus(id, status);

    if(updatedDevice.status === deviceStatusEnum.Registered) {

    }
}
