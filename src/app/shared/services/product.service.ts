import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

import { Observable } from "rxjs";

import { environment } from "../../../environments/environment.development";
import { Params } from "../interface/core.interface";
import { IProduct, IProductModel } from "../interface/product.interface";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private http = inject(HttpClient);

  getProducts(payload?: Params): Observable<IProductModel> {
    return this.http.get<IProductModel>(`http://localhost:3000/api/products`);
  }

  createProduct(payload: IProduct): Observable<IProductModel> {
    return this.http.post<IProductModel>(
      `http://localhost:3000/api/products`,
      payload,
    );
  }
}
