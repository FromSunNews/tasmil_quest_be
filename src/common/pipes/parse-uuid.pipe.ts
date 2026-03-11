import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_UUID',
          message: 'Provided id is not a valid UUID',
        },
      });
    }
    return value;
  }
}

