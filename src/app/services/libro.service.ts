import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LibroService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8002/api/books';

  getLibros(): Observable<any[]> {
    return this.http.get<{ data: any[] } | any[]>(this.apiUrl).pipe(
      timeout(10000),
      map((response) => Array.isArray(response) ? response : (response.data ?? []))
    );
  }

  crearLibro(libro: any): Observable<any> {
    return this.http.post<{ data: any }>(this.apiUrl, this.prepararPayload(libro)).pipe(
      timeout(10000),
      map((response) => response.data ?? response)
    );
  }

  actualizarLibro(id: string, libro: any): Observable<any> {
    return this.http.put<{ data: any }>(`${this.apiUrl}/${id}`, this.prepararPayload(libro)).pipe(
      timeout(10000),
      map((response) => response.data ?? response)
    );
  }

  eliminarLibro(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(timeout(10000));
  }

  private prepararPayload(libro: any): any {
    return {
      title: libro.titulo ?? libro.title,
      author: libro.autor ?? libro.author,
      genre: libro.genero ?? libro.genre ?? null,
      published_year: libro.anio ?? libro.published_year ?? null,
    };
  }
}