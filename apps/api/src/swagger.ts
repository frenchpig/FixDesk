import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_BEARER = 'JWT-auth';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('FixDesk API')
    .setDescription(
      'API REST para gestión de incidencias. Autenticación JWT en endpoints protegidos.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /auth/login',
      },
      SWAGGER_BEARER,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
