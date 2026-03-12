import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeviceListComponent } from './components/device-list/device-list.component';
import { authGuard } from './guards/auth.guard'; // Ensure you import from the correct path
import { LoginComponent } from './components/login/login.component'; // Ensure you import from the correct path

const routes: Routes = [
  // This tells Angular: When the user goes to the base URL, load the dashboard!
  { path: '', component: DeviceListComponent, canActivate: [authGuard] } ,
{path: 'login', component:LoginComponent},
{ path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }