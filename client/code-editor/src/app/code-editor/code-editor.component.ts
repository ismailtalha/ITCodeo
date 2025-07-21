import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';
import { CodeEditorModule, CodeModel } from '@ngstack/code-editor';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CodeEditorModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
})
export class CodeEditorComponent implements OnInit {
  textEditorData = new FormControl('');
  selectedfile: string = '';

  onCodeChanged(value: any) {
    console.log('CODE', value);
  }

  constructor(
    private sharedData: DataService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.sharedData.data$.subscribe((data) => {
      this.selectedfile = this.sharedData.getFilePath();
      if (data) {
        this.textEditorData.setValue(data);
        return;
      }
      this.textEditorData.setValue('');
    });
  }

  executeCode() {
    debugger;
    const code = this.textEditorData.value;
    const user = this.route.snapshot.paramMap.get('user');
    const projectname = this.route.snapshot.paramMap.get('projectname');
    const containerId = this.route.snapshot.paramMap.get('containerId');
    if (!user || !projectname || !containerId) {
      console.error('Missing route parameters');
      return;
    }
    let folderPath = `${user}/${projectname}/`;
    let filePath = this.sharedData.getFilePath();
    this.selectedfile = filePath;
    this.api.postFileContent(filePath, code).subscribe((response) => {
      console.log('File saved successfully:', response);
      // this.sharedData.setOutput(this.runCode(code));
    });
  }

  // runCode(userCode: any) {
  //   debugger;
  //   let output = '';

  //   // Save original console.log and alert
  //   const originalLog = console.log;
  //   const originalAlert = alert;

  //   // Override console.log
  //   console.log = (...args: any[]) => {
  //     output += args.join(' ') + '\n';
  //     originalLog.apply(console, args);
  //   };

  //   try {
  //     // Run user code in a safe way
  //     new Function(userCode)();
  //   } catch (e: any) {
  //     output += 'Error: ' + e.message;
  //   }

  //   // Restore original console.log and alert
  //   setTimeout(() => {
  //     console.log = originalLog;
  //     (window as any).alert = originalAlert;
  //   }, 2000);

  //   return output;
  // }
}
