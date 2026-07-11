import os
from psycopg_pool import ConnectionPool
from psycopg import sql
from psycopg.rows import dict_row
from dotenv import load_dotenv 
load_dotenv()

class Database:
    def __init__(self, min= 2, max = 5):
        self.pool = ConnectionPool(
            conninfo=f"host=localhost port=5432 dbname=myusers user=myterminal password={os.getenv('POSTGRES_PASSWORD')}",
            min_size=min,
            max_size=max,
        )
        self.ALLOWED_TABLES = ['identity', 'pending_users']
    
    # def check_user_exist_identity(self, username: str, email: str) -> bool:
    #     """Returns True if the user exists."""
    #     with self.pool.connection() as conn:
    #         with conn.cursor() as cur:
    #             cur.execute(
    #                 "SELECT EXISTS(SELECT 1 FROM IDENTITY WHERE username = %s or email = %s)",
    #                 (username, email),
    #             )
    #             return cur.fetchone()[0]
            
    def get_user(self, table:str, username: str) -> dict:
        if table not in self.ALLOWED_TABLES:
            raise ValueError(f"Invalid table: {table}")
        """Returns True if the user exists."""
        with self.pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = sql.SQL("SELECT * FROM {table} WHERE username = %s;").format(table=sql.Identifier(table))
                cur.execute(
                    query,
                    (username,),
                )
                return cur.fetchone()
            
    def check_user_exist(self, table: str, username: str, email: str | None = None) -> bool:
        if table not in self.ALLOWED_TABLES:
            raise ValueError(f"Invalid table: {table}")

        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                query = sql.SQL("""
                    SELECT EXISTS(
                        SELECT 1
                        FROM {table}
                        WHERE username = %s
                        OR (%s::VARCHAR(30) IS NOT NULL AND email = %s)
                    );
                """).format(table=sql.Identifier(table))

                cur.execute(query, (username, email, email))
                return cur.fetchone()[0]

    def add_user_identity(self, username: str, email: str, name: str, password :str, phone: str = None, member_type:str = None, department:str = None) -> bool:
        """
        Adds a user if they don't already exist.
        Returns True if inserted, False if already exists.
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO IDENTITY
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING username;
                    """,
                    (username, email, name, password, phone, member_type, department, True),
                )

                inserted = cur.fetchone()

            conn.commit()

        return inserted is not None
    
    def add_user_pending(self, username: str, email: str, name: str, password: str, otp: int, phone_number: str = None, member_type:str = None, department:str = None) -> bool:
        """
        Adds a user if they don't already exist.
        Returns True if inserted, False if already exists.
        """
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO PENDING_USERS
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING username;
                    """,
                    (username, email, name, password, phone_number, member_type, department, otp),
                )

                inserted = cur.fetchone()

            conn.commit()

        return inserted is not None

    def delete_user(self, table:str, username: str) -> bool:
        """
        Deletes a user.
        Returns True if a row was deleted.
        """
        if table not in self.ALLOWED_TABLES:
            raise ValueError(f"Invalid table: {table}")

        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                query = sql.SQL("DELETE FROM {table} WHERE username = %s").format(table=sql.Identifier(table))

                cur.execute(query, (username,))
                deleted = cur.rowcount
            conn.commit()
        return deleted > 0


if __name__ == '__main__':
    from auth import get_password_hash 

    test = Database(min=1, max=1)
    print(test.add_user_identity('test', 'test@rudrachitkara.dev', 'test', get_password_hash('test')))
    print(test.check_user_exist('identity', 'rudra'))
    test.pool.close()

        