import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  public themeService = inject(ThemeService);
}
