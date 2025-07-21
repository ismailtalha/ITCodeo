import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getfiles(folderPath: string): Observable<any> {
    return this.http.get(`http://localhost:3000/getFiles?path=${folderPath}`);
  }

  getFileContent(filePath: string): Observable<any> {
    return this.http.get(
      `http://localhost:3000/getFileContent?filePath=${filePath}`
    );
  }

  postFileContent(filePath: string, content: string | null): Observable<any> {
    return this.http.post('http://localhost:3000/setFileContent', {
      filePath: filePath,
      content: content,
    });
  }

  setupcompiler(language: string): Observable<any> {
    return this.http.post('http://localhost:3000/createCompiler', {
      language,
    });
  }

  createPlayground(data: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/spawn', data);
  }
}
