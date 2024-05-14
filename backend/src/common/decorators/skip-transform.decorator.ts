import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/** Disables the global response envelope (e.g. for file downloads). */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
