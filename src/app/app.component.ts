import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AngularFireAuth } from '@angular/fire/auth';
import { timer } from 'rxjs';
import { Router } from '@angular/router';
import { LoggingService, Logger } from 'ionic-logging-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  private logger : Logger;
  showSplash = true;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private angularFireAuth: AngularFireAuth,
    private router: Router,
    private loggingService: LoggingService
  ) {

    this.logger = loggingService.getLogger("PackersHelper.AppComponent");

    const authObserver = angularFireAuth.authState.subscribe(user => {
      
      if(user && user.uid) {
        // console.log("Logged in");
        this.router.navigate(['home']);
        authObserver.unsubscribe();
      } else {
        // console.log("Not Logged in")
        this.router.navigate(['login']);
        authObserver.unsubscribe();
      }
    });
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      timer(3000).subscribe(() => this.showSplash = false)
    });
  }
}