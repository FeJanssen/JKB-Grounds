from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    verein_id: str
    geschlecht: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    ist_bestaetigt: bool
    rolle_id: str
    verein_id: str
    geschlecht: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse