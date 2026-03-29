interface BaseResponse {
    status: 'success',
    statusCode: number;
}

export interface DataResponse<T> extends BaseResponse {
    data: T;
    message?: string;
}

export interface MessageResponse extends BaseResponse {
    message: string;
}