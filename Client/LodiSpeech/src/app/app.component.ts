import {
  Component,
  HostListener
} from '@angular/core';

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
    this.updateLayout();

    this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.updateLayout();
      });
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.updateLayout();
  }

  @HostListener('window:popstate')
  onPopState(): void {
    this.updateLayout();
  }

  private updateLayout(): void {
    /*
     * pathname excludes #home, #about,
     * #services and #contact automatically.
     */
    const path = window.location.pathname
      .replace(/\/+$/, '') || '/';

    this.publicPage =
      path === '/' ||
      path === '/staff-login';
  }

  logout(): void {
    this.auth.logout();

    this.router.navigate([
      '/staff-login'
    ]);
  }
}