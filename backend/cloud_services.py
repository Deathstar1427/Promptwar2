"""
Google Cloud Services Integration

This module provides integration with:
- Google Cloud Storage (GCS) - For storing conversation logs and user data
- Google Firestore - For persistent user preferences and session data
- Cloud Logging - Already integrated in main.py

Note: These services require Google Cloud credentials to be configured.
The code gracefully falls back to in-memory storage if credentials are unavailable.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from google.cloud import storage
from google.cloud import firestore

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "election-assistant-data")
FIRESTORE_PROJECT = os.getenv("FIRESTORE_PROJECT", None)


class CloudServices:
    """
    Unified interface for Google Cloud services.
    Provides fallback to local storage when credentials unavailable.
    """
    
    def __init__(self):
        self._storage_client: Optional[storage.Client] = None
        self._firestore_client: Optional[firestore.Client] = None
        self._bucket: Optional[storage.Bucket] = None
        self._initialized = False
        self._local_fallback: Dict[str, Any] = {}
    
    def initialize(self) -> bool:
        """
        Initialize Cloud services. Returns True if successful, False otherwise.
        Falls back to local storage if credentials unavailable.
        """
        if self._initialized:
            return True
            
        # Try to initialize Cloud Storage
        try:
            self._storage_client = storage.Client()
            self._bucket = self._storage_client.bucket(GCS_BUCKET_NAME)
            logger.info(f"Cloud Storage initialized with bucket: {GCS_BUCKET_NAME}")
        except Exception as e:
            logger.warning(f"Cloud Storage not available: {e}. Using local fallback.")
            self._storage_client = None
            self._bucket = None
        
        # Try to initialize Firestore
        try:
            if FIRESTORE_PROJECT:
                self._firestore_client = firestore.Client(project=FIRESTORE_PROJECT)
            else:
                self._firestore_client = firestore.Client()
            logger.info("Firestore initialized successfully")
        except Exception as e:
            logger.warning(f"Firestore not available: {e}. Using local fallback.")
            self._firestore_client = None
        
        self._initialized = True
        return bool(self._storage_client or self._firestore_client)
    
    # ==================== Cloud Storage Methods ====================
    
    async def store_conversation_log(
        self, 
        user_id: str, 
        conversation: Dict[str, Any]
    ) -> bool:
        """
        Store conversation log in Cloud Storage.
        
        Args:
            user_id: Unique user identifier
            conversation: Conversation data to store
            
        Returns:
            bool: True if stored successfully
        """
        if not self._bucket:
            # Fallback to local storage
            self._local_fallback[f"conv_{user_id}"] = conversation
            return True
        
        try:
            blob = self._bucket.blob(f"conversations/{user_id}/{datetime.now().isoformat()}.json")
            blob.upload_from_string(
                json.dumps(conversation),
                content_type="application/json"
            )
            logger.info(f"Stored conversation log for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
            return False
    
    async def get_conversation_history(self, user_id: str) -> Optional[List[Dict]]:
        """
        Retrieve conversation history from Cloud Storage.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            List of conversation entries or None
        """
        if not self._bucket:
            return self._local_fallback.get(f"conv_{user_id}")
        
        try:
            prefix = f"conversations/{user_id}/"
            blobs = list(self._bucket.list_blobs(prefix=prefix))
            
            conversations = []
            for blob in blobs[-10:]:  # Get last 10 conversations
                data = json.loads(blob.download_as_string())
                conversations.append(data)
            
            return conversations if conversations else None
        except Exception as e:
            logger.error(f"Failed to retrieve conversation: {e}")
            return None
    
    # ==================== Firestore Methods ====================
    
    async def save_user_preferences(
        self, 
        user_id: str, 
        preferences: Dict[str, Any]
    ) -> bool:
        """
        Save user preferences in Firestore.
        
        Args:
            user_id: Unique user identifier
            preferences: User preferences to save
            
        Returns:
            bool: True if saved successfully
        """
        if not self._firestore_client:
            # Fallback to local storage
            self._local_fallback[f"pref_{user_id}"] = preferences
            return True
        
        try:
            doc_ref = self._firestore_client.collection("users").document(user_id)
            doc_ref.set({
                "preferences": preferences,
                "updated_at": datetime.now().isoformat()
            }, merge=True)
            logger.info(f"Saved user preferences for: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to save preferences: {e}")
            return False
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user preferences from Firestore.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            User preferences or None
        """
        if not self._firestore_client:
            return self._local_fallback.get(f"pref_{user_id}")
        
        try:
            doc_ref = self._firestore_client.collection("users").document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict().get("preferences")
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve preferences: {e}")
            return None
    
    async def save_session_data(
        self, 
        session_id: str, 
        data: Dict[str, Any]
    ) -> bool:
        """
        Save session data in Firestore.
        
        Args:
            session_id: Unique session identifier
            data: Session data to save
            
        Returns:
            bool: True if saved successfully
        """
        if not self._firestore_client:
            self._local_fallback[f"session_{session_id}"] = data
            return True
        
        try:
            doc_ref = self._firestore_client.collection("sessions").document(session_id)
            doc_ref.set({
                "data": data,
                "created_at": datetime.now().isoformat()
            }, merge=True)
            return True
        except Exception as e:
            logger.error(f"Failed to save session: {e}")
            return False
    
    @property
    def is_available(self) -> bool:
        """Check if any Cloud services are available."""
        return self._initialized and (self._storage_client is not None or self._firestore_client is not None)


# Global instance
cloud_services = CloudServices()

# Initialize on module load
try:
    cloud_services.initialize()
except Exception as e:
    logger.warning(f"Cloud services initialization deferred: {e}")