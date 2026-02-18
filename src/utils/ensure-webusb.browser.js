export async function ensureWebUSB() {
  if (!globalThis.navigator.usb) {
    throw new Error(`Your browser does not support web USB API`);
  }
  return null;
}
