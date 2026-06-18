import { google } from 'googleapis';
import config from '../../config/env.config';
import { DeviceActionView } from '../device.actions.service';
import { googleStateService } from './google.state.service';

class GoogleHomegraphService {
  private homegraph: ReturnType<typeof google.homegraph> | undefined;

  constructor() {
    try {
      let credentials: object | undefined;
      if (config.google.serviceAccountKey) {
        try {
          credentials = JSON.parse(config.google.serviceAccountKey);
        } catch {
          console.warn('[homegraph] GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON — ignored');
        }
      }

      const keyFilename = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
      const authConfig: Record<string, unknown> = {
        scopes: ['https://www.googleapis.com/auth/homegraph'],
      };
      if (credentials) {
        authConfig['credentials'] = credentials;
      } else if (keyFilename) {
        authConfig['keyFilename'] = keyFilename;
      }

      const auth = new google.auth.GoogleAuth(authConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.homegraph = google.homegraph({ version: 'v1', auth: auth as any });
      console.log(`[homegraph] Initialized (${credentials ? 'env key' : keyFilename ? 'key file' : 'ADC'})`);
    } catch (error) {
      console.error('[homegraph] Failed to initialize — check service account config:', error);
    }
  }

  async reportState(agentUserId: string, action: DeviceActionView): Promise<void> {
    if (!this.homegraph) {
      console.error('[homegraph] Not initialized, skipping reportState');
      return;
    }

    const state = googleStateService.buildState(action);
    if (Object.keys(state).length <= 1 && state.online) return;

    const requestBody = {
      requestId: Math.random().toString(36).substring(2, 15),
      agentUserId,
      payload: {
        devices: {
          states: { [action.id.toString()]: state },
        },
      },
    };

    try {
      const res = await this.homegraph.devices.reportStateAndNotification({ requestBody });
      console.log(`[homegraph] reportState user=${agentUserId} action=${action.id}:`, res.data);
    } catch (error: any) {
      console.error('[homegraph] reportState failed:', error.message, error.response?.data?.error);
    }
  }
}

export const googleHomegraphService = new GoogleHomegraphService();
