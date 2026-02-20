
from database import engine
from models import BlogArticle, Base

print("Creating BlogArticle table if not exists...")
Base.metadata.create_all(bind=engine, tables=[BlogArticle.__table__])
print("Done!")
