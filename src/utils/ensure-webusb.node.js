export async function ensureWebUSB() {
  // monkey patch global this dynamically
  const { webusb } = await import('usb');
  globalThis.navigator.usb = webusb;
}
