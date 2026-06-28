import os
from pydantic import BaseModel
from pymongo import MongoClient
from auth import create_access_token, get_current_user
class RootLogin(BaseModel):
    username: str
    signature: str

mongo_client = MongoClient(os.getenv("MONGODB_URI"))

# Send a ping to confirm a successful connection
try:
  mongo_client.admin.command('ping')
  print("Main backend successfully connected to database")
except Exception as e:
  print(e)

database = mongo_client['IITI_BOT']
users_collection = database['users']
pending_users_collection = database['pending_users']

@asynccontextmanager
async def lifespan(app: FastAPI):
    # threading.Thread(target=run_pathway, daemon=True).start()
    app.state.http_client = httpx.AsyncClient(timeout=300.0)
    print("HTTP client opened.")
    yield
    await app.state.http_client.aclose()
    print("HTTP client closed.")

# app = FastAPI(lifespan=lifespan)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/rootLogin")
async def rootLogin(user: RootLogin):
    