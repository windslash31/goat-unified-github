const authenticateApiKey = async (req, res, next) => {
  // --- START: DEBUG LOGGING ---
  console.log("--- API Key Authentication Check ---");
  console.log("Received headers:", req.headers);
  const apiKey = req.headers["x-api-key"];
  console.log("Attempting to authenticate with key:", apiKey);

  if (!apiKey) {
    console.log(
      "Authentication failed: Header 'x-api-key' is missing or empty."
    );
    return res.status(401).json({ message: "API Key is missing." });
  }

  try {
    const result = await db.query(
      "SELECT key_hash, user_id, expires_at FROM api_keys"
    );
    const allKeys = result.rows;
    console.log(
      `Found ${allKeys.length} key(s) in the database to check against.`
    );

    let matchedKey = null;
    for (const key of allKeys) {
      console.log(
        `Comparing provided key with stored hash for user_id: ${key.user_id}`
      );
      const isMatch = await bcrypt.compare(apiKey, key.key_hash);
      if (isMatch) {
        console.log(`SUCCESS: Match found for user_id: ${key.user_id}`);
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      console.log(
        "Authentication failed: No matching key found in the database after checking all entries."
      );
      return res.status(401).json({ message: "Invalid API Key." });
    }

    if (matchedKey.expires_at && new Date() > new Date(matchedKey.expires_at)) {
      console.log(
        `Authentication failed: Key for user_id ${matchedKey.user_id} has expired.`
      );
      return res.status(401).json({ message: "API Key has expired." });
    }

    const userQuery = `
            SELECT u.*, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `;
    const userResult = await db.query(userQuery, [matchedKey.user_id]);
    if (userResult.rows.length === 0) {
      console.log(
        `Authentication failed: Key is valid, but associated user ${matchedKey.user_id} was not found.`
      );
      return res.status(401).json({
        message: "API Key is valid, but the associated user was not found.",
      });
    }

    const user = userResult.rows[0];
    const permsResult = await db.query(
      "SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1",
      [user.role_id]
    );
    req.user = {
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      name: user.full_name,
      role: user.role_name,
      permissions: permsResult.rows.map((p) => p.name),
    };

    console.log("--- API Key Authentication Successful ---");
    next();
  } catch (err) {
    console.error("API Key Authentication error:", err);
    return res.status(500).send("Server error during authentication.");
  }
};
