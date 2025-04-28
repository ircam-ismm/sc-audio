export async function ensureResumed(audioContext) {
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }
}
