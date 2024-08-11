import { afterNextRender, Component, computed, effect, inject, Injector, OnInit, signal } from '@angular/core';
import { CoursesService } from "../services/courses.service";
import { Course, sortCoursesBySeqNo } from "../models/course.model";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { CoursesCardListComponent } from "../courses-card-list/courses-card-list.component";
import { MatDialog } from "@angular/material/dialog";
import { MessagesService } from "../messages/messages.service";
import { catchError, from, throwError } from "rxjs";
import { toObservable, toSignal, outputToObservable, outputFromObservable } from "@angular/core/rxjs-interop";
import { CoursesServiceWithFetch } from '../services/courses-fetch.service';
import { openEditCourseDialog } from '../edit-course-dialog/edit-course-dialog.component';
import { LoadingService } from '../loading/loading.service';

type Counter = {
  value: number;
}

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    CoursesCardListComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  #courses = signal<Course[]>([]);
  coursesService = inject(CoursesService);
  dialog = inject(MatDialog);
  loadingService = inject(LoadingService);
  messageService = inject(MessagesService);

  beginnersCourses = computed(() => {
    const cousers = this.#courses();
    return cousers.filter(course => course.category === "BEGINNER");
  });

  advancedCourses = computed(() => {
    const cousers = this.#courses();
    return cousers.filter(course => course.category === "ADVANCED");
  });

  constructor() {

    effect(() => {
      console.log(`Beginners courses: `, this.beginnersCourses());
      console.log(`Advanced courses: `, this.advancedCourses());
    });

    this.loadCourses()
      .then(() => {
        console.log("Carregado com sucesso!!");
        console.log(this.#courses())
      });

  }

  async loadCourses() {
    try {
      const courses = await this.coursesService.loadAllCourses();
      this.#courses.set(courses.sort(sortCoursesBySeqNo));
    } catch (err) {
      this.messageService.showMessage("Error loading courese!", "error");
      alert("Erro");
    }
  }

  onCourseUpdated(updatedCourse: any) {
    const courses = this.#courses();
    const newCourses = courses.map(course => (
      course.id === updatedCourse.id ? updatedCourse : course
    ));
    this.#courses.set(newCourses);
  }

  async onCourseDeleted(courseId: string) {
    try {
      await this.coursesService.deleteCourse(courseId);
      const courses = this.#courses();
      const newCourses = courses.filter((course) => course.id !== courseId);
      this.#courses.set(newCourses);
    } catch (err) {
      console.log(err);
    }
  }

  async onAddCourse() {
    const newCourse = await openEditCourseDialog(this.dialog, {
      mode: "create",
      title: "Create new course"
    });

    const newCourses = [
      ...this.#courses(),
      newCourse
    ];
    this.#courses.set(newCourses);
  }
}
