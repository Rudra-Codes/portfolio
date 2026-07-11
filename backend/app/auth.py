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
import bcrypt
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# frpm pydantic import BaseModel, 
from dotenv import load_dotenv

load_dotenv()

credentials = ['username', 'role', 'scopes']
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="MyTerminal")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")



class authentication:
    def __init__(self):
        
        self._SECRET_KEY = os.getenv("SECRET_KEY")
        self._ALGORITHM = "HS256"
        self._ACCESS_TOKEN_EXPIRE_DAYS = 7
        self._PUBLIC_KEY = Ed25519PublicKey.from_public_bytes(
            base64.b64decode(os.getenv("PUBLIC_KEY"))
        )
        self.credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        self.access_exception = HTTPException(
        status_code=403,
        detail="Not have permission to access this."
        )
    def get_password_hash(self, password: str) -> str:
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            password_bytes = plain_password.encode('utf-8')[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception:
            return False

    def verify_root(self, message:bytes, signature:bytes) -> bool:
        try:
            self._PUBLIC_KEY.verify(signature, message)
            return True
        except InvalidSignature:
            print("Invalid Signature")
            return False

    def create_access_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self._ACCESS_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self._SECRET_KEY, algorithm=self._ALGORITHM)

    def debug_get_user(self, token):
        return jwt.decode(token, self._SECRET_KEY, algorithms=[self._ALGORITHM])

    def get_current_user(self, security_scopes: SecurityScopes, token: str = Depends(oauth2_scheme)):
        
        try:
            payload = jwt.decode(token, self._SECRET_KEY, algorithms=[self._ALGORITHM])
            token_scopes = payload.get("scopes", [])
            for credential in credentials:
                if (payload.get(credential) is None):
                    raise self.credentials_exception
            if 'root' not in token_scopes:
                for scope in security_scopes.scopes:
                    if scope not in token_scopes:
                        raise self.access_exception
            return payload
        except JWTError:
            raise self.credentials_exception
    
    def send_otp_email(self, receiver_email: str, otp: str | int):
        # sender_email
        password = os.getenv("app_password")

        message = MIMEMultipart("alternative")
        message["Subject"] = "OTP for Rudra Terminal"
        message["From"] = f"Rudra Terminal <{SENDER_EMAIL}>"
        message["To"] = receiver_email

        html_content = f"Your OTP is <strong>{otp}</strong>. Enjoy using my terminal!!!"
        part = MIMEText(html_content, "html")
        message.attach(part)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(SENDER_EMAIL, password)
            server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
if __name__ == "__main__":
    # This was prior to class wrapping ... 
    # PRIVATE_KEY = Ed25519PrivateKey.from_private_bytes(
    # base64.b64decode(os.getenv("PRIVATE_KEY"))
    # ) # only to check here.
    # message = b"username"
    # signature = PRIVATE_KEY.sign(message)
    # print(verify_root(signature, b"yee"))

    auth = authentication()
    auth.send_otp_email('mc240041031@iiti.ac.in', 1234)