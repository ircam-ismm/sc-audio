import { AudioContext, BaseAudioContext, GainNode } from 'isomorphic-web-audio-api';
import { Bypass } from './src/BypassNode.js';

const audioContext = new AudioContext();
const bypass = new Bypass(audioContext);
