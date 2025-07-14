import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css'],
})
export class CreateProjectComponent implements OnInit {
  projectForm: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      username: ['', Validators.required],
      language: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      console.log(this.projectForm.value);
      // Handle form submission logic here
      const { projectName, username, language } = this.projectForm.value;
      // Call a service to create the playground
      this.apiService
        .createPlayground({ projectName, username, language })
        .subscribe({
          next: (response) => {
            console.log('Playground created successfully:', response);

            this.router.navigate([
              '/environment',
              username,
              projectName,
              response.containerId,
            ]);
          },
          error: (error) => {
            console.error('Error creating playground:', error);
            alert('Error creating playground. Please try again.');
          },
        });
    }
  }
}
