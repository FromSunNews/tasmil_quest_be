import { HttpException, HttpStatus } from '@nestjs/common';

export interface BusinessErrorPayload {
  code: string;
  message: string;
  status?: number;
}

export class BusinessException extends HttpException {
  constructor(payload: BusinessErrorPayload) {
    super(
      {
        success: false,
        data: null,
        error: {
          code: payload.code,
          message: payload.message,
        },
      },
      payload.status ?? HttpStatus.BAD_REQUEST,
    );
  }
}

