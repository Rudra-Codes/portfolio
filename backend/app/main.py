import os, base64
from pydantic import BaseModel
# from pymongo import MongoClient
from contextlib import asynccontextmanager
from fastapi import FastAPI, Security, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
# import httpx
import random
from app.auth import authentication
from app.database import Database


class RootLogin(BaseModel):
    username: str
    signature: str

class User(BaseModel):
	username: str
	email: str
	name: str
	password: str
	phone_number: str | None = None
	member_type: str | None = None
	department: str | None = None
	
class CheckUser(BaseModel):
	username : str
	email : str

class UserCredentials(BaseModel):
	username: str
	password: str

class OTPVerify(BaseModel):
    username: str
    otp: int
# mongo_client = MongoClient(os.getenv("MONGODB_URI"))

# # Send a ping to confirm a successful connection
# try:
#   mongo_client.admin.command('ping')
#   print("Main backend successfully connected to database")
# except Exception as e:
#   print(e)

# database = mongo_client['IITI_BOT']
# users_collection = database['users']
# pending_users_collection = database['pending_users']

db = Database()
auth = authentication()
@asynccontextmanager
async def lifespan(app: FastAPI):
    # app.state.http_client = httpx.AsyncClient(timeout=300.0)
    # print("HTTP client opened.")
    db.pool.open()
    yield
    db.pool.close()
    # await app.state.http_client.aclose()
    # print("HTTP client closed.")
    

app = FastAPI(lifespan=lifespan)
# app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login/root")
async def rootLogin(user: RootLogin):
	status = auth.verify_root(user.username.encode('utf-8'), base64.b64decode(user.signature))
	if not status:
		raise HTTPException(status_code=401, detail='Wrong key')
	return {'token':auth.create_access_token({'username':'rudra', 'role':'rudra', 'scopes':['root']}), "token_type": "bearer"}

@app.get("/get-user")
async def getUser(user = Security(auth.get_current_user, scopes=['user'])):
	user.pop('scopes')
	user.pop('exp')
	return user

@app.post("/check-user")
async def checkUser(user : CheckUser):
	if db.check_user_exist('pending_users', user.username, user.email):
		raise HTTPException(status_code=403, detail="Already signed in but email not verified. Please verify email.")
	
	if db.check_user_exist('identity', user.username, user.email) :
		raise HTTPException(status_code=401, detail="User with same username or email already exists.")
	return {"message": "Good to go."}

@app.post("/signup")
async def signup(user: User, background_tasks: BackgroundTasks):
	if db.check_user_exist('pending_users', user.username, user.email):
		raise HTTPException(status_code=403, detail="Email not verified. Please verify OTP.")
	
	if db.check_user_exist('identity', user.username, user.email) :
		raise HTTPException(status_code=401, detail="User with same username or password already exists.")
	
	hashed_password = auth.get_password_hash(user.password)
	otp = random.randint(100000, 999999)
	
	if db.add_user_pending(user.username, user.email, user.name, hashed_password, otp, user.phone_number, user.member_type, user.department) is False:
		raise HTTPException(status_code=500, detail='Error in feeding data to database.')
	background_tasks.add_task(auth.send_otp_email, user.email, otp)

	return {"message": "OTP sent to your email. Please verify to complete registration."}	

@app.post("/verify-email")
async def verify_email(data: OTPVerify):
	if db.check_user_exist('identity', data.username) :
		raise HTTPException(status_code=401, detail="User with same username already exists.")

	user_details = db.get_user('pending_users', data.username)
	if not user_details:
		raise HTTPException(status_code=404, detail="User not found.")

	if data.otp != user_details['otp']:
		raise HTTPException(status_code=400, detail="Invalid OTP.")

	user_details.pop("otp")
	# user_details["is_verified"] = True
	# user_details["chats"] = []
	db.add_user_identity(**user_details)
	db.delete_user('pending_users', data.username)

	return {"message": "Email verified successfully!"}

@app.post("/login/user")
async def userLogin(user: UserCredentials):
	if db.check_user_exist('pending_users', user.username):
		raise HTTPException(status_code=403, detail="Email not verified. Please verify OTP.")
	user_details = db.get_user('identity', user.username)
	if user_details is None:
		raise HTTPException(status_code=401, detail="User not exist")
	if auth.verify_password(user.password, user_details['password']):
		token = auth.create_access_token({"username": user.username, "role": "user", "scopes": ['user']})
		print(auth.debug_get_user(token))
		return {"token": token, "token_type": "bearer"}
	
	raise HTTPException(status_code=401, detail="Wrong Password")

@app.delete("/pending-user/{username}")
async def delete_user(username: str):
	db.delete_user('pending_users', username)
	return {"message": "Success"}
