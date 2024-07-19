import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Interactive API documentation available at /api/docs. */
export function setupSwagger(app: INestApplication, prefix: string) {
  const config = new DocumentBuilder()
    .setTitle('EduCRM API')
    .setDescription(
      'REST API of the EduCRM education center management system.\n\n' +
        'Login via `POST /auth/login`, copy `accessToken` and press **Authorize**.\n\n' +
        'Every response is wrapped as `{ success: true, data }`; errors as ' +
        '`{ success: false, statusCode, code, message, errors? }`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', tagsSorter: 'alpha' },
    customSiteTitle: 'EduCRM API Docs',
  });
}
