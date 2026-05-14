// Validation utilities
import { FormError } from '@/types/index';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, contains uppercase, lowercase, and number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  return Boolean(name && name.trim().length >= 2);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

export const validateMatch = (value1: string, value2: string): boolean => {
  return value1 === value2;
};

export const getValidationErrors = (
  data: Record<string, any>,
  rules: Record<string, any>
): FormError => {
  const errors: FormError = {};

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];

    if (rule.required && !validateRequired(value)) {
      errors[field] = `${field} là bắt buộc`;
      return;
    }

    if (rule.type === 'email' && value && !validateEmail(value)) {
      errors[field] = 'Email không hợp lệ';
      return;
    }

    if (rule.type === 'password' && value && !validatePassword(value)) {
      errors[field] = 'Mật khẩu phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường và số';
      return;
    }

    if (rule.type === 'phone' && value && !validatePhone(value)) {
      errors[field] = 'Số điện thoại không hợp lệ';
      return;
    }

    if (rule.type === 'url' && value && !validateURL(value)) {
      errors[field] = 'URL không hợp lệ';
      return;
    }

    if (rule.minLength && value && !validateMinLength(value, rule.minLength)) {
      errors[field] = `${field} phải có ít nhất ${rule.minLength} ký tự`;
      return;
    }

    if (rule.maxLength && value && !validateMaxLength(value, rule.maxLength)) {
      errors[field] = `${field} không được vượt quá ${rule.maxLength} ký tự`;
      return;
    }
  });

  return errors;
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateURL,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateMatch,
  getValidationErrors,
};