import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { PCategorie } from '../../models/PCategorie';
import { PCategoryService } from '../../services/pcategory.service';
import { image } from 'ngx-editor/schema/nodes';
import { FileUploadService } from '../../services/cloudinary.service';
import { switchMap, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductImageService } from '../../services/product-image.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  styles: [`
    .product-image-transition {
      transition: all 0.3s ease;
    }

    .btn-light.rounded-circle {
      background-color: rgba(255, 255, 255, 0.7);
      border: none;
    }

    .btn-light.rounded-circle:hover {
      background-color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class ProductListComponent implements OnInit {
  @ViewChild('showModal', { static: false }) showModal?: ModalDirective;
  @ViewChild('deleteRecordModal') deleteRecordModal?: ModalDirective;
  // Add the missing ViewChild for addModal
  @ViewChild('addModal') addModal?: ModalDirective;
  @ViewChild('deleteImageModal') deleteImageModal?: ModalDirective;
  @ViewChild('setMainImageModal') setMainImageModal?: ModalDirective;

  productForm: FormGroup;
  products: Product[] = [];
  allproducts: Product[] = [];
  term: string = '';
  deleteId: number = 0;
  masterSelected: boolean = false;
  items: any[] = [];
  uploadedFiles: any[] = [];
  categories: PCategorie[] = [];
  selectedCategory: string = '';
  currentImage: string | null = null;
  selectedFile: File | null = null;
  currentProduct?: Product;
  isFormValid: boolean = false;

  // Add property for image URL
  imageBasePath = 'http://localhost:9093/uploads/';

  // Dropzone config
  dropzoneConfig = {
    url: 'your-upload-url',
    maxFilesize: 2,
    acceptedFiles: 'image/*',
    addRemoveLinks: true
  };

  // Add these properties
  sortDirection: 'asc' | 'desc' = 'asc';
  currentSortColumn: string | null = null;

  // Ajouter ces propriétés
  selectedFiles: File[] = [];
  newImagePreviewUrls: string[] = [];
  productGalleryImages: any[] = [];

  // Ajout de ces propriétés dans votre classe
  imageToDelete: number = 0;
  imageUrlToSetAsMain: string = '';

  // Remove duplicate declarations and keep only one of each
  // These declarations already exist earlier in the code, so this block is removed.
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private pCategoryService: PCategoryService,
    private fileUploadService: FileUploadService,
    private productImageService: ProductImageService  // Add this line
  ) {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required]],
      descriptionProduit: ['', [Validators.required, Validators.minLength(10)]],
      prixProduit: ['', [Validators.required, Validators.min(0)]],
      stockProduit: ['', [Validators.required, Validators.min(1)]],
      categorie: [null],
      imageProduit: [null]
    });
  }

  ngOnInit(): void {
    // Initialiser des tableaux vides pour éviter les erreurs
    this.allproducts = [];
    this.products = [];
    this.categories = [];

    // Charger les données
    this.loadCategories();
    this.loadProducts();

    // Initialiser le formulaire avec validation
    this.initProductForm();
  }

  // Nouvelle méthode pour initialiser le formulaire avec validation
  initProductForm(): void {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required]],
      descriptionProduit: ['', [Validators.required, Validators.minLength(10)]],
      prixProduit: ['', [Validators.required, Validators.min(0)]],
      stockProduit: ['', [Validators.required, Validators.min(1)]],
      categorie: [null],
      imageProduit: [null]
    });

    // Monitor form validity changes
    this.productForm.valueChanges.subscribe(() => {
      this.isFormValid = this.productForm.valid;
    });
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.allproducts = data;  // Stocke tous les produits

        // Précharge les images pour chaque produit
        this.allproducts.forEach(product => {
          this.loadProductImages(product);
        });

        this.applyPagination(); // Applique la pagination
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.allproducts = [];
        this.products = [];
      }
    });
  }

  loadCategories(): void {
    this.pCategoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  filterdata(): void {
    if (!this.term) {
      // Si le terme de recherche est vide, réinitialisez la liste paginée
      this.applyPagination();
      return;
    }

    // Filtrer tous les produits
    const filteredProducts = this.allproducts.filter(product =>
      product.nomProduit.toLowerCase().includes(this.term.toLowerCase()) ||
      (product.descriptionProduit && product.descriptionProduit.toLowerCase().includes(this.term.toLowerCase())) ||
      product.prixProduit.toString().includes(this.term)
    );

    // Mettre à jour la liste paginée avec les résultats filtrés
    this.products = filteredProducts;

    // Réinitialiser la pagination
    this.currentPage = 1;
  }

  filterByCategory(): void {
    if (!this.selectedCategory) {
      // Si aucune catégorie n'est sélectionnée, affichez tous les produits
      this.applyPagination();
      return;
    }

    // Filtrer par ID de catégorie
    const filteredProducts = this.allproducts.filter(product =>
      product.categorie?.idCategorie?.toString() === this.selectedCategory.toString()
    );

    // Mettre à jour la liste paginée
    this.products = filteredProducts;

    // Réinitialiser la pagination
    this.currentPage = 1;
  }

  onSort(column: string): void {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    this.products = [...this.products].sort((a, b) => {
      const multiplier = this.sortDirection === 'asc' ? 1 : -1;

      switch (column) {
        case 'prixProduit':
        case 'stockProduit':
          return (a[column] - b[column]) * multiplier;

        case 'categorie':
          const catA = a.categorie?.nomCategorie || '';
          const catB = b.categorie?.nomCategorie || '';
          return catA.localeCompare(catB) * multiplier;

        case 'dateCreation':
          const dateA = new Date(a.dateCreation).getTime();
          const dateB = new Date(b.dateCreation).getTime();
          return (dateA - dateB) * multiplier;

        default:
          const valA = String(a[column as keyof Product] || '');
          const valB = String(b[column as keyof Product] || '');
          return valA.localeCompare(valB) * multiplier;
      }
    });
  }

  checkUncheckAll(event: any): void {
    this.products.forEach(product => product.states = event.target.checked);
  }

  onCheckboxChange(event: any): void {
    const selectedCount = this.products.filter(product => product.states).length;
    this.masterSelected = selectedCount === this.products.length;
  }

  // Mettre à jour la méthode editList
  editList(index: number): void {
    const product = this.products[index];
    if (product) {
      this.currentProduct = { ...product }; // Clone to avoid direct reference
      this.currentImage = product.imageProduit;

      // Reset image properties
      this.selectedFiles = [];
      this.newImagePreviewUrls = [];

      // Load gallery images using productImageService
      this.productImageService.getImagesByProductId(product.idProduit).subscribe({
        next: (images) => {
          this.productGalleryImages = images;
        },
        error: (error) => console.error('Error loading product images:', error)
      });

      // Update form with current product values - after the form is created
      this.productForm.patchValue({
        nomProduit: product.nomProduit || '',
        descriptionProduit: product.descriptionProduit || '',
        prixProduit: product.prixProduit || 0,
        stockProduit: product.stockProduit || 0,
        categorie: product.categorie || null
      });

      // Mark form as pristine and untouched after setting initial values
      this.productForm.markAsPristine();
      this.productForm.markAsUntouched();

      this.showModal?.show();
    }
  }

  // Mettre à jour la méthode onFileSelected
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validation du type de fichier
        if (!file.type.startsWith('image/')) {
          console.error('Please select only image files');
          continue;
        }

        // Validation de la taille (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          console.error('File size must not exceed 5MB');
          continue;
        }

        this.selectedFiles.push(file);

        // Afficher l'aperçu
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newImagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Ajouter méthode pour enlever une nouvelle image
  removeNewImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.newImagePreviewUrls.splice(index, 1);
  }

  // Ajouter méthode pour enlever une image existante
  showRemoveImageConfirm(imageId: number): void {
    this.imageToDelete = imageId;
    this.deleteImageModal?.show();
  }

  // Ajouter cette méthode pour effectuer la suppression après confirmation
  confirmRemoveImage(): void {
    this.productImageService.deleteProductImage(this.imageToDelete).subscribe({
      next: () => {
        this.productGalleryImages = this.productGalleryImages.filter(img => img.idImage !== this.imageToDelete);
        this.deleteImageModal?.hide();
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.deleteImageModal?.hide();
      }
    });
  }

  // Ajouter méthode pour définir une image comme principale
  showSetMainImageConfirm(imageUrl: string): void {
    this.imageUrlToSetAsMain = imageUrl;
    this.setMainImageModal?.show();
  }

  // Ajouter cette méthode pour définir l'image principale après confirmation
  confirmSetMainImage(): void {
    if (!this.currentProduct) {
      this.setMainImageModal?.hide();
      return;
    }

    // Find the image in the gallery to get its ID
    const imageToSet = this.productGalleryImages.find(img => img.imageUrl === this.imageUrlToSetAsMain);
    if (imageToSet) {
      // Use productImageService to set as main
      this.productImageService.setMainProductImage(this.currentProduct.idProduit, imageToSet.idImage).subscribe({
        next: () => {
          // Update local data
          this.currentImage = this.imageUrlToSetAsMain;
          if (this.currentProduct) {
            this.currentProduct.imageProduit = this.imageUrlToSetAsMain;
          }
          this.setMainImageModal?.hide();
        },
        error: (error) => {
          console.error('Error setting main image:', error);
          this.setMainImageModal?.hide();
        }
      });
    } else {
      // Fallback to the old approach if needed
      const updateData = {
        ...this.currentProduct,
        imageProduit: this.imageUrlToSetAsMain
      };

      this.productService.updateProduct(this.currentProduct.idProduit, updateData).subscribe({
        next: (response) => {
          this.currentImage = this.imageUrlToSetAsMain;
          this.currentProduct = response;
          this.setMainImageModal?.hide();
        },
        error: (error) => {
          console.error('Error updating main image:', error);
          this.setMainImageModal?.hide();
        }
      });
    }
  }

  // Mettre à jour la méthode saveProduct pour gérer les images multiples
  saveProduct(): void {
    if (!this.currentProduct) {
      return;
    }

    // Mark all form controls as touched to trigger validation display
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });

    // Check if form is valid
    if (this.productForm.invalid) {
      console.error('Form is invalid. Please check all fields.');
      return;
    }

    // Get form values
    const formValues = this.productForm.value;

    const updateData = {
      idProduit: this.currentProduct.idProduit,
      nomProduit: formValues.nomProduit,
      descriptionProduit: formValues.descriptionProduit,
      prixProduit: formValues.prixProduit,
      stockProduit: formValues.stockProduit,
      categorie: formValues.categorie || this.currentProduct.categorie,
      imageProduit: this.currentProduct.imageProduit
    };

    if (this.selectedFiles.length > 0) {
      this.fileUploadService.uploadMultipleFiles(this.selectedFiles).pipe(
        switchMap(imageUrls => {
          if (imageUrls.length > 0) {
            // Mettre à jour l'image principale avec la première nouvelle image si demandé
            if (!this.currentImage) {
              updateData.imageProduit = imageUrls[0];
            }

            return this.productService.updateProduct(this.currentProduct!.idProduit, updateData).pipe(
              switchMap(updatedProduct => {
                // Ajouter les images restantes à la galerie
                if (imageUrls.length > (this.currentImage ? 0 : 1)) {
                  const galleryImages = this.currentImage ? imageUrls : imageUrls.slice(1);
                  const addImageRequests = galleryImages.map(url =>
                    // Use productImageService instead of productService
                    this.productImageService.addImageToProduct(updatedProduct.idProduit, url)
                  );
                  return forkJoin(addImageRequests).pipe(map(() => updatedProduct));
                }
                return of(updatedProduct);
              })
            );
          }
          return this.productService.updateProduct(this.currentProduct!.idProduit, updateData);
        })
      ).subscribe({
        next: (response) => {
          this.showModal?.hide();
          this.loadProducts();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating product:', error);
        }
      });
    } else {
      this.productService.updateProduct(this.currentProduct.idProduit, updateData)
        .subscribe({
          next: (response) => {
            this.showModal?.hide();
            this.loadProducts();
            this.resetForm();
          },
          error: (error) => {
            console.error('Error updating product:', error);
          }
        });
    }
  }

  private resetForm(): void {
    this.productForm.reset();
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    this.currentProduct = undefined;
    this.selectedFile = null;
    this.currentImage = null;
  }

  removeItem(id: number): void {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  deleteData(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts(); // Refresh the list
        this.deleteRecordModal?.hide();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
      }
    });
  }

  onUploadSuccess(event: any): void {
    const [file] = event;
    this.uploadedFiles.push(file);
  }

  removeFile(file: any): void {
    const index = this.uploadedFiles.indexOf(file);
    if (index !== -1) {
      this.uploadedFiles.splice(index, 1);
    }
  }

  pageChanged(event: any): void {
    this.currentPage = event.page;
    this.applyPagination();
  }

  navigateToAddProduct() {
    // Show the add modal instead of navigating
    this.addModal?.show();
  }

  refreshProducts() {
    this.addModal?.hide();
    this.loadProducts(); // Changed to use the existing loadProducts method
  }

  // Add these methods to your class
  navigateProductImage(product: any, direction: 'prev' | 'next', event: Event): void {
    // Prevent the click event from bubbling up to parent elements
    event.stopPropagation();

    if (!product.imageGallery) {
      // Load product images if not already loaded
      this.loadProductImages(product);
      return;
    }

    if (!product.currentImageIndex) {
      product.currentImageIndex = 0;
    }

    const totalImages = this.getImageCount(product);

    if (direction === 'next') {
      product.currentImageIndex = (product.currentImageIndex + 1) % totalImages;
    } else {
      product.currentImageIndex = (product.currentImageIndex - 1 + totalImages) % totalImages;
    }
  }

  getImageCount(product: any): number {
    // Count main image + gallery images
    let count = 1; // Start with 1 for the main image
    if (product.imageGallery && product.imageGallery.length > 0) {
      // Add gallery images (but avoid counting main image twice if it's in gallery)
      const mainImageInGallery = product.imageGallery.some(
        (img: any) => img.imageUrl === product.imageProduit
      );
      count = mainImageInGallery ? product.imageGallery.length : product.imageGallery.length + 1;
    }
    return count;
  }

  loadProductImages(product: any): void {
    if (!product.imageGallery) {
      this.productImageService.getImagesByProductId(product.idProduit).subscribe({
        next: (images) => {
          // Create a combined array with main image first if it's not in gallery
          const mainImageInGallery = images.some(img => img.imageUrl === product.imageProduit);

          if (!mainImageInGallery && product.imageProduit) {
            // Create a pseudo image object for the main image
            const mainImage = {
              idImage: -1, // Use negative to indicate it's not from DB
              imageUrl: product.imageProduit,
              displayOrder: 0
            };
            product.imageGallery = [mainImage, ...images];
          } else {
            // Just use gallery images, sorted by display order
            product.imageGallery = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
          }

          product.currentImageIndex = 0;
        },
        error: (error) => {
          console.error('Error loading product images:', error);
          // Create a fallback gallery with just the main image
          product.imageGallery = [{
            idImage: -1,
            imageUrl: product.imageProduit,
            displayOrder: 0
          }];
          product.currentImageIndex = 0;
        }
      });
    }
  }

  getImageToDeleteUrl(): string | undefined {
    if (!this.imageToDelete || !this.productGalleryImages) return undefined;
    const image = this.productGalleryImages.find(img => img.idImage === this.imageToDelete);
    return image?.imageUrl;
  }

  hideDeleteModal(): void {
    this.deleteImageModal?.hide();
  }

  hideSetMainModal(): void {
    this.setMainImageModal?.hide();
  }

  // Méthode pour appliquer la pagination
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    let endIndex = startIndex + this.itemsPerPage;

    if (endIndex > this.allproducts.length) {
      endIndex = this.allproducts.length;
    }

    this.products = this.allproducts.slice(startIndex, endIndex);
  }

  initForm(): void {
    // Add your form initialization logic here
    // For example:
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, Validators.min(0)],
      // Add other form controls
    });
  }
}
