import { actionHubService } from './action.hub.service';

class SocketActionsService {
  async handleActionUpdate(userId: number, actionId: number, state: string, duration: string = '*') {
    await actionHubService.dispatch(userId, actionId, state, 'socket', { duration });
  }
}

export default new SocketActionsService();
