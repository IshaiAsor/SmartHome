import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SHARED_MATERIAL } from './shared-ui';
import { AuthService } from './services/auth.service';
import { ChatComponent } from './components/chat.component/chat.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  imports: [RouterModule, SHARED_MATERIAL],
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'backoffice';
  authService = inject(AuthService);
  dialog = inject(MatDialog);

  openAIEditor(): void {
    this.dialog.open(ChatComponent, {
      width: '640px',
      maxHeight: '90vh',
      data: { chatMode: 'free' },
    });
  }

  logout() {
    this.authService.logout();
  }
}
