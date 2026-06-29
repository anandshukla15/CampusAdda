import json
import os
import re
import math
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import chromadb
except ImportError:  # pragma: no cover - optional dependency
    chromadb = None


class EventRAGService:
    def __init__(self, persist_dir: Optional[str] = None) -> None:
        self.persist_dir = Path(persist_dir or os.path.join(os.path.dirname(__file__), "chroma_db", "campusadda"))
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.collection_name = "campus_events"
        self._store_path = self.persist_dir / "documents.json"
        self.collection = None
        self._docs: List[Dict[str, Any]] = self._load_docs()

        if chromadb is not None:
            try:
                self.client = chromadb.PersistentClient(path=str(self.persist_dir))
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
            except Exception:
                self.collection = None

    def _load_docs(self) -> List[Dict[str, Any]]:
        if not self._store_path.exists():
            return []
        try:
            with self._store_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []

    def _save_docs(self) -> None:
        with self._store_path.open("w", encoding="utf-8") as handle:
            json.dump(self._docs, handle, indent=2)

    def _normalize_terms(self, text: str) -> List[str]:
        if not text:
            return []
        text = text.lower()
        text = text.replace("&", " and ")
        text = re.sub(r"[^a-z0-9]+", " ", text)
        tokens = [token for token in text.split() if len(token) > 1]
        expanded: List[str] = []
        for token in tokens:
            expanded.append(token)
            expanded.extend(self._synonyms(token))
        return list(dict.fromkeys(expanded))

    def _synonyms(self, token: str) -> List[str]:
        synonym_map = {
            "artificial": ["ai", "genai"],
            "intelligence": ["ai", "genai"],
            "ai": ["artificial", "intelligence", "genai", "ml"],
            "genai": ["ai", "artificial", "intelligence"],
            "machine": ["ml"],
            "learning": ["ml"],
            "ml": ["machine", "learning", "ai"],
            "competition": ["contest", "hackathon", "challenge"],
            "competitions": ["contest", "hackathon", "challenge"],
            "contest": ["competition", "hackathon", "challenge"],
            "hackathon": ["contest", "competition", "challenge"],
            "challenge": ["contest", "hackathon", "competition"],
            "workshop": ["session", "seminar", "lab"],
            "nearby": ["location", "venue", "place"],
            "location": ["venue", "place"],
            "venue": ["location", "place"],
        }
        return synonym_map.get(token, [])

    def _build_embedding(self, text: str) -> List[float]:
        terms = self._normalize_terms(text)
        vector = [0.0] * 64
        for term in terms:
            digest = hashlib.blake2b(term.encode("utf-8"), digest_size=8).digest()
            index = int.from_bytes(digest, byteorder="big") % 64
            vector[index] += 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def _build_document(self, event: Dict[str, Any], activities: Optional[List[Dict[str, Any]]] = None) -> str:
        activity_texts: List[str] = []
        for activity in activities or []:
            activity_name = activity.get("activity_name") or ""
            activity_description = activity.get("activity_description") or ""
            venue = activity.get("venue") or ""
            activity_texts.append(
                f"Activity:{activity_name} Description:{activity_description} Venue:{venue}".strip()
            )

        activity_block = " | ".join(part for part in activity_texts if part)
        return " | ".join(
            filter(
                None,
                [
                    f"Event:{event.get('name') or ''}",
                    f"Category:{event.get('category') or ''}",
                    f"Description:{event.get('description') or ''}",
                    f"Location:{event.get('location') or ''}",
                    f"Date:{event.get('date') or ''}",
                    activity_block,
                ],
            )
        )

    def index_event(self, event: Dict[str, Any], activities: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        event_id = str(event.get("id") or event.get("event_id") or event.get("name") or "new-event")
        document = self._build_document(event, activities)
        embedding = self._build_embedding(document)
        metadata = {
            "event_id": event_id,
            "event_name": event.get("name") or "",
            "category": event.get("category") or "",
            "location": event.get("location") or "",
            "date": event.get("date") or "",
        }

        if self.collection is not None:
            self.collection.delete(where={"event_id": event_id})
            self.collection.add(
                ids=[f"{event_id}-0"],
                embeddings=[embedding],
                documents=[document],
                metadatas=[metadata],
            )

        existing = [doc for doc in self._docs if doc.get("metadata", {}).get("event_id") != event_id]
        existing.append({"id": f"{event_id}-0", "document": document, "embedding": embedding, "metadata": metadata})
        self._docs = existing
        self._save_docs()

        return {"event_id": event_id, "document": document, "metadata": metadata}

    def delete_event(self, event_id: str) -> None:
        if self.collection is not None:
            self.collection.delete(where={"event_id": str(event_id)})
        self._docs = [doc for doc in self._docs if str(doc.get("metadata", {}).get("event_id")) != str(event_id)]
        self._save_docs()

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []

        query_embedding = self._build_embedding(query)

        if self.collection is not None:
            try:
                matches = self.collection.query(query_embeddings=[query_embedding], n_results=limit)
                ids = matches.get("ids", [[]])[0]
                documents = matches.get("documents", [[]])[0]
                metadatas = matches.get("metadatas", [[]])[0]
                results = []
                for item_id, document, metadata in zip(ids, documents, metadatas):
                    results.append({"id": item_id, "document": document, "metadata": metadata or {}})
                if results:
                    return results
            except Exception:
                pass

        scored = []
        for doc in self._docs:
            score = self._cosine_similarity(query_embedding, doc.get("embedding", []))
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        results = []
        for _, doc in scored[:limit]:
            results.append({"id": doc.get("id"), "document": doc.get("document"), "metadata": doc.get("metadata", {})})
        return results

    def _cosine_similarity(self, left: List[float], right: List[float]) -> float:
        if not left or not right:
            return 0.0
        numerator = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(value * value for value in left))
        right_norm = math.sqrt(sum(value * value for value in right))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return numerator / (left_norm * right_norm)

    def build_context(self, query: str, limit: int = 5) -> str:
        results = self.search(query, limit=limit)
        if not results:
            return "No relevant events found."
        return "\n".join(
            [
                f"- {result['document']}"
                for result in results
            ]
        )
