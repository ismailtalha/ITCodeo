import { Routes } from '@angular/router';
import { CreateProjectComponent } from './create-project/create-project.component'; // Add this import
import { EnvironmentComponent } from './environment/environment.component';

export const routes: Routes = [
  { path: 'create', component: CreateProjectComponent },
  {
    path: 'environment/:user/:projectname/:containerId',
    component: EnvironmentComponent,
  },
  { path: '', redirectTo: '/create', pathMatch: 'full' },
];
