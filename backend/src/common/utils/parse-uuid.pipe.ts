import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

/** UUID param pipe returning our standard error code. */
export const UuidPipe = new ParseUUIDPipe({
  version: '4',
  exceptionFactory: () => new BadRequestException({ code: 'INVALID_ID', message: 'Invalid id format' }),
});
