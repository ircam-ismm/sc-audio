export async function ensureWebUSB() {
  // monkey patch global this dynamically
  const { webusb } = await import('usb');
  return webusb;
  // globalThis.navigator.usb = webusb;
}
