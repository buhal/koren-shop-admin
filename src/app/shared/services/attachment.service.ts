import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

import { from, Observable, switchMap } from "rxjs";

import { environment } from "../../../environments/environment.development";
import {
  IAttachment,
  IAttachmentModel,
} from "../interface/attachment.interface";
import { Params } from "../interface/core.interface";
import { Store } from "@ngxs/store";
import { AuthState } from "../store/state/auth.state";

@Injectable({
  providedIn: "root",
})
export class AttachmentService {
  private http = inject(HttpClient);
  private store = inject(Store);

  private getToken(): string | null {
    return this.store.selectSnapshot(AuthState.accessToken);
  }

  getAttachments(payload?: Params): Observable<IAttachmentModel> {
    const token = this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.get<IAttachmentModel>(`${environment.URL}/attachments`, {
      params: payload,
      headers,
    });
  }
  // write a create attachment function that takes IAttachment and sends a file with the name of the
  // attachment id.
  createAttachment(attachment: IAttachment): Observable<IAttachment> {
    const fileUrl = attachment.original_url || attachment.asset_url;

    if (!fileUrl) {
      return new Observable((observer) => {
        observer.error(new Error("Attachment has no file URL"));
      });
    }

    return from(fetch(fileUrl)).pipe(
      switchMap((response) => response.blob()),
      switchMap((blob) => {
        const ext = attachment.file_name?.match(/\.[^.]+$/)?.[0] ?? "";
        const fileName = `${attachment.id}${ext}`;

        const file = new File([blob], fileName, {
          type: blob.type || "application/octet-stream",
        });

        const formData = new FormData();
        formData.append("file", file, fileName);

        const token = this.getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        return this.http.post<IAttachment>(
          "http://localhost:3000/api/attachments",
          formData,
          { headers },
        );
      }),
    );
  }
}
