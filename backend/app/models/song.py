from sqlalchemy import Column, Integer, String
from app.database import Base

class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    composer_arranger = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    order_index = Column(Integer, nullable=True)  # nullable so existing rows aren't broken; NULLs sort last, by id, until first reorder