# DTOs in this project

## What is a DTO? (simple explanation)

**DTO** stands for **Data Transfer Object**. Think of it as a **contract** for a piece of data that is **coming in** or **going out** of your API.

- It answers: *“What shape is this data allowed to have?”*
- It does **not** contain business rules like “check if email exists in the database” (that belongs in the **service** layer).
- It is mainly about **structure**, **types**, and **basic rules** (required fields, string length, allowed values, trimming, etc.).

In this codebase, incoming JSON from the client is validated through a DTO **before** your controller and service run their logic.

---

## Why use a DTO here?

Without a DTO, every route would have to repeat checks like:

- Is `email` present and actually an email?
- Is `password` long enough?
- Are there extra fields we should ignore?

That leads to **duplication**, **inconsistent errors**, and **bugs** (e.g. trusting `req.body` as-is).

A DTO gives you:

| Benefit | What it means in practice |
| ------- | ------------------------- |
| **One place for input rules** | `RegisterDto` defines how registration input must look. |
| **Safer `req.body`** | After validation, middleware replaces `req.body` with a **cleaned** value (`stripUnknown: true` drops fields not in the schema). |
| **Clear errors** | Validation failures become a **400 Bad Request** with a readable message before any DB call. |
| **Separation of concerns** | Routes/controllers stay thin; “what is allowed as input” lives next to the feature (`auth/dto/`) or shared base (`common/dto/`). |

So the DTO is **required** in the sense that it is the **standard gate** for untrusted client input: validate first, then run business logic.

---

## How this project implements DTOs

### 1. `BaseDto` — shared validation helper

File: `src/common/dto/base.dto.js`

- Holds a static Joi **`schema`** (empty by default).
- Provides **`validate(data)`** which runs Joi and returns either:
  - `{ error: [...messages], value: null }`, or
  - `{ error: null, value }` (the **sanitized** object).

Options used:

- **`abortEarly: false`** — collect **all** field errors, not only the first.
- **`stripUnknown: true`** — remove properties not defined in the schema.

### 2. Feature DTO — e.g. `RegisterDto`

File: `src/modules/auth/dto/register.dto.js`

- **Extends** `BaseDto`.
- Overrides **`static schema`** with the exact fields for registration (`name`, `email`, `password`, `role`, etc.).

### 3. Middleware — wiring DTO to Express

File: `src/common/middleware/validate.middleware.js`

- **`validate(RegisterDto)`** returns Express middleware that:
  1. Calls `RegisterDto.validate(req.body)`.
  2. On failure → `next(ApiError.badRequest(...))` → **400**.
  3. On success → sets **`req.body` to the validated `value`**, then **`next()`**.

So the **DTO is not magic by itself** — the **`validate` middleware** is what connects it to HTTP.

---

## End-to-end flow (registration example)

```text
Client sends JSON
    → express.json() fills req.body
    → validate(RegisterDto) runs Joi on req.body
    → if invalid: 400 JSON error (stops here)
    → if valid: req.body = sanitized object
    → controller.register → service.register → database
```

---

## DTO vs other layers (quick mental map)

| Layer | Example in this app | Responsibility |
| ----- | ------------------- | ---------------- |
| **DTO** | `RegisterDto` | Shape and rules of **incoming** data for one use case. |
| **Controller** | `auth.controller.js` | HTTP: call service, send response helpers. |
| **Service** | `auth.service.js` | Business rules: “email already taken?”, create user, tokens. |
| **Model** | `auth.model.js` | Persistence: Mongoose schema for stored documents. |

The DTO protects the **service** from garbage or malicious input; the **model** defines how data is **stored**, which can differ slightly (e.g. extra fields, defaults in Mongo).

---

## Summary

- A **DTO** here is a **validated, predictable object** for API input.
- It is **required** so client data is **checked and cleaned early**, errors are **consistent**, and **services** do not duplicate low-level validation everywhere.

For where DTOs live in the repo, see `structure.md`. For request order (boot, routes, validation), see `workflow.md`.
