import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { BackendStatusComponent } from './components/backend-status/backend-status.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToastComponent, BackendStatusComponent],
    templateUrl: './app.component.html'
})
export class AppComponent {}
