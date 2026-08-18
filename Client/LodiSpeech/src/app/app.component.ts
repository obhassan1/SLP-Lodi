import { Component } from '@angular/core';
import {
  NavigationEnd,
  Router
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  publicPage = true;

  constructor(
    private router: Router,
    public auth: AuthService
  ) {
    this.updateLayout(this.router.url);

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        const navigation = event as NavigationEnd;
        this.updateLayout(navigation.urlAfterRedirects);
      });
  }

  private updateLayout(url: string): void {
    const pathWithoutQuery = url.split('?')[0];
    const pathWithoutFragment =
      pathWithoutQuery.split('#')[0];

    this.publicPage =
      pathWithoutFragment === '/' ||
      pathWithoutFragment === '/staff-login';
  }
}