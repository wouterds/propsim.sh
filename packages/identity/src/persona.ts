/**
 * FNV-1a, 32 bit. Not a security hash. It is here so a person comes out the
 * same on the server as in the browser, from no dependency and no built-in.
 */
const hash = (value: string) => {
  let sum = 0x811c9dc5;

  for (let index = 0; index < value.length; index++) {
    sum ^= value.charCodeAt(index);
    sum = Math.imul(sum, 0x01000193);
  }

  return sum >>> 0;
};

const ADJECTIVES = [
  "Amber",
  "Bold",
  "Brisk",
  "Calm",
  "Candid",
  "Clever",
  "Crisp",
  "Curious",
  "Deft",
  "Eager",
  "Even",
  "Frank",
  "Gentle",
  "Glad",
  "Keen",
  "Level",
  "Lucid",
  "Mellow",
  "Nimble",
  "Patient",
  "Placid",
  "Plucky",
  "Prudent",
  "Quiet",
  "Rapid",
  "Restless",
  "Silent",
  "Solid",
  "Steady",
  "Stray",
  "Sunny",
  "Swift",
];

const CREATURES = [
  "Badger",
  "Bison",
  "Cobra",
  "Dingo",
  "Egret",
  "Falcon",
  "Ferret",
  "Gannet",
  "Gecko",
  "Hare",
  "Heron",
  "Ibis",
  "Jackal",
  "Kestrel",
  "Lemur",
  "Lynx",
  "Magpie",
  "Marlin",
  "Narwhal",
  "Ocelot",
  "Osprey",
  "Otter",
  "Panther",
  "Puffin",
  "Quail",
  "Raven",
  "Rhino",
  "Stoat",
  "Tapir",
  "Tern",
  "Vulture",
  "Wombat",
];

/**
 * A fixed ring of tints rather than the whole wheel. Two ids a degree apart read
 * as one colour drawn wrong, where two steps of the ring read as two people.
 */
const TINTS = 8;

const FIRST_TINT = 20;

export type Persona = {
  name: string;
  /** The two letters the face is drawn with. */
  initials: string;
  /** Degrees, for the tint behind them. */
  hue: number;
};

/**
 * A name and a face for somebody the board never asked the name of. Both come
 * from the account id and nothing else, so one person reads as one person on
 * every page while the id itself never leaves the server.
 */
export const personaOf = (userId: string): Persona => {
  const named = hash(userId);
  const adjective = ADJECTIVES[named % ADJECTIVES.length];
  const creature = CREATURES[(named >>> 8) % CREATURES.length];

  return {
    name: `${adjective} ${creature}`,
    initials: `${adjective[0]}${creature[0]}`,
    hue: FIRST_TINT + (hash(`${userId}/face`) % TINTS) * (360 / TINTS),
  };
};
