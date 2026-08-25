import { describe, expect, it } from "vitest";

import { personaOf } from "./persona";

describe("personaOf", () => {
  it("should still name an id that carries nothing", () => {
    // when
    const persona = personaOf("");

    // then
    expect(persona.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });

  it("should give one account the same name and face every time", () => {
    // given
    const id = "01997e51-1a40-7000-9c3b-5f2a11d4e880";

    // then
    expect(personaOf(id)).toEqual(personaOf(id));
  });

  it("should tell apart two ids minted in the same millisecond", () => {
    // given two v7 ids that share every byte but the tail
    const first = "01997e51-1a40-7000-8000-000000000001";
    const second = "01997e51-1a40-7000-8000-000000000002";

    // then
    expect(personaOf(first)).not.toEqual(personaOf(second));
  });

  it("should take its initials from the name it gave", () => {
    // given
    const { name, initials } = personaOf("01997e51-1a40-7000-9c3b-5f2a11d4e880");

    // then
    expect(initials).toBe(`${name.split(" ")[0][0]}${name.split(" ")[1][0]}`);
  });

  it("should draw from a ring of tints rather than the whole wheel", () => {
    // given a spread of ids, two of which on a full wheel could land a degree
    // apart and read as one colour drawn wrong
    const hues = new Set(Array.from({ length: 5000 }, (_, i) => personaOf(`user-${i}`).hue));

    // then
    expect(hues.size).toBe(8);
    expect([...hues].every((hue) => hue >= 0 && hue < 360)).toBe(true);
  });

  it("should reach both ends of both word lists", () => {
    // given enough ids that a list stuck on one word would show
    const names = Array.from({ length: 5000 }, (_, index) => personaOf(`user-${index}`).name);

    // then
    expect(new Set(names.map((name) => name.split(" ")[0])).size).toBe(32);
    expect(new Set(names.map((name) => name.split(" ")[1])).size).toBe(32);
  });
});

describe("personaOf with a chosen name", () => {
  it("should keep the drawn name when the username is empty", () => {
    // given an account that set a name and cleared it again
    const drawn = personaOf("01997e51-1a40-7000-9c3b-5f2a11d4e880");

    // then
    expect(personaOf("01997e51-1a40-7000-9c3b-5f2a11d4e880", null).name).toBe(drawn.name);
    expect(personaOf("01997e51-1a40-7000-9c3b-5f2a11d4e880", "").name).toBe(drawn.name);
  });

  it("should show the chosen name and leave the face alone", () => {
    // given one account, named and unnamed
    const id = "01997e51-1a40-7000-9c3b-5f2a11d4e880";
    const drawn = personaOf(id);

    // when
    const chosen = personaOf(id, "wouterds");

    // then the tint is what people recognise, so it must not move
    expect(chosen.name).toBe("wouterds");
    expect(chosen.initials).toBe("WO");
    expect(chosen.hue).toBe(drawn.hue);
  });

  it("should take one letter from each word of a two word name", () => {
    // then
    expect(personaOf("01997e51-1a40-7000-9c3b-5f2a11d4e880", "night_owl").initials).toBe("NO");
  });
});
