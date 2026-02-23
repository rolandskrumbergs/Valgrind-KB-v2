import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID using UUIDv4.
 */
export function generateUUID(): string {
  return uuidv4();
}
