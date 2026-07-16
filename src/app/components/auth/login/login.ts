import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

import { TranslateModule } from "@ngx-translate/core";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

import { Alert } from "../../../shared/components/ui/alert/alert";
import { Button } from "../../../shared/components/ui/button/button";
import { IValues } from "../../../shared/interface/setting.interface";
import { LoginAction } from "../../../shared/store/action/auth.action";
import { SettingState } from "../../../shared/store/state/setting.state";
import { AuthState } from "../../../shared/store/state/auth.state";
import { AuthService } from "../../../shared/services/auth.service";

@Component({
  selector: "app-login",
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    Alert,
    Button,
    AsyncPipe,
  ],
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
})
export class Login {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  public form: FormGroup;

  setting$: Observable<IValues> = inject(Store).select(
    SettingState.setting,
  ) as Observable<IValues>;

  constructor() {
    this.form = this.formBuilder.group({
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [Validators.required]),
    });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      // Call AuthService.login() which makes the API request and handles errors
      this.authService.login(this.form.value.email, this.form.value.password);
    }
  }
}
