from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import base64

# Generate keys
private_key = Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Convert to Base64 text
private_key_text = base64.b64encode(private_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)).decode()

public_key_text = base64.b64encode(
    public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
).decode()

print("Private:", private_key_text)
print("Public :", public_key_text)

# Save to text files
with open("private_key.txt", "w") as f:
    f.write(private_key_text)

with open("public_key.txt", "w") as f:
    f.write(public_key_text)