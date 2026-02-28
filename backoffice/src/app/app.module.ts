import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module'; 
import { AppComponent } from './app.component';
import { DeviceListComponent } from './components/device-list/device-list.component';

@NgModule({
  declarations: [
    AppComponent,
    DeviceListComponent // ✅ Moved BACK to declarations
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,   // ✅ Router stays here
    HttpClientModule    // ✅ HTTP Client stays here
    // ❌ DeviceListComponent is REMOVED from here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }