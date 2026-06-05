import { useReducer, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const initialState = { users: [], loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "SET_USERS":
      return { ...state, users: action.payload, loading: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// Super admin sees all; admin sees all too for reference
export function useUsers(role) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (role !== "super_admin" && role !== "admin") {
      dispatch({ type: "SET_USERS", payload: [] });
      return;
    }

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        dispatch({ type: "SET_USERS", payload: data });
      },
      (err) => dispatch({ type: "SET_ERROR", payload: err.message })
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [role]);

  return state;
}

export async function updateUserRole(uid, newRole) {
  return updateDoc(doc(db, "users", uid), {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
}
