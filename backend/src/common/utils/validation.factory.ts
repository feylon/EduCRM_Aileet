import { BadRequestException, ValidationError } from '@nestjs/common';

function flatten(errors: ValidationError[], parent = ''): { field: string; messages: string[] }[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flatten(error.children || [], field)];
  });
}

/** Builds a consistent 400 response with per-field validation messages. */
export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: flatten(errors),
  });
}
