import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module'; 
import { AppComponent } from './app.component';
import { DeviceListComponent } from './components/device-list/device-list.component';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './services/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    DeviceListComponent // ✅ Moved BACK to declarations
  ],
  imports: [
    BrowserModule,
    AppRoutingModule   // ✅ Router stays here
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }