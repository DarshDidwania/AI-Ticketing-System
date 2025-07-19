import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";

/**
 * Handles user signup. Hashes the password, creates a new user,
 * and returns a JWT.
 */
export const signup = async (req, res) => {
  const { email, password, skills = [] } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      skills,
    });

    // --- DEBUGGING STEP ---
    // The Inngest event is temporarily disabled to isolate the core signup logic.
    /*
    await inngest.send({
      name: "user.signup",
      data: {
        email,
      },
    });
    */
    console.log("Inngest event skipped for debugging.");


    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    const userObject = { _id: user._id, email: user.email, role: user.role, skills: user.skills };
    res.status(201).json({ user: userObject, token });

  } catch (error) {
    console.error("SIGNUP FAILED:", error);
    res.status(500).json({ error: "Signup failed", details: error.message });
  }
};

// The rest of the login, logout, etc. functions remain the same...

/**
 * Handles user login. Finds the user, compares the password,
 * and returns a JWT if successful.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    const userObject = { _id: user._id, email: user.email, role: user.role, skills: user.skills };
    res.json({ user: userObject, token });

  } catch (error) {
    console.error("LOGIN FAILED:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("LOGOUT FAILED:", error);
    res.status(500).json({ error: "Logout failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body;
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }
    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("UPDATE USER FAILED:", error);
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    console.error("GET USERS FAILED:", error);
    res.status(500).json({ error: "Fetching users failed", details: error.message });
  }
};
