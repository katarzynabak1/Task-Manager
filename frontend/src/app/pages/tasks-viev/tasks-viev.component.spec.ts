import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksVievComponent } from './tasks-viev.component';

describe('TasksVievComponent', () => {
  let component: TasksVievComponent;
  let fixture: ComponentFixture<TasksVievComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TasksVievComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksVievComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
