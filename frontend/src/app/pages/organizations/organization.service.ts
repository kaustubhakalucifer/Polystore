import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from './organization.interface';
import { DataResponse } from '../../core/dtos/api-response.dto';
import { environment } from '../../../environments/environment';

// Alias DataResponse to ApiResponse to match prompt requirement
export type ApiResponse<T> = DataResponse<T>;

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/organizations`;

  getOrganizations(): Observable<ApiResponse<Organization[]>> {
    return this.http.get<ApiResponse<Organization[]>>(this.apiUrl);
  }

  createOrganization(name: string): Observable<ApiResponse<Organization>> {
    return this.http.post<ApiResponse<Organization>>(this.apiUrl, { name });
  }
}
