import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketPlaceComponent } from './market-place/market-place.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { over } from 'lodash';
import { OrderOverviewComponent } from './order-overview/order-overview.component';
import { Product } from '../models/product';
import { ProductDetailsComponent } from './product-details/product-details.component';

const routes: Routes = [
  {path:'market-place',component:MarketPlaceComponent},
  {path:'cart',component:CartComponent},
  {path:'checkout',component:CheckoutComponent},
  {path:'overview',component:OrderOverviewComponent},
  {path:'product-details/:id',component:ProductDetailsComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
