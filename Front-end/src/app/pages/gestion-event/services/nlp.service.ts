import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NlpService {
  private apiUrl = 'http://localhost:9091/api/events/nlp';

  constructor(private http: HttpClient) {}

  /**
   * Extract keywords from event description
   */
  extractKeywords(eventId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${eventId}/extract-keywords`, {});
  }

  /**
   * Extract keywords from event area description
   */
  extractEventAreaKeywords(eventAreaId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/event-area/${eventAreaId}/extract-keywords`, {});
  }
  /**
   * Preview text improvement without saving
   */
  previewImprovement(text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/preview-improvement`, { text });
  }

  /**
   * Generate an image based on the provided text
   */
  generateImage(text: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/generate-image`, { text },
      { responseType: 'blob' });
  }
}
