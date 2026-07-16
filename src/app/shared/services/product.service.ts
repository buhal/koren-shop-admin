import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

import { Observable } from "rxjs";

import { environment } from "../../../environments/environment.development";
import { Store } from "@ngxs/store";
import { Params } from "../interface/core.interface";
import { IProduct, IProductModel } from "../interface/product.interface";
import { AuthState } from "../store/state/auth.state";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private http = inject(HttpClient);
  private store = inject(Store);

  private getToken(): string | null {
    return this.store.selectSnapshot(AuthState.accessToken);
  }

  getProducts(payload?: Params): Observable<IProductModel> {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.get<IProductModel>(`http://localhost:3000/api/products`, {
      headers,
    });
  }

  createProduct(payload: IProduct): Observable<IProductModel> {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.post<IProductModel>(
      `http://localhost:3000/api/products`,
      payload,
      { headers },
    );
  }

  deleteProduct(id: number): Observable<void> {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.delete<void>(`http://localhost:3000/api/products/${id}`, {
      headers,
    });
  }

  deleteAllProducts(ids: number[]): Observable<void> {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.delete<void>(`http://localhost:3000/api/products`, {
      body: { ids },
      headers,
    });
  }
}
