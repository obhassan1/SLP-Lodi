import { Component } from '@angular/core';
@Component({ selector: 'app-landing', templateUrl: './landing.component.html', styleUrls: ['./landing.component.css'] })
export class LandingComponent {
    menuOpen = false;
    year = new Date().getFullYear();
}
