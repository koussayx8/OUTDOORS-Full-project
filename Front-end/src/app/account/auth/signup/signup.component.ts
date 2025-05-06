import { Component } from '@angular/core';
import {  FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

// Signup Component
export class SignupComponent {

  // set the currenr year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  emailError: string | null = null;
  registrationForm: FormGroup;  
  register!:RegistrationRequest;
  selectedImage: File | null = null;

  imageError: string | null = null;

  constructor(private authService: AuthServiceService, private router: Router) 
  {
    this.registrationForm = new FormGroup({
      nom: new FormControl('', [Validators.required]),
      prenom: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      motDePasse: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}')
      ]),
      image: new FormControl(''),
      tel: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{8}$') // Ensures exactly 8 digits
      ]),
      dateNaissance: new FormControl('', [this.dateInThePastValidator()]),
      role: new FormControl('USER', [Validators.required]), // default role
      location: new FormControl('') // only required if role is AGENT
    });
    
  }

  dateInThePastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight to compare dates without time component
  
      if (date >= today) {
        return { dateInThePast: 'Date of birth must be in the past' };
      }
      return null;
    };
  }

  onSubmit() {
    if (this.registrationForm.valid && this.selectedImage) {
      const formData = new FormData();
  
      formData.append('nom', this.registrationForm.get('nom')?.value);
      formData.append('prenom', this.registrationForm.get('prenom')?.value);
      formData.append('email', this.registrationForm.get('email')?.value);
      formData.append('motDePasse', this.registrationForm.get('motDePasse')?.value);
      formData.append('dateNaissance', this.registrationForm.get('dateNaissance')?.value);
      formData.append('tel', this.registrationForm.get('tel')?.value);
      formData.append('image', this.selectedImage); // the actual image file
      formData.append('role', this.registrationForm.get('role')?.value);
      if(this.registrationForm.get('location')){
        formData.append('location', this.registrationForm.get('location')?.value);
      }
      console.log(formData);

      this.authService.register(formData).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: 'Registration successful',
            text: 'You have been successfully registered.',
          });
          this.router.navigate(['/auth/twostep'], {
            queryParams: { email: this.registrationForm.get('email')?.value }
          });
        },
        (error) => {
          console.error('Registration failed', error);
        
          let errorMsg = 'Something went wrong. Please try again.';
        
          if (error) {
            if (error.error && typeof error.error === 'object' && error.error.message) {
              errorMsg = error.error.message;
            } else if (error.message) {
              errorMsg = error.message;
            } else {
              try {
                // Try parsing error body if it's a string
                const parsed = JSON.parse(error);
                if (parsed?.message) {
                  errorMsg = parsed.message;
                }
              } catch (e) {
                // If not JSON, fallback
                errorMsg = 'Something went wrong. Please try again.';
              }
            }
          }
        
          this.emailError = errorMsg;
        
          Swal.fire({
            icon: 'error',
            title: 'Registration failed',
            text: this.emailError,
          });
        }
        
        
      );
    } else {
      this.registrationForm.markAllAsTouched();
      if (!this.selectedImage) {
        this.imageError = 'Image is required.';
      }
    }
  }
  
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }
  
    /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

}