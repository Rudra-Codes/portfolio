from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, SecurityScopes   
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.exceptions import InvalidSignature
import os, base64
from datetime import datetime, timedelta
from jose import JWTError, jwt
# frpm pydantic import BaseModel, 
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
PUBLIC_KEY = Ed25519PublicKey.from_public_bytes(
    base64.b64decode(os.getenv("PUBLIC_KEY"))
)

credentials = ['email', 'role', 'scopes']
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="rootLogin")

credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
access_exception = HTTPException(
    status_code=403,
    detail="Not have permission to access this."
)


def verify_root(signature:bytes, message:bytes) -> bool:
    try:
        PUBLIC_KEY.verify(signature, message)
        return True
    except InvalidSignature:
        print("Invalid Signature")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(security_scopes: SecurityScopes, token: str = Depends(oauth2_scheme)):
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_scopes = payload.get("scopes", [])
        for credential in credentials:
            if (payload.get(credential) is None):
                raise credentials_exception
        for scope in security_scopes.scopes:
            if scope not in token_scopes:
                raise access_exception
        return payload
    except JWTError:
        raise credentials_exception
    
if __name__ == "__main__":
    PRIVATE_KEY = Ed25519PrivateKey.from_private_bytes(
    base64.b64decode(os.getenv("PRIVATE_KEY"))
    ) # only to check here.
    message = b"username"
    signature = PRIVATE_KEY.sign(message)
    print(verify_root(signature, b"yee"))