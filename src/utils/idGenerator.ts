// ID 生成工具
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const generateShortId = (prefix: string = ''): string => {
  return `${prefix}${uuidv4().slice(0, 8)}`;
};
