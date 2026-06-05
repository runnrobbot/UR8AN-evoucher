import { useReducer, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const initialState = { divisions: [], loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "SET":    return { ...state, divisions: action.payload, loading: false };
    case "ERROR":  return { ...state, error: action.payload,    loading: false };
    default:       return state;
  }
}

export function useDivisions() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    const q = query(collection(db, "divisions"), orderBy("createdAt", "asc"));
    unsubRef.current = onSnapshot(
      q,
      (snap) => dispatch({ type: "SET", payload: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }),
      (err)  => dispatch({ type: "ERROR", payload: err.message })
    );

    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, []);

  return state;
}

export async function createDivision(name) {
  return addDoc(collection(db, "divisions"), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function updateDivision(id, name) {
  return updateDoc(doc(db, "divisions", id), {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDivision(id) {
  return deleteDoc(doc(db, "divisions", id));
}
