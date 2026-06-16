import { JwtService, JwtPurpose } from '@lattice/jwt';
import { env } from '../config/env.config';

export { JwtPurpose };

export const jwtService = new JwtService(env.jwtSecret, {
  [JwtPurpose.device_provisioning]:   env.jwt.deviceProvisioningExpiresIn,
  [JwtPurpose.device_usage]:          env.jwt.deviceExpiresIn,
  [JwtPurpose.device_temp_usage]:     env.jwt.deviceTempExpiresIn,
  [JwtPurpose.device_usage_refresh]:  env.jwt.deviceRefreshExpiresIn,
});
