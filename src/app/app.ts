import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { LibroService } from './services/libro.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private libroService = inject(LibroService);

  libros: any[] = [];
  nuevoLibro = { titulo: '', autor: '', genero: '', anio: new Date().getFullYear() };
  mensaje = '';
  error = '';
  guardando = false;
  libroEditandoId: string | null = null;

  ngOnInit(): void {
    this.cargarLibros();
  }

  cargarLibros(): void {
    this.libroService.getLibros().subscribe({
      next: (data) => this.libros = data,
      error: (err) => this.error = this.mensajeError(err, 'No se pudo cargar el catálogo.')
    });
  }

  guardarLibro(): void {
    if (this.guardando) return;

    this.error = '';
    this.mensaje = '';
    this.guardando = true;

    const liberarBoton = window.setTimeout(() => {
      this.guardando = false;
    }, 3000);

    const tituloGuardado = this.nuevoLibro.titulo;
    const operacion = this.libroEditandoId
      ? this.libroService.actualizarLibro(this.libroEditandoId, this.nuevoLibro)
      : this.libroService.crearLibro(this.nuevoLibro);

    operacion.pipe(finalize(() => {
      window.clearTimeout(liberarBoton);
      this.guardando = false;
    })).subscribe({
      next: (libroGuardado) => {
        if (this.libroEditandoId) {
          const idActualizando = this.libroEditandoId;
          this.libros = this.libros.map((libro) =>
            String(libro._id || libro.id) === idActualizando
              ? libroGuardado
              : libro
          );
          this.mensaje = `“${tituloGuardado}” se actualizó correctamente.`;
        } else {
          const creadoId = libroGuardado._id || libroGuardado.id;
          const otrosLibros = creadoId
            ? this.libros.filter((libro) => (libro._id || libro.id) !== creadoId)
            : this.libros;
          this.libros = [libroGuardado, ...otrosLibros];
          this.mensaje = `“${tituloGuardado}” se agregó correctamente al catálogo.`;
        }
        this.cancelarEdicion();
        this.cargarLibros();
      },
      error: (err) => {
        const detalles = err.error?.errors
          ? Object.values(err.error.errors).flat().join(' ')
          : '';
        this.error = this.mensajeError(err, detalles || 'No se pudo guardar el libro.');
      }
    });
  }

  editar(libro: any): void {
    const id = libro._id || libro.id;
    if (!id) return;

    this.libroEditandoId = String(id);
    this.nuevoLibro = {
      titulo: libro.titulo || libro.title || '',
      autor: libro.autor || libro.author || '',
      genero: libro.genero || libro.genre || '',
      anio: libro.anio || libro.published_year || new Date().getFullYear(),
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion(): void {
    this.libroEditandoId = null;
    this.nuevoLibro = { titulo: '', autor: '', genero: '', anio: new Date().getFullYear() };
    this.guardando = false;
  }

  borrar(id?: string): void {
    if (!id) return;
    this.error = '';
    this.mensaje = '';

    this.libroService.eliminarLibro(id).subscribe({
      next: () => {
        this.libros = this.libros.filter((libro) => String(libro._id || libro.id) !== String(id));
        this.mensaje = 'Libro eliminado correctamente.';
        if (this.libroEditandoId === String(id)) this.cancelarEdicion();
        this.cargarLibros();
      },
      error: (err) => this.error = this.mensajeError(err, 'No se pudo eliminar el libro.')
    });
  }

  mensajeError(error: any, mensaje: string): string {
    if (error?.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en responder. Verifica que Laravel y MongoDB estén ejecutándose.';
    }
    if (error?.status === 0) {
      return 'No hay conexión con Laravel. Verifica que el backend esté disponible en http://localhost:8002.';
    }
    if (error?.error?.errors) {
      return Object.values(error.error.errors).flat().join(' ');
    }
    return error?.error?.message || mensaje;
  }
}