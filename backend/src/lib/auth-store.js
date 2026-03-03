const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DEFAULT_USERS_PATH = path.resolve(__dirname, "..", "..", "data", "users.json");
const NTU_STUDENT_DOMAIN = "@e.ntu.edu.sg";

function ensureUsersFile(usersPath) {
  const dir = path.dirname(usersPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, "[]", "utf8");
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeMobileNumber(mobileNumber) {
  return String(mobileNumber || "")
    .trim()
    .replace(/[ -]/g, "");
}

function validateNtuStudentEmail(email) {
  return normalizeEmail(email).endsWith(NTU_STUDENT_DOMAIN);
}

function validateSingaporeMobileNumber(mobileNumber) {
  const normalized = normalizeMobileNumber(mobileNumber);
  return /^(?:\+65)?[89]\d{7}$/.test(normalized);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const digest = crypto.pbkdf2Sync(String(password), salt, 100_000, 64, "sha512").toString("hex");
  return { salt, digest };
}

function compareDigests(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "hex");
  const rightBuffer = Buffer.from(String(right || ""), "hex");
  if (leftBuffer.length !== rightBuffer.length || leftBuffer.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validateSignupInput(payload) {
  const firstName = String(payload?.firstName || "").trim();
  const lastName = String(payload?.lastName || "").trim();
  const email = normalizeEmail(payload?.email);
  const mobileNumber = normalizeMobileNumber(payload?.mobileNumber);
  const password = String(payload?.password || "");

  if (!firstName) return "First name is required.";
  if (!lastName) return "Last name is required.";
  if (!email) return "Email is required.";
  if (!validateNtuStudentEmail(email)) {
    return "Signup is restricted to @e.ntu.edu.sg email addresses.";
  }
  if (!validateSingaporeMobileNumber(mobileNumber)) {
    return "Mobile number must be a valid Singapore number (for example +6591234567).";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return "";
}

function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobileNumber: user.mobileNumber,
    createdAt: user.createdAt,
  };
}

function createSupabaseClient({
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseAuthTable = "users",
  fetchImpl = globalThis.fetch,
}) {
  const normalizedUrl = String(supabaseUrl || "").trim().replace(/\/+$/, "");
  const serviceKey = String(supabaseServiceRoleKey || "").trim();
  const table = String(supabaseAuthTable || "").trim() || "users";
  const enabled = Boolean(normalizedUrl && serviceKey);

  function getStorageResource() {
    return `supabase:${table}`;
  }

  async function request(pathname, init = {}) {
    if (!enabled) {
      throw new Error("Supabase auth store is not configured.");
    }
    if (typeof fetchImpl !== "function") {
      throw new Error("Global fetch is unavailable for Supabase auth store.");
    }
    const response = await fetchImpl(`${normalizedUrl}${pathname}`, {
      ...init,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    return response;
  }

  async function createUser(payload) {
    const validationError = validateSignupInput(payload);
    if (validationError) {
      return { ok: false, error: validationError };
    }
    const email = normalizeEmail(payload.email);
    const mobileNumber = normalizeMobileNumber(payload.mobileNumber);
    const passwordHash = hashPassword(payload.password);
    const createdAt = new Date().toISOString();

    const insertResponse = await request(`/rest/v1/${table}`, {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          first_name: String(payload.firstName).trim(),
          last_name: String(payload.lastName).trim(),
          email,
          mobile_number: mobileNumber,
          password_salt: passwordHash.salt,
          password_digest: passwordHash.digest,
          created_at: createdAt,
        },
      ]),
    });

    if (!insertResponse.ok) {
      let errorText = "";
      try {
        const payloadJson = await insertResponse.json();
        errorText = String(payloadJson?.message || payloadJson?.error || "");
      } catch {
        // no-op
      }
      const duplicateEmail =
        insertResponse.status === 409 ||
        /duplicate key|unique|already exists/i.test(errorText);
      if (duplicateEmail) {
        return { ok: false, error: "An account with this email already exists." };
      }
      return {
        ok: false,
        error: errorText || "Supabase signup failed.",
      };
    }

    const createdRows = await insertResponse.json();
    const row = Array.isArray(createdRows) ? createdRows[0] : null;
    if (!row) {
      return { ok: false, error: "Supabase signup returned no user row." };
    }

    return {
      ok: true,
      user: {
        id: String(row.id || ""),
        firstName: String(row.first_name || "").trim(),
        lastName: String(row.last_name || "").trim(),
        email: normalizeEmail(row.email),
        mobileNumber: normalizeMobileNumber(row.mobile_number),
        createdAt: String(row.created_at || createdAt),
      },
    };
  }

  async function loginUser(payload) {
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");
    if (!email || !password) {
      return { ok: false, error: "Email and password are required." };
    }

    const encodedEmail = encodeURIComponent(email);
    const lookupResponse = await request(
      `/rest/v1/${table}?email=eq.${encodedEmail}&select=id,first_name,last_name,email,mobile_number,password_salt,password_digest,created_at&limit=1`,
      {
        method: "GET",
      }
    );

    if (!lookupResponse.ok) {
      let errorText = "";
      try {
        const payloadJson = await lookupResponse.json();
        errorText = String(payloadJson?.message || payloadJson?.error || "");
      } catch {
        // no-op
      }
      return {
        ok: false,
        error: errorText || "Supabase login failed.",
      };
    }

    const rows = await lookupResponse.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return { ok: false, error: "Invalid email or password." };
    }

    const computed = hashPassword(password, row.password_salt);
    if (!compareDigests(computed.digest, row.password_digest)) {
      return { ok: false, error: "Invalid email or password." };
    }

    return {
      ok: true,
      user: {
        id: String(row.id || ""),
        firstName: String(row.first_name || "").trim(),
        lastName: String(row.last_name || "").trim(),
        email: normalizeEmail(row.email),
        mobileNumber: normalizeMobileNumber(row.mobile_number),
        createdAt: String(row.created_at || ""),
      },
    };
  }

  return {
    enabled,
    getStorageResource,
    createUser,
    loginUser,
  };
}

function createAuthStore({
  usersPath = DEFAULT_USERS_PATH,
  supabaseUrl = process.env.SUPABASE_URL,
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAuthTable = process.env.SUPABASE_AUTH_TABLE || "users",
  fetchImpl = globalThis.fetch,
} = {}) {
  const supabaseClient = createSupabaseClient({
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAuthTable,
    fetchImpl,
  });

  function getStorageResource() {
    return supabaseClient.enabled ? supabaseClient.getStorageResource() : "backend/data/users.json";
  }

  function readUsers() {
    ensureUsersFile(usersPath);
    const raw = fs.readFileSync(usersPath, "utf8");
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeUsers(users) {
    ensureUsersFile(usersPath);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
  }

  async function createUser(payload) {
    if (supabaseClient.enabled) {
      return supabaseClient.createUser(payload);
    }
    const validationError = validateSignupInput(payload);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const users = readUsers();
    const email = normalizeEmail(payload.email);
    if (users.some((item) => normalizeEmail(item.email) === email)) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const mobileNumber = normalizeMobileNumber(payload.mobileNumber);
    const passwordHash = hashPassword(payload.password);
    const user = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `user-${Date.now()}`,
      firstName: String(payload.firstName).trim(),
      lastName: String(payload.lastName).trim(),
      email,
      mobileNumber,
      passwordSalt: passwordHash.salt,
      passwordDigest: passwordHash.digest,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);
    return { ok: true, user: toPublicUser(user) };
  }

  async function loginUser(payload) {
    if (supabaseClient.enabled) {
      return supabaseClient.loginUser(payload);
    }
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");
    if (!email || !password) {
      return { ok: false, error: "Email and password are required." };
    }

    const users = readUsers();
    const user = users.find((item) => normalizeEmail(item.email) === email);
    if (!user) {
      return { ok: false, error: "Invalid email or password." };
    }

    const computed = hashPassword(password, user.passwordSalt);
    if (!compareDigests(computed.digest, user.passwordDigest)) {
      return { ok: false, error: "Invalid email or password." };
    }

    return { ok: true, user: toPublicUser(user) };
  }

  return {
    readUsers,
    getStorageResource,
    createUser,
    loginUser,
  };
}

const defaultStore = createAuthStore();

module.exports = {
  createAuthStore,
  validateNtuStudentEmail,
  validateSingaporeMobileNumber,
  normalizeEmail,
  normalizeMobileNumber,
  validateSignupInput,
  hashPassword,
  compareDigests,
  ...defaultStore,
};
