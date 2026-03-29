interface partialResponse {
    status: 'success',
    statusCode: number;
}

export interface DataResponse<T> extends partialResponse {
    data: T;
    message?: string;
}

export interface MessageResponse extends partialResponse {
    message: string;
}