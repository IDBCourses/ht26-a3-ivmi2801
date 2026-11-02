/*
 * IDB Programming: A3 — a musical instrument
 *
 * All of the code for your instrument goes in this file. It's split into sections:
 *   settings — the "fixed" parts of your program
 *   state    — the parts of your program that change over time
 *   sound    — the Tone.js instruments and effects
 *   update   — updates the state every 100ms, if necessary
 *   use      — uses the state to make sound and shapes every 100ms, if necessary
 *   controls — what happens when the player uses the pointer
 *   setup    — starts everything
 *
 * The pointer events change the state. update() and use() each run every
 * 100ms, in a loop:
 *   1. update: change the state, e.g. based on time or on the pointer's movement
 *   2. use:    make sound and move shapes, based on the state
 *
 * Shapes come from shape.js: createShape() makes one, and its methods
 * (setPosition, setSize, setColour ...) change it.
 *
 * Tone.js documentation: https://tonejs.github.io/docs/15.1.22/
 */

import { createShape } from "./shape.js";

// ---------- Settings ----------

// Fixed values that control the melody and sound
const notes = ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4","E4",
  "E4", "D4", "D4", "C4",]; // Notes in the repeating melody


// ---------- State ----------

// Values that change while the program is running
let pointerX = 0.5;
let pointerY = 0.5;
let speed = 0;
let isPlaying = false;
let melodyIndex = 0;
let melodyTimeout;

let previousX = 0;
let previousY = 0;

// Stores the recent pointer movement data
let movementHistory = [];

let circle;

// ---------- Sound ----------

// Create a sound with a soft tone that fades out gradually
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: {
    attack: 0.1,
    release: 0.8,
  },
}).toDestination();

// ---------- Update ----------

// Calculate the pointer's speed and use that to control the volume.
function update() {
  // Add together the recent pointer movement distances
  let totalDistance = 0;

  for (const movement of movementHistory) {
    totalDistance += movement;
  }

  // Calculate the avarage movement speed
  if (movementHistory.length > 0) {
    speed = totalDistance / movementHistory.length;
  } else {
    speed = 0;
  }

  // Calculate the volume using the pointer's vertical position and movement speed
  const verticalVolume = -30 + pointerY * 20;
  const movementVolume = Math.min(30, speed);

  synth.volume.value = verticalVolume + movementVolume;

  // run update() again after 100ms
  setTimeout(update, 100);
}

// ---------- Use ----------

// Update the circle's position and size
function use() {
  // Move the circle to the pointer's position
  circle.setPosition(pointerX, pointerY);

  // Make the circle bigger when the sound is louder
  const verticalVolume = -30 + pointerY * 20;
  const movementVolume = Math.min(30, speed);
  const volume = verticalVolume + movementVolume;

  const size = 30 + (volume + 30) * 4;
  circle.setSize(Math.min(250, Math.max(30, size)));

  // Run use again after 100ms
  setTimeout(use, 100);
}

// ---------- Controls (Event Handlers) ----------

// Runs when the pointer moves
function pointerMove(event) {
  // Converting the value between 0 and 1
  pointerX = event.clientX / window.innerWidth;
  pointerY = event.clientY / window.innerHeight;

  // If this is the first movement save the position
  if (previousX === 0 && previousY === 0) {
    previousX = event.clientX;
    previousY = event.clientY;
    return;
  }

  // Calculate the distance moved
  const distanceX = event.clientX - previousX;
  const distanceY = event.clientY - previousY;
  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

  // Adding the new value of the movement distance
  movementHistory.push(distance);

  // Keep only the five most recent movements
  if (movementHistory.length > 5) {
    movementHistory.shift();
  }

  // Save the current position for next movement
  previousX = event.clientX;
  previousY = event.clientY;
}

// Start sound when the mouse is clicked
function pointerDown(event) {
  Tone.start();

  if (isPlaying) return;

  melodyIndex = 0;
  isPlaying = true;
  playNextNote();
}

// Play notes one after another
function playNextNote() {
  if (!isPlaying) return;

  // Choose the next note in the melody
  const note = notes[melodyIndex];

  melodyIndex = (melodyIndex + 1) % notes.length;

  // Play the note briefly
  synth.triggerAttackRelease(note, "8n");

  const delay = Math.max(100, 500 - speed * 5);
  melodyTimeout = setTimeout(playNextNote, delay);
}

// Stop the sound when the mouse is released
function pointerUp(event) {
  isPlaying = false;

  clearTimeout(melodyTimeout);

  synth.releaseAll();
}

// ---------- Setup ----------

// Setup is run once, at the start of the program. It sets everything up for us!
function setup() {
  // Creating a circle responding to pointer movement
  circle = createShape("circle");
  circle.setPosition(0.5, 0.5);
  circle.setRoundedness(1);
  circle.setColour(200, 100, 85);

  // Pointer event listeners
  window.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerdown", pointerDown);
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);

  // Starting the loops
  update();
  use();
}

setup(); // Always remember to call setup()!
