import { Router } from "express";
import { queryD1 } from "../config/d1";

export const userRouter = Router();

// 1. List all admin users & operators
userRouter.get("/", async (_req, res) => {
  try {
    const users = await queryD1(
      `SELECT id, user_id, email, name, role, avatar_url, is_active, last_login_at, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create or Onboard New Admin User
userRouter.post("/", async (req, res) => {
  try {
    const { email, name, role = "engineer", avatarUrl = "" } = req.body;

    if (!email || !name) {
      return res.status(422).json({ success: false, error: "email and name are required" });
    }

    const userId = `usr_${Date.now()}`;
    const passwordHash = "mock_sha256_initial_token";

    await queryD1(
      `INSERT INTO users (user_id, email, password_hash, name, role, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email.toLowerCase().trim(), passwordHash, name, role, avatarUrl]
    );

    res.json({ success: true, message: `User [${name}] created successfully`, userId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. User Login Authentication Mock / Session
userRouter.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ success: false, error: "email is required" });
    }

    const users = await queryD1(
      `SELECT id, user_id, email, name, role, avatar_url, is_active FROM users WHERE email = ? AND is_active = 1`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid credentials or inactive user" });
    }

    const user = users[0];
    await queryD1(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [user.user_id]);

    res.json({
      success: true,
      token: `hub_jwt_${user.user_id}_${Date.now()}`,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update User Role or Status
userRouter.patch("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive, name } = req.body;

    await queryD1(
      `UPDATE users
       SET role = COALESCE(?, role),
           name = COALESCE(?, name),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [role || null, name || null, isActive !== undefined ? isActive : null, userId]
    );

    res.json({ success: true, message: `User [${userId}] updated` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
