import { Injectable } from '@angular/core';
              import { HttpClient } from '@angular/common/http';
              import { Post } from '../models/post.model';
              import { Observable, throwError } from 'rxjs';
              import { catchError, map } from 'rxjs/operators';
import {Media} from "../models/media.model";



import {co} from "@fullcalendar/core/internal-common";

              @Injectable({
                providedIn: 'root'
              })
              export class PostService {
                private apiUrl = 'http://localhost:9090/post'; // Your Spring Boot endpoint

                constructor(private http: HttpClient) { }

                // Create a new post with multipart/form-data
createPost(post: Post, mediaFiles?: File[]): Observable<Post> {
  const formData = new FormData();

  // Add basic post data
  formData.append('content', post.content || '');
  formData.append('userId', post.userId?.toString() || '');
  formData.append('username', post.username || '');
  formData.append('email', post.email || '');

  // Add media files if they exist
  if (mediaFiles && mediaFiles.length > 0) {
    mediaFiles.forEach(file => {
      formData.append('mediaFiles', file);
    });
  }

  // The API already handles content toxicity checking on the backend
  return this.http.post<Post>(`${this.apiUrl}/add`, formData).pipe(
    catchError(error => {
      console.error('Error creating post:', error);
      if (error.status === 400 && error.error?.errorType === 'TOXIC_CONTENT') {
        return throwError(() => new Error('TOXIC_CONTENT'));
      } else if (error.status === 400 && error.error?.errorType === 'TOXIC_IMAGE') {
        return throwError(() => new Error('TOXIC_IMAGE'));
      }
      return throwError(() => error);
    })
  );
}


// Get all posts
                getPosts(): Observable<Post[]> {
                  return this.http.get<Post[]>(`${this.apiUrl}/all`);
                }

                // Get posts by user ID
                getUserPosts(userId: number): Observable<Post[]> {
                  return this.http.get<Post[]>(`${this.apiUrl}/user/${userId}`)
                    .pipe(
                      map((posts: Post[]) => posts.map((post: Post) => ({
                        ...post,
                        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
                      }))),
                      catchError(error => {
                        console.error('Error fetching user posts:', error);
                        return throwError(() => new Error('Failed to load user posts. Please try again later.'));
                      })
                    );
                }


                // Add this method to post.service.ts

// Delete a post
                deletePost(postId: string): Observable<void> {
                  return this.http.delete<void>(`${this.apiUrl}/${postId}`).pipe(
                    catchError(error => {
                      console.error('Error deleting post:', error);
                      return throwError(() => new Error('Failed to delete post. Please try again later.'));
                    })
                  );
                }



                // Add this method to post.service.ts
                updatePost(
                  postId: string,
                  content: string,
                  mediaFiles?: File[],
                  mediaTypes?: string[],
                  mediaToDelete?: string[],
                  hasMedia?: boolean
                ): Observable<Post> {
                  const formData = new FormData();
                  formData.append('content', content || '');

                  if (hasMedia !== undefined) {
                    formData.append('hasMedia', hasMedia.toString());
                  }

                  if (mediaFiles && mediaFiles.length > 0) {
                    mediaFiles.forEach(file => {
                      formData.append('mediaFiles', file);
                    });
                  }

                  if (mediaTypes && mediaTypes.length > 0) {
                    mediaTypes.forEach(type => {
                      formData.append('mediaTypes', type);
                    });
                  }

                  if (mediaToDelete && mediaToDelete.length > 0) {
                    mediaToDelete.forEach(mediaId => {
                      formData.append('mediaToDelete', mediaId);
                    });
                  }

                  return this.http.put<Post>(`${this.apiUrl}/${postId}`, formData).pipe(
                    catchError(error => {
                      console.error('Error updating post:', error);
                      return throwError(() => new Error('Failed to update post. Please try again later.'));
                    })
                  );
                }
                 getUserMedia(userId: number): Observable<Media[]> {
                  return this.http.get<Media[]>(`${this.apiUrl}/${userId}/media`).pipe(
                    catchError(error => {
                      console.error('Error fetching user media:', error);
                      return throwError(() => new Error('Failed to load media'));
                    })
                  );
                }
                getPostById(postId: string): Observable<Post> {
                  return this.http.get<Post>(`${this.apiUrl}/${postId}`).pipe(
                    map((post: Post) => ({
                      ...post,
                      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
                    })),
                    catchError(error => {
                      console.error('Error fetching post:', error);
                      return throwError(() => new Error('Failed to load post details.'));
                    })
                  );
                }


                getTopRatedPosts(): Observable<any[]> {
                  return this.http.get<any[]>(`${this.apiUrl}/top-rated-posts`);
                }



                generateContent(description: string, contentType: string): Observable<any> {
                  const params = {
                    description: description,
                    contentType: contentType
                  };
                  return this.http.post(`${this.apiUrl}`, null, { params });
                }

                checkContentStatus(postId: string): Observable<any> {
                  return this.http.get(`${this.apiUrl}/content-status/${postId}`);
                }

                getPostsByUserId(userId: number) {
                  return this.http.get<Post[]>(`${this.apiUrl}/user/${userId}`);
                }

                // Add these methods to your post.service.ts

                // Method to translate text
                translateText(text: string, targetLang: string): Observable<any> {
                  const requestBody = {
                    text: text,
                    targetLang: targetLang
                  };
                  return this.http.post<any>(`${this.apiUrl}/translate`, requestBody).pipe(
                    catchError(error => {
                      console.error('Error translating text:', error);
                      return throwError(() => new Error('Failed to translate text. Please try again later.'));
                    })
                  );
                }

                // Method to get available languages for translation
                getAvailableLanguages(): Observable<Map<string, string>> {
                  return this.http.get<Map<string, string>>(`${this.apiUrl}/languages`).pipe(
                    catchError(error => {
                      console.error('Error fetching available languages:', error);
                      return throwError(() => new Error('Failed to load available languages.'));
                    })
                  );
                }


// Method to analyze text sentiment
analyzeText(text: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/analyze`, text, {
    responseType: 'text'
  }).pipe(
    catchError(error => {
      console.error('Error analyzing text:', error);
      return throwError(() => new Error('Failed to analyze text. Please try again later.'));
    })
  );
}



              }
