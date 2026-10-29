import '@angular/compiler';
import { Component, ChangeDetectorRef, enableProdMode, inject, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { expose, makeTasks } from '../shared/tasks.js';
enableProdMode();
@Component({
  selector: 'todo-app', standalone: true, imports: [CommonModule, FormsModule],
  template: `
  <main class="workspace">
    <form class="add-task" (ngSubmit)="add()">
      <input aria-label="Task name" placeholder="What needs to get done?" [(ngModel)]="name" name="name" maxlength="160" required>
      <select aria-label="Task priority" [(ngModel)]="priority" name="priority"><option>High</option><option>Medium</option><option>Low</option></select>
      <button type="submit">+ Add task</button>
    </form>
    <div class="list-heading"><span>TASK NAME</span><span>PRIORITY</span><span>ACTION</span></div>
    <div class="task-list"><div class="task-row" *ngFor="let task of tasks; trackBy: trackId" [attr.data-id]="task.id">
      <input aria-label="Edit task name" [(ngModel)]="task.name" maxlength="160">
      <select aria-label="Edit priority" [(ngModel)]="task.priority" [class]="task.priority.toLowerCase()"><option>High</option><option>Medium</option><option>Low</option></select>
      <button [attr.aria-label]="'Delete ' + task.name" class="delete" (click)="remove(task.id)">×</button>
    </div></div>
    <p *ngIf="!tasks.length" class="empty">All clear. Add a task to get started.</p>
    <footer><span>{{tasks.length}} tasks</span><span>Changes save in this session · Edit any field directly</span></footer>
  </main>`
})
class TodoApp {
  tasks = makeTasks(8);
  name = '';
  priority = 'Medium';
  cdr = inject(ChangeDetectorRef);
  constructor() {
    expose(async next => { this.tasks = next; this.cdr.detectChanges(); await Promise.resolve(); this.cdr.detectChanges(); }, () => this.tasks);
  }
  trackId(_index: number, task: { id: number }) { return task.id; }
  add() {
    if (!this.name.trim()) return;
    this.tasks = [...this.tasks, { id: Math.max(0, ...this.tasks.map(t => t.id)) + 1, name: this.name.trim(), priority: this.priority }];
    this.name = '';
  }
  remove(id: number) { this.tasks = this.tasks.filter(t => t.id !== id); }
}
document.getElementById('app')!.innerHTML = '<todo-app></todo-app>';
bootstrapApplication(TodoApp, { providers: [provideZonelessChangeDetection()] }).catch(error => { console.error(error); document.getElementById('app')!.textContent = 'Unable to start Angular.'; });
