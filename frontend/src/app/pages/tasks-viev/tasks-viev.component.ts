import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { List } from 'src/app/models/list.model';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-tasks-viev',
  templateUrl: './tasks-viev.component.html',
  styleUrls: ['./tasks-viev.component.scss']
})
export class TasksVievComponent implements OnInit {

  lists: List[];
  tasks: Task[];
  selectedListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        if(params.listId){
          this.selectedListId = params.listId;
          this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) =>{
            this.tasks = tasks;
          })
        } else {
          this.tasks = undefined;
        }
      }
    )

      this.taskService.getLists().subscribe((lists:List[])=>{
        this.lists = lists;
      }) 
  }
  onTaskClick(task: Task){
    this.taskService.complete(task).subscribe(() =>{
      console.log('completed!');
      task.completed = !task.completed;
    });
  }

  onDeleteListClick(){
    this.taskService.deleteList(this.selectedListId).subscribe((res: any) =>{
      this.router.navigate(['/lists']);
      console.log(res);
    })
  }
  onDeleteTaskClick(id: string){
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res: any) =>{
      this.tasks = this.tasks.filter(val => val._id !== id);
      console.log(res);
    })
  }
  onLogoutButtonClicked(){
    this.authService.logout();
  }
}
