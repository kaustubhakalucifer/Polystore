import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DataResponse } from '../dtos/api-response.dto';
import { PaginatedResult, PaginationQueryDto, User } from '../dtos/user.dto';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getUsers(query: PaginationQueryDto): Observable<DataResponse<PaginatedResult<User>>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);

    return this.http.get<DataResponse<PaginatedResult<User>>>(`${this.apiUrl}/users`, { params });
  }

  approveUser(id: string): Observable<DataResponse<User>> {
    return this.http.patch<DataResponse<User>>(`${this.apiUrl}/users/${id}/approve`, {});
  }

  rejectUser(id: string): Observable<DataResponse<User>> {
    return this.http.patch<DataResponse<User>>(`${this.apiUrl}/users/${id}/reject`, {});
  }
}
