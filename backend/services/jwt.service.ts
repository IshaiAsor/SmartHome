import { JwtService, JwtPurpose } from '@lattice/jwt';
import config from '../config/env.config';

export { JwtPurpose };

export const jwtService = new JwtService(config.Jwt.Secret, {
  [JwtPurpose.app_usage]:                          config.Jwt.AppUsageExpiresIn,
  [JwtPurpose.app_usage_refresh]:                  config.Jwt.AppUsageRefreshExpiresIn,
  [JwtPurpose.device_provisioning]:                config.Jwt.deviceProvisioningExpiresIn,
  [JwtPurpose.device_usage]:                       config.Jwt.deviceExpiresIn,
  [JwtPurpose.device_temp_usage]:                  config.Jwt.deviceTempExpiresIn,
  [JwtPurpose.device_usage_refresh]:               config.Jwt.deviceRefreshExpiresIn,
  [JwtPurpose.google_cloud_to_cloud_login]:        config.Jwt.GoogleCloudToCloudLoginExpiresIn,
  [JwtPurpose.google_cloud_to_cloud_login_refresh]:config.Jwt.GoogleCloudToCloudLoginRefreshExpiresIn,
});
