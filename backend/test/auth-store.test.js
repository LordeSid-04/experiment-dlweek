const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  createAuthStore,
  validateNtuStudentEmail,
  validateSingaporeMobileNumber,
} = require("../src/lib/auth-store");

test("email validation allows only NTU student domain", () => {
  assert.equal(validateNtuStudentEmail("student@e.ntu.edu.sg"), true);
  assert.equal(validateNtuStudentEmail("student@gmail.com"), false);
});

test("mobile validation allows Singapore format only", () => {
  assert.equal(validateSingaporeMobileNumber("+6591234567"), true);
  assert.equal(validateSingaporeMobileNumber("91234567"), true);
  assert.equal(validateSingaporeMobileNumber("+658123456"), false);
  assert.equal(validateSingaporeMobileNumber("+14155552671"), false);
});

test("signup stores user and login verifies password", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "auth-store-"));
  const usersPath = path.join(tempDir, "users.json");
  const store = createAuthStore({ usersPath });

  const signup = await store.createUser({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@e.ntu.edu.sg",
    mobileNumber: "+6591234567",
    password: "secure-pass-123",
  });
  assert.equal(signup.ok, true);

  const loginOk = await store.loginUser({ email: "ada@e.ntu.edu.sg", password: "secure-pass-123" });
  assert.equal(loginOk.ok, true);

  const loginBad = await store.loginUser({ email: "ada@e.ntu.edu.sg", password: "wrong-password" });
  assert.equal(loginBad.ok, false);
});

test("supabase mode stores and retrieves auth users", async () => {
  let dbRow = null;

  const mockFetch = async (url, init) => {
    if (String(url).includes("/rest/v1/users") && init?.method === "POST") {
      const body = JSON.parse(String(init.body || "[]"));
      const row = Array.isArray(body) ? body[0] : {};
      dbRow = {
        id: "user-123",
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        mobile_number: row.mobile_number,
        password_salt: row.password_salt,
        password_digest: row.password_digest,
        created_at: row.created_at,
      };
      return {
        ok: true,
        status: 201,
        json: async () => [dbRow],
      };
    }
    if (String(url).includes("/rest/v1/users") && init?.method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => (dbRow ? [dbRow] : []),
      };
    }
    throw new Error(`Unexpected mock fetch call: ${String(url)} ${init?.method || "GET"}`);
  };

  const store = createAuthStore({
    supabaseUrl: "https://demo-project.supabase.co",
    supabaseServiceRoleKey: "demo-service-role-key",
    supabaseAuthTable: "users",
    fetchImpl: mockFetch,
  });

  const signup = await store.createUser({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@e.ntu.edu.sg",
    mobileNumber: "+6591234567",
    password: "secure-pass-123",
  });
  assert.equal(signup.ok, true);
  assert.equal(signup.user.email, "ada@e.ntu.edu.sg");

  const login = await store.loginUser({ email: "ada@e.ntu.edu.sg", password: "secure-pass-123" });
  assert.equal(login.ok, true);
  assert.equal(store.getStorageResource(), "supabase:users");
});
