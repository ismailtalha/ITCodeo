import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { Subscription } from 'rxjs';
import { MatTreeModule } from '@angular/material/tree';
import { SocketService } from '../socket.service';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';

import { OutputComponent } from '../output/output.component';
import { CodeEditorComponent } from '../code-editor/code-editor.component';

@Component({
  selector: 'app-environment',
  standalone: true,
  imports: [
    RouterOutlet,
    MatTreeModule,
    FileExplorerComponent,
    OutputComponent,
    CodeEditorComponent,
  ],
  templateUrl: './environment.component.html',
  styleUrls: ['./environment.component.scss'],
})
export class EnvironmentComponent {
  title = 'code-editor';

  @ViewChild('terminalContainer', { static: true })
  terminalContainer!: ElementRef;

  private term!: Terminal;
  private fitAddon = new FitAddon();
  private inputBuffer = '';
  private commandHistory: string[] = [];
  private historyIndex = -1;

  private prompt = 'PS> ';
  private messageSub?: Subscription;

  private writeQueue: string[] = [];
  private writeScheduled = false;

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.messageSub = this.socketService
      .on<string>('terminal-data')
      .subscribe((msg) => {
        console.log('Received from server:', msg);
        this.queueTerminalWrite(msg);
      });
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
    this.socketService.disconnect();
  }

  ngAfterViewInit(): void {
    this.term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#00ff00',
      },
    });

    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalContainer.nativeElement);
    this.fitAddon.fit();

    this.showPrompt();

    this.term.onData((data) => {
      const char = data;

      switch (char) {
        case '\r': // ENTER
          this.executeCommand();
          break;

        case '\u007F': // BACKSPACE
          if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            this.term.write('\b \b');
          }
          break;

        case '\u001b[A': // UP arrow
          this.navigateHistory(-1);
          break;

        case '\u001b[B': // DOWN arrow
          this.navigateHistory(1);
          break;

        default:
          // Basic filtering (optional)
          if (
            char >= String.fromCharCode(0x20) &&
            char <= String.fromCharCode(0x7e)
          ) {
            this.inputBuffer += char;
            this.term.write(char);
          }
          break;
      }
    });
  }

  private showPrompt(): void {
    this.term.write(`\r\n${this.prompt}`);
  }

  private executeCommand(): void {
    const command = this.inputBuffer.trim();
    this.term.write('\r\n');

    if (command) {
      this.commandHistory.push(command);
      this.historyIndex = this.commandHistory.length;

      // Handle built-in commands
      if (command === 'help') {
        this.term.writeln('Available commands: help, clear, echo, date');
      } else if (command === 'clear' || command === 'cls') {
        this.term.clear();
      } else if (command.startsWith('echo ')) {
        this.term.writeln(command.substring(5));
      } else if (command === 'date') {
        this.term.writeln(new Date().toString());
      } else {
        this.term.writeln(`'${command}' is not recognized.`);
      }
    }

    this.inputBuffer = '';
    this.showPrompt();
    debugger;
    this.socketService.emit('terminal-write', command + '\r\n');
  }

  private navigateHistory(direction: number): void {
    this.historyIndex += direction;

    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.setInput('');
      return;
    }

    const command = this.commandHistory[this.historyIndex];
    this.setInput(command);
  }

  private setInput(text: string): void {
    // Clear current input
    while (this.inputBuffer.length > 0) {
      this.term.write('\b \b');
      this.inputBuffer = this.inputBuffer.slice(0, -1);
    }

    // Write new input
    this.inputBuffer = text;
    this.term.write(text);
  }

  private queueTerminalWrite(data: string): void {
    this.writeQueue.push(data);

    if (!this.writeScheduled) {
      this.writeScheduled = true;
      requestAnimationFrame(() => this.flushTerminalWrite());
    }
  }

  private flushTerminalWrite(): void {
    if (this.term) {
      const toWrite = this.writeQueue.join('');
      this.term.write(toWrite);
    }
    this.writeQueue = [];
    this.writeScheduled = false;
  }
}
