import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatTreeModule, MatTreeNode } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';
import { SocketService } from '../socket.service';
import { DataService } from '../data.service';

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
interface FoodNode {
  name: string;
  children?: FoodNode[];
}

const TREE_DATA: FoodNode[] = [];
@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.scss',
})
export class FileExplorerComponent implements OnInit {
  selectedNode: FoodNode | null = null;
  constructor(
    private api: ApiService,
    private socketService: SocketService,
    private sharedData: DataService
  ) {}
  ngOnInit() {
    this.getData();
    this.listensocket();
  }
  getData(): void {
    this.api.getfiles().subscribe((data) => {
      console.log('Data received:', data);
      this.dataSource = data;
    });
  }
  dataSource = TREE_DATA;

  childrenAccessor = (node: FoodNode) => node.children ?? [];

  hasChild = (_: number, node: FoodNode) =>
    !!node.children && node.children.length > 0;

  listensocket() {
    this.socketService.on<string>('file-changed').subscribe((msg) => {
      this.getData();
    });
  }

  getFileContent(filePath: string) {
    this.api.getFileContent(filePath).subscribe((filedata) => {
      console.log('File content received:', filedata.data);
      debugger;
      if (filedata.data.code !== 200) {
        // Handle error case
        console.error('Error fetching file content:', filedata.error);
        this.sharedData.setFilePath(filePath);
        this.sharedData.setData(null);
        return;
      }
      this.sharedData.setData(filedata.data.data);
      this.sharedData.setFilePath(filePath);
    });
  }

  onNodeClick(node: FoodNode) {
    const fullPath = this.getNodePath(this.dataSource, node);
    if (fullPath) {
      this.getFileContent(fullPath.join('/'));
    }
  }
  getNodePath(
    tree: FoodNode[],
    target: FoodNode,
    path: string[] = []
  ): string[] | null {
    for (let node of tree) {
      const currentPath = [...path, node.name];

      // Direct match
      if (node === target) {
        return currentPath;
      }

      // Search children
      if (node.children) {
        const result = this.getNodePath(node.children, target, currentPath);
        if (result) return result;
      }
    }

    return null;
  }

  selectCompiler(language: string) {
    switch (language) {
      case 'js':
        this.setupcompiler('js');
        break;
      case 'angular':
        // this.setupcompiler('angular');
        break;
      case 'react':
        // this.setupcompiler('react');
        break;
      default:
        throw new Error('Unknown language');
    }
  }

  setupcompiler(language: string) {
    this.api.setupcompiler(language).subscribe({
      next: (response) => {
        alert(response.msg);
      },
      error: (error) => {
        console.error('Error setting up compiler:', error);
        alert('Error setting up compiler: ' + error.message);
      },
    });
  }
}
