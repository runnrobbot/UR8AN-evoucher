import { createContext, useContext, useReducer, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

const initialState = {
  user: null,
  profile: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.user, profile: action.profile, loading: false, error: null };
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR":
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch({ type: "CLEAR" });
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        dispatch({
          type: "SET_AUTH",
          user: firebaseUser,
          profile: snap.exists() ? snap.data() : null,
        });
      } catch {
        dispatch({ type: "SET_AUTH", user: firebaseUser, profile: null });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      dispatch({
        type: "SET_AUTH",
        user: cred.user,
        profile: snap.exists() ? snap.data() : null,
      });
      return cred.user;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      throw err;
    }
  };

  const logout = () => signOut(auth);

  // Allow profile refresh after admin creates/updates staff
  const refreshProfile = async () => {
    if (!state.user) return;
    try {
      const snap = await getDoc(doc(db, "users", state.user.uid));
      if (snap.exists()) {
        dispatch({ type: "SET_PROFILE", payload: snap.data() });
      }
    } catch {
      // silently fail
    }
  };

  const value = { ...state, login, logout, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
