import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor() {}

  private dataSubject = new BehaviorSubject<any>(null);
  private filepathSubject = new BehaviorSubject<any>(null);
  private outputSubject = new BehaviorSubject<any>(null);

  // Expose as read-only Observable
  data$: Observable<any> = this.dataSubject.asObservable();
  filepath$: Observable<any> = this.filepathSubject.asObservable();
  output$: Observable<any> = this.outputSubject.asObservable();

  // Setter
  setData(value: any): void {
    this.dataSubject.next(value);
  }

  // Getter (optional)
  getData(): any {
    return this.dataSubject.value;
  }
  setFilePath(value: any): void {
    this.filepathSubject.next(value);
  }
  // Getter for file path
  getFilePath(): any {
    return this.filepathSubject.value;
  }
  setOutput(value: any): void {
    this.outputSubject.next(value);
  }
  // Getter for output
  getOutput(): any {
    return this.outputSubject.value;
  }
}
