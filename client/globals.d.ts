// src/globals.d.ts
export {};

declare global {
  interface Window {
    ethereum?: any; // Use `any` or specify a stricter type if available
  }
}
