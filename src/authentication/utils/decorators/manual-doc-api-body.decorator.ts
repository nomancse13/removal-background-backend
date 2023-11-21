/**dependencies */
import { ApiBody } from '@nestjs/swagger';
/**custom file upload interceptors */
const name = 'name';
const email = 'email';
const description = 'description';
const documentId = 'documentId';
export const ManualDocApiBody =
  (files = 'files'): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      type: 'multipart/form-data',
      required: true,
      schema: {
        type: 'object',
        properties: {
          [name]: {
            type: 'string',
            nullable: true,
            examples: ['custom file name'],
          },
          [email]: {
            type: 'string',
            nullable: false,
            example: 'noman123@gmail.com',
          },
          [description]: {
            type: 'string',
            nullable: false,
            example: 'this is for description',
          },
          [files]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    })(target, propertyKey, descriptor);
  };
