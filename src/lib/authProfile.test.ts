import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fallbackAuthUser, formatProfessorName, profileRowToAuthUser } from "./authProfile";

function authUser(email: string, metadata: Record<string, unknown> = {}): User {
  return {
    id: `id-${email}`,
    email,
    user_metadata: metadata,
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-05-27T00:00:00.000Z",
  } as User;
}

describe("auth profile helpers", () => {
  it("keeps the demo admin as administrator", () => {
    expect(fallbackAuthUser(authUser("admin@eventostc.test"))).toMatchObject({
      email: "admin@eventostc.test",
      name: "Administrador",
      role: "admin",
    });
  });

  it("keeps the demo professor as professor without duplicating the title", () => {
    expect(fallbackAuthUser(authUser("professor@eventostc.test", { name: "Prof. Sonia" }))).toMatchObject({
      name: "Prof. Sonia",
      role: "professor",
    });

    expect(formatProfessorName("Sonia")).toBe("Prof. Sonia");
    expect(formatProfessorName("Prof. Sonia")).toBe("Prof. Sonia");
    expect(formatProfessorName("Professor")).toBe("Professor");
  });

  it("treats Google/test accounts as students by default", () => {
    expect(fallbackAuthUser(authUser("thiagodambi@gmail.com", { full_name: "Thiago Dambi" }))).toMatchObject({
      email: "thiagodambi@gmail.com",
      name: "Thiago Dambi",
      role: "aluno",
    });
  });

  it("maps profile rows from Supabase into auth users", () => {
    expect(profileRowToAuthUser({
      id: "profile-1",
      email: "professor@eventostc.test",
      name: "Sonia Durao",
      role: "professor",
      avatar: "avatar.png",
    })).toEqual({
      id: "profile-1",
      email: "professor@eventostc.test",
      name: "Prof. Sonia Durao",
      role: "professor",
      avatar: "avatar.png",
    });
  });
});
