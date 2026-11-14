const API = "https://welcome-messages.marta-8k2q.workers.dev";

const INTRO = ["Welcome", "I thank you", "I have been lonely"];
const TITLES = { click: "Click me", welcome: "Welcome", soon: "Soon" };
const QUESTION = "Anything to say?";
const OUTRO = ["Sent", "I thank you again", "Goodbye"];

const LIFE = 5000;
const GAP = 5000;
const NOT_YET_LIFE = 10000;
 
const FOUND_FADE = 10000;
const LOST_DELAY = 60000;
const LOST_FADE = 20000;
 
const SOUNDS = {
  letterIn: ["audio/letters/in/1.wav"],
  letterOut: ["audio/letters/out/1.wav"],
  shock: "audio/shock.wav",
  found: "audio/found.wav",
  lost: "audio/lost.mp3",
};
 
const VOLUME = { master: 1, letter: 0.6, shock: 1, found: 1, lost: 1 };
const PITCH_VARIATION = 0.08;