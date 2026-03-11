import { Expose } from 'class-transformer';

/**
 * Utility function to convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Decorator to automatically expose property with snake_case name
 * This allows DTOs to use camelCase properties while receiving snake_case from request
 * (after TransformRequestInterceptor converts camelCase to snake_case)
 *
 * Usage:
 * @ExposeSnakeCase()
 * walletAddress!: string;
 *
 * This is equivalent to:
 * @Expose({ name: 'wallet_address' })
 * walletAddress!: string;
 */
export function ExposeSnakeCase() {
  return function (target: any, propertyKey: string) {
    const snakeCaseName = camelToSnake(propertyKey);
    Expose({ name: snakeCaseName })(target, propertyKey);
  };
}

