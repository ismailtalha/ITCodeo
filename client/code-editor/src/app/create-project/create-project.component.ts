import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css'],
})
export class CreateProjectComponent implements OnInit {
  projectForm: FormGroup = new FormGroup({});

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      username: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      console.log(this.projectForm.value);
      // Handle form submission logic here
    }
  }
}
