import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Task } from 'src/app/models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webReqServie: WebRequestService) { }

  createList(title: string){
    return this.webReqServie.post(`lists`, {title});
  }
 updateList(id: string, title: string){
    return this.webReqServie.patch(`lists/${id}`, {title});
  }
  updateTask(listId: string, taskid: string, title: string){
    return this.webReqServie.patch(`lists/${listId}/tasks/${taskid}`, {title});
  }
  getLists(){
    return this.webReqServie.get(`lists`);
  }
  
  deleteList(id: string){
    return this.webReqServie.delete(`lists/${id}`);
  } 
  deleteTask(listId: string, taskId: string) {
    return this.webReqServie.delete(`lists/${listId}/tasks/${taskId}`);
  }

  getTasks(listId: string){
    return this.webReqServie.get(`lists/${listId}/tasks`);
  }

  createTask(title: string, listId: string){
    return this.webReqServie.post(`lists/${listId}/tasks`, {title});
  }
  complete(task: Task){
    return this.webReqServie.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    });
  }
}
