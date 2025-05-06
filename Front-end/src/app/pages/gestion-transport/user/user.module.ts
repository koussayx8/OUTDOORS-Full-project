import { VehiculeListComponent } from './vehicule-list/vehicule-list/vehicule-list.component';
import { VehiculeDetailsComponent } from './vehicule-details/vehicule-details.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { FormsModule } from '@angular/forms'; 
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LocationFormComponent } from './location-form/location-form.component';
import { ReservationsComponent } from './reservations/reservations.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { PaginationModule } from 'ngx-bootstrap/pagination';


@NgModule({
  declarations: [
    VehiculeListComponent,
    VehiculeDetailsComponent,
    LocationFormComponent,
    ReservationsComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    AccordionModule.forRoot(),
    FormsModule,
    SlickCarouselModule, 
    RouterModule,
    ReactiveFormsModule,
    NgxSliderModule,
    AccordionModule.forRoot(),
    PaginationModule.forRoot(),
  ]
})
export class UserModule { }
