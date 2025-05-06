import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ForumPostComponent} from "./forum-post/forum-post.component";
import {MesPostsComponent} from "./mes-posts/mes-posts.component";

const routes: Routes = [
  {path:"forumpost",component:ForumPostComponent},
  {path:"mesPost",component:MesPostsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
