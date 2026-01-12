// 输入验证工具
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 邮箱验证
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('邮箱是必需的');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('邮箱格式不正确');
  }
  if (email.length > 255) {
    throw new ValidationError('邮箱长度不能超过255个字符');
  }
}

// 密码验证
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('密码是必需的');
  }
  if (password.length < 6) {
    throw new ValidationError('密码长度至少6位');
  }
  if (password.length > 128) {
    throw new ValidationError('密码长度不能超过128个字符');
  }
}

// 字符串长度验证
export function validateStringLength(value: string, fieldName: string, min: number, max: number): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName}必须是字符串`);
  }
  if (value.length < min) {
    throw new ValidationError(`${fieldName}长度至少${min}个字符`);
  }
  if (value.length > max) {
    throw new ValidationError(`${fieldName}长度不能超过${max}个字符`);
  }
}

// ID 验证（UUID 或 MongoDB ObjectId）
export function validateId(id: string, fieldName: string = 'ID'): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName}是必需的`);
  }
  // UUID 或 MongoDB ObjectId 格式
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) &&
      !/^[a-f0-9]{24}$/i.test(id)) {
    throw new ValidationError(`${fieldName}格式不正确`);
  }
}

// 数字验证
export function validateNumber(value: any, fieldName: string, min?: number, max?: number): void {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName}必须是数字`);
  }
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName}不能小于${min}`);
  }
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName}不能大于${max}`);
  }
}

// 枚举验证
export function validateEnum<T>(value: T, allowedValues: T[], fieldName: string): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`);
  }
}

// URL 验证
export function validateUrl(url: string, fieldName: string = 'URL'): void {
  if (!url || typeof url !== 'string') {
    throw new ValidationError(`${fieldName}是必需的`);
  }
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`${fieldName}格式不正确`);
  }
}

// 对象必填字段验证
export function validateRequiredFields(obj: any, fields: string[]): void {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(`${field}是必需的`);
    }
  }
}
