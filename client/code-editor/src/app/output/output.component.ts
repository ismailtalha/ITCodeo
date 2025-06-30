import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-output',
  standalone: true,
  imports: [],
  templateUrl: './output.component.html',
  styleUrl: './output.component.css',
})
export class OutputComponent implements OnInit {
  result: string = '';

  constructor(private sharedData: DataService) {}

  ngOnInit() {
    this.sharedData.output$.subscribe((output: any) => {
      if (output) {
        this.result = output;
      }
    });
  }
}
